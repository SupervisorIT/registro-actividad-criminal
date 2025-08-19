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
            usuarioInfo.textContent = `${nombreMostrar}${cedulaMostrar}`;
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
