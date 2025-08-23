// Funcionalidades de administración
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario es administrador
    const usuarioActivo = sessionStorage.getItem('usuarioActivo');
    if (!usuarioActivo) return;
    
    const usuario = JSON.parse(usuarioActivo);
    if (usuario.rol !== 'admin') return;
});

// Abrir Panel de Administración (modal en index.html con id "adminPanelModal")
function abrirModalAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    if (!modal) {
        alert('No se encontró el Panel de Administración en el HTML.');
        return;
    }
    modal.style.display = 'block';
    // Cargar lista de usuarios para este panel
    cargarUsuariosAdminPanel();
}

// Descargar plantilla CSV para carga masiva
function descargarPlantillaCSV() {
    const headers = 'username,password,rol,nombreCompleto,correo,empresa,celular,activo\n';
    const ejemplo = [
        'juan,clave123,usuario,Juan Pérez,juan@acme.com,ACME,6000-0000,true',
        'ana,pass456,admin,Ana López,ana@acme.com,ACME,6111-1111,true'
    ].join('\n');
    const contenido = headers + ejemplo + '\n';
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-usuarios.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Cargar un archivo CSV y volcar su contenido al textarea
function cargarCSVDesdeArchivo(input) {
    try {
        const file = input && input.files && input.files[0];
        if (!file) return;
        if (!/\.csv$/i.test(file.name)) {
            if (!confirm('El archivo no tiene extensión .csv. ¿Desea continuar de todas formas?')) return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = (e.target && e.target.result) ? String(e.target.result) : '';
            const ta = document.getElementById('adminBulkText');
            if (ta) {
                ta.value = text.replace(/\r\n/g, '\n');
            }
            const msg = document.getElementById('adminBulkMsg');
            if (msg) {
                msg.style.display = 'block';
                msg.style.padding = '8px';
                msg.style.borderRadius = '6px';
                msg.style.marginTop = '4px';
                msg.style.background = '#fff8e1';
                msg.style.color = '#8d6e63';
                msg.style.border = '1px solid #ffe0b2';
                msg.textContent = 'Archivo CSV cargado en el área de texto. Revise y presione "Cargar usuarios".';
            }
        };
        reader.onerror = function() {
            alert('No se pudo leer el archivo CSV.');
        };
        reader.readAsText(file, 'utf-8');
        // Limpiar el input para permitir volver a cargar el mismo archivo si se desea
        input.value = '';
    } catch (e) {
        console.warn('Error cargando CSV:', e);
        alert('Error cargando CSV: ' + (e && e.message || e));
    }
}

// Abrir modal independiente para crear usuario
function abrirModalCrearUsuario() {
    const modal = document.getElementById('adminCrearUsuarioModal');
    if (!modal) { alert('No se encontró el modal de creación de usuario.'); return; }
    // Limpiar campos
    const nc = document.getElementById('nuevoNombreCompleto');
    const u = document.getElementById('nuevoUsuario');
    const p = document.getElementById('nuevaContrasena');
    const co = document.getElementById('nuevoCorreo');
    const em = document.getElementById('nuevaEmpresa');
    const ce = document.getElementById('nuevoCelular');
    const r = document.getElementById('nuevoRol');
    if (nc) nc.value = '';
    if (u) u.value = '';
    if (p) p.value = '';
    if (co) co.value = '';
    if (em) em.value = '';
    if (ce) ce.value = '';
    if (r) r.value = 'usuario';
    modal.style.display = 'block';
}

// Funciones para mostrar los modales
function mostrarGestionUsuarios() {
    const modal = document.getElementById('usuariosModal');
    modal.style.display = 'block';
    cargarUsuarios();
}

// Cargar usuarios y renderizarlos dentro del Panel de Administración (sin botón Perfil)
// Si forceRemote=true, intenta exclusivamente el backend remoto (Render) y no hace fallback silencioso.
async function cargarUsuariosAdminPanel(forceRemote = false) {
    const cont = document.getElementById('adminUsuariosLista');
    const origenBadge = document.getElementById('adminOrigenBadge');
    const totalSpan = document.getElementById('adminTotalUsuarios');
    if (!cont) return;
    cont.innerHTML = '';

    // Asegurar base remota como en login.js
    let base = localStorage.getItem('AUTH_API_BASE') || '';
    try {
        if (!base) {
            const host = (location && location.hostname) ? location.hostname : '';
            if (host.includes('onrender.com') || host === 'localhost' || host === '127.0.0.1') {
                base = 'https://rac-auth-api.onrender.com';
                try { localStorage.setItem('AUTH_API_BASE', base); } catch {}
            }
        }
    } catch(_) {}

    const token = sessionStorage.getItem('authToken');
    let origen = 'Local';
    let lista = [];

    if (base && token) {
        const baseURL = base.replace(/\/$/, '');
        const headers = { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' };
        try {
            let resp = await fetch(baseURL + '/users', { method: 'GET', headers });
            if (!resp.ok) {
                // Intento alternativo con prefijo /api
                resp = await fetch(baseURL + '/api/users', { method: 'GET', headers });
            }
            if (resp.status === 401) {
                cont.innerHTML = '<div style="color:#b91c1c;">No autenticado. Inicie sesión nuevamente.</div>';
                if (forceRemote) return; // no continuar a local si se fuerza remoto
            }
            if (resp.status === 403) {
                cont.innerHTML = '<div style="color:#b45309;">Acceso restringido. Se requiere rol administrador para listar usuarios.</div>';
                if (forceRemote) return;
            }
            if (resp.ok) {
                const data = await resp.json();
                if (Array.isArray(data)) {
                    lista = data;
                    origen = 'Remoto';
                }
                if (forceRemote) {
                    // Si se forzó, no usar fallback aunque la lista esté vacía
                    if (!lista.length) {
                        cont.innerHTML = '<div style="color:#b45309;">Sin usuarios desde el servidor remoto.</div>';
                        if (origenBadge) origenBadge.textContent = 'Origen: Remoto';
                        if (totalSpan) totalSpan.textContent = '0';
                        return;
                    }
                }
            }
        } catch(e) {
            // continuar a fallback local
            console.warn('Listado remoto de usuarios falló, usando fallback local:', e);
            if (forceRemote) {
                cont.innerHTML = '<div style="color:#b91c1c;">Fallo al obtener usuarios desde el servidor remoto. Detalle en consola.</div>';
                if (origenBadge) origenBadge.textContent = 'Origen: Remoto (error)';
                return;
            }
        }
    } else if (forceRemote) {
        // No hay configuración remota o token cuando se fuerza
        cont.innerHTML = '<div style="color:#b91c1c;">No hay backend remoto configurado o sesión inválida. Configure AUTH_API_BASE e inicie sesión.</div>';
        if (origenBadge) origenBadge.textContent = 'Origen: Remoto (no configurado)';
        return;
    }

    if (!lista.length) {
        // Fallback local
        const predef = [
            { username: 'admin', nombre: 'Administrador', rol: 'admin', nombreCompleto: 'Administrador del Sistema' },
            { username: 'usuario', nombre: 'Usuario Estándar', rol: 'usuario', nombreCompleto: 'Usuario Estándar' }
        ];
        lista = [...predef];
        const guardados = localStorage.getItem('usuariosRegistrados');
        if (guardados) {
            try { lista = [...lista, ...JSON.parse(guardados)]; } catch(_){}
        }
    }

    // Render con filtro de inactivos
    if (origenBadge) origenBadge.textContent = `Origen: ${origen}`;
    const verInactivos = (document.getElementById('adminVerInactivos')?.checked) || false;
    const listaFiltrada = lista.filter(u => verInactivos ? true : (u.activo !== false));
    if (totalSpan) totalSpan.textContent = String(listaFiltrada.length);

    const frag = document.createDocumentFragment();
    listaFiltrada.forEach(u => {
        const item = document.createElement('div');
        item.className = 'admin-user-item';
        item.style.cssText = 'background:#fff;border:1px solid #e6eaf0;border-radius:8px;padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;';

        const info = document.createElement('div');
        const inactivo = (u.activo === false);
        const badge = inactivo ? ' <span style="margin-left:6px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;padding:1px 6px;border-radius:999px;font-size:11px;">Inactivo</span>' : '';
        info.innerHTML = `<div style="font-weight:700;">${(u.username||'')} — ${((u.rol||'usuario')==='admin'?'Administrador':'Usuario')}${badge}</div>
                          <div style="color:#666;">${(u.nombreCompleto||u.nombre||'')}</div>`;
        // Empresa debajo del nombre, mismo estilo gris (mostrar aunque esté vacía)
        const divEmpresa = document.createElement('div');
        divEmpresa.style.cssText = 'color:#666;';
        divEmpresa.textContent = (u.empresa && u.empresa.trim()) ? u.empresa : 'Sin empresa';
        info.appendChild(divEmpresa);
        if (inactivo) { item.style.opacity = '0.7'; }

        const acciones = document.createElement('div');
        // Switch rápido activar/desactivar
        const wrapSwitch = document.createElement('label');
        wrapSwitch.style.cssText = 'margin-left:10px; display:inline-flex; align-items:center; gap:6px; font-size:12px; color:#334155;';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = (u.activo !== false);
        chk.title = chk.checked ? 'Desactivar usuario' : 'Activar usuario';
        chk.onchange = async () => {
            const nuevoActivo = !!chk.checked;
            const prev = !nuevoActivo; // para revertir si falla
            chk.disabled = true;
            try {
                await cambiarEstadoUsuario(String(u.username||''), nuevoActivo);
                // refrescar lista según filtro
                await cargarUsuariosAdminPanel();
            } catch (e) {
                alert('No se pudo cambiar el estado: ' + (e && e.message || e));
                chk.checked = prev;
            } finally {
                chk.disabled = false;
            }
        };
        const txt = document.createElement('span');
        txt.textContent = 'Activo';
        wrapSwitch.appendChild(chk);
        wrapSwitch.appendChild(txt);
        acciones.appendChild(wrapSwitch);

        const linkPerfil = document.createElement('a');
        linkPerfil.href = 'javascript:void(0)';
        linkPerfil.textContent = 'Perfil';
        linkPerfil.style.cssText = 'margin-left:10px;color:#1565C0;text-decoration:underline;';
        linkPerfil.onclick = () => {
            if (typeof abrirModalPerfilUsuario === 'function') {
                abrirModalPerfilUsuario(String(u.username||''));
            } else {
                alert('Función de perfil no disponible.');
            }
        };
        acciones.appendChild(linkPerfil);

        item.appendChild(info);
        item.appendChild(acciones);
        frag.appendChild(item);
    });

    cont.appendChild(frag);
}

// Cambiar estado activo/inactivo en backend (o local como fallback)
async function cambiarEstadoUsuario(username, activo) {
    if (!username) throw new Error('Usuario inválido');
    const base = localStorage.getItem('AUTH_API_BASE');
    const token = sessionStorage.getItem('authToken');
    if (base && token) {
        const resp = await fetch(base.replace(/\/$/, '') + '/users/' + encodeURIComponent(username), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ activo })
        });
        if (!resp.ok) {
            const t = await resp.text().catch(()=> '');
            throw new Error(t || ('HTTP ' + resp.status));
        }
        return;
    }
    // Fallback local
    try {
        const guardados = JSON.parse(localStorage.getItem('usuariosRegistrados')||'[]');
        const idx = guardados.findIndex(u => u.username === username);
        if (idx !== -1) {
            guardados[idx].activo = !!activo;
            localStorage.setItem('usuariosRegistrados', JSON.stringify(guardados));
        }
    } catch(_){ /* ignore */ }
}

// Función mostrarCambioContrasena eliminada: cambio de contraseña se realiza desde el Perfil de Usuario

function mostrarHistorialReportes() {
    const modal = document.getElementById('reportesModal');
    modal.style.display = 'block';
    cargarHistorialReportes();
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Cerrar modales al hacer clic fuera de ellos
window.onclick = function(event) {
    const modales = document.getElementsByClassName('modal-admin');
    for (let i = 0; i < modales.length; i++) {
        if (event.target === modales[i]) {
            modales[i].style.display = 'none';
        }
    }
};

// Funciones para gestión de usuarios
async function cargarUsuarios() {
    const tablaUsuarios = document.getElementById('tablaUsuarios').getElementsByTagName('tbody')[0];
    tablaUsuarios.innerHTML = '';

    // Helper para renderizar filas
    const renderUsuarios = (lista) => {
        lista.forEach(usuario => {
            const fila = tablaUsuarios.insertRow();

            const celdaUsuario = fila.insertCell(0);
            celdaUsuario.textContent = usuario.username || usuario.usuario || usuario.email || '';

            const celdaNombre = fila.insertCell(1);
            celdaNombre.textContent = usuario.nombre || usuario.nombreCompleto || usuario.name || '';

            const celdaRol = fila.insertCell(2);
            const rolValor = usuario.rol || usuario.role || 'usuario';
            celdaRol.textContent = rolValor === 'admin' ? 'Administrador' : 'Usuario estándar';

            const celdaAcciones = fila.insertCell(3);
            // No permitir eliminar usuarios predefinidos locales
            const usernameVal = usuario.username || '';
            if (usernameVal === 'admin' || usernameVal === 'usuario') {
                celdaAcciones.innerHTML = '<span style="color: #999; font-style: italic;">Predefinido</span>';
            } else {
                celdaAcciones.innerHTML = '<button class="btn btn-sm btn-danger" onclick="eliminarUsuario(\'' + (usernameVal || '') + '\')"><i class="fas fa-trash"></i></button>';
            }
        });
    };

    // Intentar obtener desde API remota
    const base = localStorage.getItem('AUTH_API_BASE');
    const token = sessionStorage.getItem('authToken');

    if (base && token) {
        try {
            const resp = await fetch(base.replace(/\/$/, '') + '/users', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });

            if (resp.ok) {
                const data = await resp.json();
                if (Array.isArray(data)) {
                    renderUsuarios(data); // usar remoto incluso si está vacío
                    return; // Éxito remoto, no usar fallback
                }
            }
            // Si no ok o sin datos, continuar a fallback
        } catch (e) {
            // Silenciar error y usar fallback local
        }
    }

    // Fallback local: predefinidos + localStorage
    let listaUsuarios = [];

    const usuariosPredefinidos = [
        { username: "admin", password: "admin123", nombre: "Administrador", rol: "admin" },
        { username: "usuario", password: "usuario123", nombre: "Usuario Estándar", rol: "usuario" }
    ];

    listaUsuarios = [...usuariosPredefinidos];

    const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
    if (usuariosGuardados) {
        const usuariosParsed = JSON.parse(usuariosGuardados);

        const usuariosPredefinidosMap = {};
        usuariosPredefinidos.forEach(u => {
            usuariosPredefinidosMap[u.username] = true;
        });

        usuariosParsed.forEach(u => {
            if (!usuariosPredefinidosMap[u.username]) {
                listaUsuarios.push(u);
            }
        });
    }

    renderUsuarios(listaUsuarios);
}

function agregarUsuario() {
    const username = document.getElementById('nuevoUsuario').value.trim();
    const nombreCompleto = document.getElementById('nuevoNombreCompleto').value.trim();
    const correo = document.getElementById('nuevoCorreo').value.trim();
    const empresa = document.getElementById('nuevaEmpresa').value.trim();
    const celular = document.getElementById('nuevoCelular').value.trim();
    const password = document.getElementById('nuevaContrasena').value.trim();
    const rol = document.getElementById('nuevoRol').value;
    
    // Validar campos
    if (!username || !password) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    // Verificar que el usuario no exista
    let listaUsuarios = [];
    
    // Agregar usuarios predefinidos para verificación
    const usuariosPredefinidos = [
        { username: "admin", password: "admin123", nombre: "Administrador", rol: "admin" },
        { username: "usuario", password: "usuario123", nombre: "Usuario Estándar", rol: "usuario" }
    ];
    
    listaUsuarios = [...usuariosPredefinidos];
    
    // Agregar usuarios guardados en localStorage
    const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
    if (usuariosGuardados) {
        listaUsuarios = [...listaUsuarios, ...JSON.parse(usuariosGuardados)];
    }
    
    // Verificar si el usuario ya existe
    if (listaUsuarios.some(u => u.username === username)) {
        alert('El nombre de usuario ya existe');
        return;
    }
    
    // Crear SOLO en backend remoto
    (async () => {
        const base = localStorage.getItem('AUTH_API_BASE');
        const token = sessionStorage.getItem('authToken');
        if (!(base && token)) {
            alert('No hay backend remoto configurado o sesión inválida. Configure AUTH_API_BASE e inicie sesión.');
            return;
        }
        try {
            const resp = await fetch(base.replace(/\/$/, '') + '/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    username,
                    password,
                    rol,
                    // Derivar nombre corto del nombre completo (opcional)
                    nombre: nombreCompleto || undefined,
                    nombreCompleto: nombreCompleto || undefined,
                    correo: correo || undefined,
                    empresa: empresa || undefined,
                    celular: celular || undefined
                })
            });
            if (!resp.ok) {
                const t = await resp.text().catch(() => '');
                alert('No se pudo crear el usuario en el servidor: ' + (t || resp.status));
                return;
            }
            // Limpiar campos
            document.getElementById('nuevoNombreCompleto').value = '';
            document.getElementById('nuevoUsuario').value = '';
            document.getElementById('nuevaContrasena').value = '';
            document.getElementById('nuevoCorreo').value = '';
            document.getElementById('nuevaEmpresa').value = '';
            document.getElementById('nuevoCelular').value = '';
            document.getElementById('nuevoRol').value = 'usuario';
            // Cerrar modal si existe
            const modal = document.getElementById('adminCrearUsuarioModal');
            if (modal) modal.style.display = 'none';
            // Refrescar lista del panel si está abierto
            if (typeof cargarUsuariosAdminPanel === 'function') {
                await cargarUsuariosAdminPanel();
            }
            alert('Usuario creado en servidor correctamente');
        } catch (e) {
            console.warn('Error creando usuario remoto:', e);
            alert('Error creando usuario en el servidor: ' + (e && e.message || e));
        }
    })();
}

function eliminarUsuario(username) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) {
        return;
    }

    (async () => {
        const base = localStorage.getItem('AUTH_API_BASE');
        const token = sessionStorage.getItem('authToken');
        if (base && token) {
            try {
                // No hay endpoint DELETE; usar desactivación lógica
                const resp = await fetch(base.replace(/\/$/, '') + '/users/' + encodeURIComponent(username) + '/state', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ activo: false })
                });
                if (!resp.ok) {
                    const t = await resp.text().catch(() => '');
                    alert('No se pudo desactivar el usuario en el servidor: ' + (t || resp.status));
                } else {
                    await cargarUsuarios();
                    alert('Usuario desactivado en servidor');
                    return;
                }
            } catch (e) {
                console.warn('Fallo desactivando usuario remoto, usando almacenamiento local:', e);
            }
        }

        // Fallback local
        const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
        if (!usuariosGuardados) return;
        let usuariosRegistrados = JSON.parse(usuariosGuardados);
        usuariosRegistrados = usuariosRegistrados.filter(u => u.username !== username);
        localStorage.setItem('usuariosRegistrados', JSON.stringify(usuariosRegistrados));
        cargarUsuarios();
        alert('Usuario eliminado localmente');
    })();
}

// Funciones para cambio de contraseña
// Función cambiarContrasena eliminada: cambio de contraseña se realiza desde el Perfil de Usuario

// Funciones para historial de reportes
function cargarHistorialReportes() {
    const tablaReportes = document.getElementById('tablaReportes').getElementsByTagName('tbody')[0];
    const sinReportes = document.getElementById('sinReportes');
    
    tablaReportes.innerHTML = '';
    
    // Obtener reportes guardados
    const reportesGuardados = localStorage.getItem('historialReportes');
    
    if (!reportesGuardados || JSON.parse(reportesGuardados).length === 0) {
        sinReportes.style.display = 'block';
        return;
    }
    
    sinReportes.style.display = 'none';
    
    // Mostrar reportes en la tabla
    const reportes = JSON.parse(reportesGuardados);
    
    reportes.forEach((reporte, index) => {
        const fila = tablaReportes.insertRow();
        
        const celdaFecha = fila.insertCell(0);
        celdaFecha.textContent = reporte.fecha;
        
        const celdaEmpresa = fila.insertCell(1);
        celdaEmpresa.textContent = reporte.empresa;
        
        const celdaTrimestre = fila.insertCell(2);
        celdaTrimestre.textContent = reporte.trimestre;
        
        const celdaUsuario = fila.insertCell(3);
        celdaUsuario.textContent = reporte.usuario;
        
        const celdaAcciones = fila.insertCell(4);
        celdaAcciones.innerHTML = 
            '<button class="btn btn-sm btn-primary" onclick="verReporte(' + index + ')" title="Ver reporte"><i class="fas fa-eye"></i></button> ' +
            '<button class="btn btn-sm btn-danger" onclick="eliminarReporte(' + index + ')" title="Eliminar"><i class="fas fa-trash"></i></button>';
    });
}

function verReporte(index) {
    const reportesGuardados = localStorage.getItem('historialReportes');
    if (!reportesGuardados) return;
    
    const reportes = JSON.parse(reportesGuardados);
    if (index >= reportes.length) return;
    
    const reporte = reportes[index];
    
    // Aquí se implementaría la visualización del reporte
    // Por ahora solo mostramos un alert con la información
    alert(`Reporte de ${reporte.empresa}\nFecha: ${reporte.fecha}\nTrimestre: ${reporte.trimestre}\nGenerado por: ${reporte.usuario}`);
}

function eliminarReporte(index) {
    if (!confirm('¿Está seguro de eliminar este reporte?')) {
        return;
    }
    
    const reportesGuardados = localStorage.getItem('historialReportes');
    if (!reportesGuardados) return;
    
    let reportes = JSON.parse(reportesGuardados);
    
    // Eliminar reporte
    reportes.splice(index, 1);
    
    // Guardar en localStorage
    localStorage.setItem('historialReportes', JSON.stringify(reportes));
    
    // Recargar tabla
    cargarHistorialReportes();
}

// Función para registrar un nuevo reporte en el historial
function registrarReporte(datosReporte) {
    // Obtener usuario activo
    const usuarioActivo = sessionStorage.getItem('usuarioActivo');
    if (!usuarioActivo) return;
    
    const usuario = JSON.parse(usuarioActivo);
    
    // Crear objeto de reporte
    const reporte = {
        fecha: new Date().toLocaleDateString(),
        empresa: datosReporte.empresa,
        trimestre: datosReporte.trimestre,
        usuario: usuario.nombre,
        datos: datosReporte
    };
    
    // Obtener reportes guardados
    let reportes = [];
    const reportesGuardados = localStorage.getItem('historialReportes');
    
    if (reportesGuardados) {
        reportes = JSON.parse(reportesGuardados);
    }
    
    // Agregar nuevo reporte
    reportes.push(reporte);
    
    // Guardar en localStorage
    localStorage.setItem('historialReportes', JSON.stringify(reportes));
}

// Crear usuarios en lote desde el Panel de Administración
async function crearUsuariosEnLote() {
    const ta = document.getElementById('adminBulkText');
    const msg = document.getElementById('adminBulkMsg');
    if (!ta) { alert('Área de texto de carga masiva no encontrada'); return; }
    const raw = (ta.value || '').trim();
    if (!raw) { alert('Pegue usuarios en CSV o JSON antes de continuar'); return; }

    const base = localStorage.getItem('AUTH_API_BASE');
    const token = sessionStorage.getItem('authToken');
    if (!(base && token)) {
        alert('Requiere backend remoto y sesión válida. Inicie sesión e intente de nuevo.');
        return;
    }

    const showMsg = (text, ok = false) => {
        if (!msg) return;
        msg.style.display = 'block';
        msg.style.padding = '8px';
        msg.style.borderRadius = '6px';
        msg.style.marginTop = '4px';
        msg.style.background = ok ? '#e8f5e9' : '#fdecea';
        msg.style.color = ok ? '#1b5e20' : '#b71c1c';
        msg.style.border = ok ? '1px solid #c8e6c9' : '1px solid #f5c6cb';
        msg.textContent = text;
    };

    // Intentar parsear JSON primero
    let users = [];
    let asJson = false;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            users = parsed;
            asJson = true;
        }
    } catch (_) { /* no es JSON, intentar CSV */ }

    // Si no fue JSON, intentar CSV (simple, autodetectando delimitador , o ;)
    if (!asJson) {
        const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length >= 2) {
            // Autodetectar delimitador según el header
            const headerLine = lines[0];
            const countComa = (headerLine.match(/,/g) || []).length;
            const countPuntoYComa = (headerLine.match(/;/g) || []).length;
            const delim = countPuntoYComa > countComa ? ';' : ',';

            const header = headerLine.split(delim).map(h => h.trim().replace(/^\uFEFF/, ''));
            const mapName = (n) => n.toLowerCase().replace(/\s+/g,'');
            const idx = {};
            header.forEach((h, i) => { idx[mapName(h)] = i; });

            const getVal = (parts, key) => {
                const i = idx[mapName(key)];
                let v = (i !== undefined && parts[i] !== undefined) ? String(parts[i]) : '';
                v = v.trim();
                // Quitar comillas envolventes si existen
                if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                    v = v.slice(1, -1);
                }
                return v;
            };

            for (let li = 1; li < lines.length; li++) {
                const parts = lines[li].split(delim);
                if (parts.length === 1 && parts[0].trim() === '') continue;
                const u = {
                    username: getVal(parts, 'username'),
                    password: getVal(parts, 'password'),
                    rol: getVal(parts, 'rol') || 'usuario',
                    nombre: getVal(parts, 'nombre') || undefined,
                    nombreCompleto: getVal(parts, 'nombreCompleto') || undefined,
                    correo: getVal(parts, 'correo') || undefined,
                    empresa: getVal(parts, 'empresa') || undefined,
                    celular: getVal(parts, 'celular') || undefined,
                    activo: (function(v){
                        v = (v || '').toString().toLowerCase();
                        if (v === 'true' || v === '1' || v === 'si' || v === 'sí') return true;
                        if (v === 'false' || v === '0' || v === 'no') return false;
                        return true; // por defecto
                    })(getVal(parts, 'activo'))
                };
                if (u.username || u.password) users.push(u);
            }
        }
    }

    // Validaciones
    if (!users.length) { showMsg('No se encontraron usuarios válidos para cargar'); return; }
    const invalid = users.filter(u => !(u && u.username && u.password));
    if (invalid.length) { showMsg('Todos los usuarios deben incluir username y password'); return; }

    // Normalizar pequeños detalles
    users = users.map(u => ({
        username: String(u.username||'').trim().toLowerCase(),
        password: String(u.password||''),
        rol: (u.rol || 'usuario'),
        nombre: u.nombre || undefined,
        nombreCompleto: u.nombreCompleto || u.nombre || undefined,
        correo: u.correo || undefined,
        empresa: u.empresa || undefined,
        celular: u.celular || undefined,
        activo: (u.activo === undefined ? true : !!u.activo)
    }));

    // Enviar al backend
    const baseURL = base.replace(/\/$/, '');
    const payload = { users };
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

    try {
        let resp = await fetch(baseURL + '/users/bulk', { method: 'POST', headers, body: JSON.stringify(payload) });
        if (!resp.ok) {
            // Intentar con prefijo /api si la primera falla
            const alt = await fetch(baseURL + '/api/users/bulk', { method: 'POST', headers, body: JSON.stringify(payload) });
            resp = alt;
        }
        if (!resp.ok) {
            const t = await resp.text().catch(()=> '');
            showMsg('Error cargando usuarios: ' + (t || ('HTTP ' + resp.status)), false);
            return;
        }
        const data = await resp.json().catch(()=> ({}));
        const inserted = Number(data.inserted || 0);
        const skipped = Number(data.skipped || 0);
        showMsg(`Carga completada. Insertados: ${inserted}. Omitidos (duplicados): ${skipped}.`, true);
        // Opcional: limpiar textarea si hubo inserciones
        if (inserted > 0) { ta.value = ''; }
        if (typeof cargarUsuariosAdminPanel === 'function') {
            await cargarUsuariosAdminPanel();
        }
    } catch (e) {
        console.warn('Fallo en carga masiva:', e);
        showMsg('Fallo de red o servidor durante la carga masiva: ' + (e && e.message || e));
    }
}
