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
async function cargarUsuariosAdminPanel() {
    const cont = document.getElementById('adminUsuariosLista');
    const origenBadge = document.getElementById('adminOrigenBadge');
    const totalSpan = document.getElementById('adminTotalUsuarios');
    if (!cont) return;
    cont.innerHTML = '';

    const base = localStorage.getItem('AUTH_API_BASE');
    const token = sessionStorage.getItem('authToken');
    let origen = 'Local';
    let lista = [];

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
                    lista = data;
                    origen = 'Remoto';
                }
            }
        } catch(e) { /* fallback abajo */ }
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
        if (inactivo) { item.style.opacity = '0.7'; }

        const acciones = document.createElement('div');
        const btnPwd = document.createElement('button');
        btnPwd.className = 'btn btn-sm';
        btnPwd.style.cssText = 'background:#f4a11a;color:#fff;border:none;padding:6px 10px;border-radius:6px;';
        btnPwd.textContent = 'Cambiar contraseña';
        btnPwd.onclick = () => cambiarContrasenaDe(String(u.username||''));
        acciones.appendChild(btnPwd);

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

function mostrarCambioContrasena() {
    const modal = document.getElementById('contrasenaModal');
    modal.style.display = 'block';
    
    // Limpiar campos
    document.getElementById('contrasenaActual').value = '';
    document.getElementById('nuevaContrasenaUsuario').value = '';
    document.getElementById('confirmarContrasena').value = '';
    document.getElementById('mensajeContrasena').textContent = '';
}

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
function cambiarContrasena() {
    const contrasenaActual = document.getElementById('contrasenaActual').value;
    const nuevaContrasena = document.getElementById('nuevaContrasenaUsuario').value;
    const confirmarContrasena = document.getElementById('confirmarContrasena').value;
    const mensajeContrasena = document.getElementById('mensajeContrasena');
    
    // Validar campos
    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
        mensajeContrasena.textContent = 'Por favor complete todos los campos';
        return;
    }
    
    // Verificar que las contraseñas coincidan
    if (nuevaContrasena !== confirmarContrasena) {
        mensajeContrasena.textContent = 'Las contraseñas no coinciden';
        return;
    }
    
    // Obtener usuario activo
    const usuarioActivo = JSON.parse(sessionStorage.getItem('usuarioActivo'));
    
    // Verificar contraseña actual
    let usuarioEncontrado = null;
    
    // Verificar en usuarios predefinidos
    const usuariosPredefinidos = [
        { username: "admin", password: "admin123", nombre: "Administrador", rol: "admin" },
        { username: "usuario", password: "usuario123", nombre: "Usuario Estándar", rol: "usuario" }
    ];
    
    usuarioEncontrado = usuariosPredefinidos.find(u => u.username === usuarioActivo.username && u.password === contrasenaActual);
    
    // Si no se encontró en predefinidos, buscar en localStorage
    if (!usuarioEncontrado) {
        const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
        if (usuariosGuardados) {
            const usuariosRegistrados = JSON.parse(usuariosGuardados);
            usuarioEncontrado = usuariosRegistrados.find(u => u.username === usuarioActivo.username && u.password === contrasenaActual);
        }
    }
    
    if (!usuarioEncontrado) {
        mensajeContrasena.textContent = 'La contraseña actual es incorrecta';
        return;
    }
    
    // Cambiar contraseña
    if (usuarioActivo.username === 'admin' || usuarioActivo.username === 'usuario') {
        // Para usuarios predefinidos, guardar en localStorage
        let usuariosPredefinidosModificados = localStorage.getItem('usuariosPredefinidosModificados');
        let usuariosModificados = usuariosPredefinidosModificados ? JSON.parse(usuariosPredefinidosModificados) : [];
        
        // Verificar si ya existe una modificación para este usuario
        const index = usuariosModificados.findIndex(u => u.username === usuarioActivo.username);
        
        if (index !== -1) {
            usuariosModificados[index].password = nuevaContrasena;
        } else {
            usuariosModificados.push({
                username: usuarioActivo.username,
                password: nuevaContrasena
            });
        }
        
        localStorage.setItem('usuariosPredefinidosModificados', JSON.stringify(usuariosModificados));
    } else {
        // Para usuarios normales, actualizar en localStorage
        const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
        if (usuariosGuardados) {
            let usuariosRegistrados = JSON.parse(usuariosGuardados);
            
            const index = usuariosRegistrados.findIndex(u => u.username === usuarioActivo.username);
            
            if (index !== -1) {
                usuariosRegistrados[index].password = nuevaContrasena;
                localStorage.setItem('usuariosRegistrados', JSON.stringify(usuariosRegistrados));
            }
        }
    }
    
    // Actualizar sesión
    usuarioActivo.timestamp = new Date().getTime();
    sessionStorage.setItem('usuarioActivo', JSON.stringify(usuarioActivo));
    
    // Mostrar mensaje de éxito
    mensajeContrasena.style.color = 'green';
    mensajeContrasena.textContent = 'Contraseña cambiada correctamente';
    
    // Limpiar campos
    document.getElementById('contrasenaActual').value = '';
    document.getElementById('nuevaContrasenaUsuario').value = '';
    document.getElementById('confirmarContrasena').value = '';
    
    // Cerrar modal después de 2 segundos
    setTimeout(() => {
        cerrarModal('contrasenaModal');
        mensajeContrasena.textContent = '';
        mensajeContrasena.style.color = 'red';
    }, 2000);
}

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
