// Verificar si hay una sesión activa (exclusivamente remota cuando hay backend configurado)
document.addEventListener('DOMContentLoaded', function() {
    const base = (typeof localStorage !== 'undefined' && localStorage.getItem('AUTH_API_BASE')) || '';
    const token = sessionStorage.getItem('authToken');
    const usuarioActivo = sessionStorage.getItem('usuarioActivo');

    // Si hay backend configurado, exigir token y datos de usuario
    if (base) {
        if (!(token && usuarioActivo)) {
            window.location.href = 'login.html';
            return;
        }
    } else {
        // Sin backend configurado, también redirigimos para evitar uso local
        if (!usuarioActivo) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Render de información de usuario
    try {
        const usuario = JSON.parse(usuarioActivo);
        const usuarioInfo = document.getElementById('usuarioInfo');
        if (usuarioInfo) {
            const nombreMostrar = usuario.nombreCompleto || usuario.nombre || usuario.username;
            const cedulaMostrar = usuario.cedula ? ` — ${usuario.cedula}` : '';
            const empresaMostrar = (usuario.empresa && String(usuario.empresa).trim()) ? usuario.empresa : 'Sin empresa';
            usuarioInfo.innerHTML = `${nombreMostrar}${cedulaMostrar}<br><span style="color:#666; font-weight: normal;">${empresaMostrar}</span>`;
        }

        // Guardar username para uso en otras páginas (no afecta autenticación)
        localStorage.setItem('usuarioActual', usuario.username);

        // Mostrar u ocultar elementos según el rol del usuario
        const adminElements = document.querySelectorAll('.admin-only');
        if (usuario.rol === 'admin') {
            adminElements.forEach(el => { el.style.display = 'inline-block'; });
        } else {
            adminElements.forEach(el => { el.style.display = 'none'; });
        }

        // --- Control de duración de sesión: 1 hora con posibilidad de extender ---
        try {
            inicializarControlSesionUnaHora(usuario);
        } catch (e) { console.warn('No se pudo inicializar el control de sesión:', e); }
    } catch (error) {
        console.error('Error al procesar la información del usuario:', error);
    }
});

// Función para cerrar sesión
function cerrarSesion() {
    // Limpiar información de sesión remota
    sessionStorage.removeItem('usuarioActivo');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authOrigin');
    localStorage.removeItem('usuarioActual');

    // Mantener AUTH_API_BASE para siguientes inicios de sesión
    window.location.href = 'login.html';
}

// -----------------------
// Control de sesión a 1 hora
// -----------------------
function inicializarControlSesionUnaHora(usuario) {
    const HORA_MS = 60 * 60 * 1000;
    const GRACIA_MS = 60 * 1000; // 60s para responder

    // 1) Determinar el inicio/expiración actual
    const ahora = Date.now();
    let inicio = Number(usuario?.timestamp || 0);
    if (!inicio || Number.isNaN(inicio)) inicio = ahora;

    // Si ya existe una expiración persistida, úsala; si no, calcúlala desde inicio
    let expiracion = Number(sessionStorage.getItem('sessionExpiry') || 0);
    if (!expiracion || expiracion < inicio) {
        expiracion = inicio + HORA_MS;
        sessionStorage.setItem('sessionExpiry', String(expiracion));
    }

    // 2) Programar el aviso cuando llegue a la hora (si ya pasó, mostrar de inmediato)
    programarAviso(expiracion - ahora);

    function programarAviso(msRestantes) {
        const delay = Math.max(0, msRestantes);
        // Limpiar cualquier timer previo
        if (window.__sessionAvisoTimer) clearTimeout(window.__sessionAvisoTimer);
        window.__sessionAvisoTimer = setTimeout(() => {
            mostrarModalRenovarSesion();
        }, delay);
    }

    function extenderUnaHora() {
        const nuevaExp = Date.now() + HORA_MS;
        sessionStorage.setItem('sessionExpiry', String(nuevaExp));
        ocultarModalRenovarSesion();
        programarAviso(HORA_MS); // próximo aviso en 1 hora
        // Opcional: ping de mantenimiento si existe endpoint
        const token = sessionStorage.getItem('authToken');
        const base = (localStorage.getItem('AUTH_API_BASE') || '').replace(/\/$/, '');
        if (token && base) {
            try { fetch(base + '/auth/keepalive', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).catch(()=>{}); } catch {}
        }
    }

    function mostrarModalRenovarSesion() {
        // Crear modal liviano si no existe
        let modal = document.getElementById('sessionRenewModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sessionRenewModal';
            modal.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);z-index:9999;';
            modal.innerHTML = `
                <div style="background:#fff;border-radius:8px;max-width:420px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,.2);overflow:hidden;font-family:system-ui,Segoe UI,Roboto,Arial">
                    <div style="padding:16px 18px;border-bottom:1px solid #e6eaf0;font-weight:600;color:#1f2937;">Sesión a punto de expirar</div>
                    <div style="padding:16px 18px;color:#374151;line-height:1.45;">
                        Tu sesión alcanzó 1 hora de uso. ¿Deseas mantenerla por 1 hora más?<br>
                        <span id="sessionRenewCountdown" style="display:inline-block;margin-top:6px;color:#6b7280;font-size:13px;">Se cerrará automáticamente en 60s…</span>
                    </div>
                    <div style="padding:12px 18px;display:flex;gap:10px;justify-content:flex-end;background:#f9fafb;border-top:1px solid #e6eaf0;">
                        <button id="btnCerrarSesionAuto" style="background:#ef4444;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Cerrar sesión</button>
                        <button id="btnMantenerSesion" style="background:#0ea5e9;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Mantener 1 hora</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            document.getElementById('btnMantenerSesion').onclick = extenderUnaHora;
            document.getElementById('btnCerrarSesionAuto').onclick = () => { ocultarModalRenovarSesion(); cerrarSesion(); };
        } else {
            modal.style.display = 'flex';
        }

        // Iniciar cuenta regresiva de gracia y, al terminar, cerrar sesión si no hubo interacción
        iniciarCuentaRegresiva(GRACIA_MS, () => { ocultarModalRenovarSesion(); cerrarSesion(); });
    }

    function ocultarModalRenovarSesion() {
        const modal = document.getElementById('sessionRenewModal');
        if (modal) modal.style.display = 'none';
        if (window.__sessionGraceTimer) clearInterval(window.__sessionGraceTimer);
    }

    function iniciarCuentaRegresiva(ms, alFinalizar) {
        const label = document.getElementById('sessionRenewCountdown');
        let restante = Math.ceil(ms / 1000);
        if (window.__sessionGraceTimer) clearInterval(window.__sessionGraceTimer);
        window.__sessionGraceTimer = setInterval(() => {
            restante -= 1;
            if (label) label.textContent = `Se cerrará automáticamente en ${restante}s…`;
            if (restante <= 0) {
                clearInterval(window.__sessionGraceTimer);
                try { alFinalizar && alFinalizar(); } catch {}
            }
        }, 1000);
    }
}
