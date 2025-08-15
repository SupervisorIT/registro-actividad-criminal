// Funcionalidades de administración
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario es administrador
    const usuarioActivo = sessionStorage.getItem('usuarioActivo');
    if (!usuarioActivo) return;
    
    const usuario = JSON.parse(usuarioActivo);
    if (usuario.rol !== 'admin') return;
});

// Funciones para mostrar los modales
function mostrarGestionUsuarios() {
    const modal = document.getElementById('usuariosModal');
    modal.style.display = 'block';
    cargarUsuarios();
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
function cargarUsuarios() {
    const tablaUsuarios = document.getElementById('tablaUsuarios').getElementsByTagName('tbody')[0];
    tablaUsuarios.innerHTML = '';
    
    // Obtener lista de usuarios
    let listaUsuarios = [];
    
    // Agregar usuarios predefinidos
    const usuariosPredefinidos = [
        { username: "admin", password: "admin123", nombre: "Administrador", rol: "admin" },
        { username: "usuario", password: "usuario123", nombre: "Usuario Estándar", rol: "usuario" }
    ];
    
    listaUsuarios = [...usuariosPredefinidos];
    
    // Agregar usuarios guardados en localStorage
    const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
    if (usuariosGuardados) {
        const usuariosParsed = JSON.parse(usuariosGuardados);
        
        // Crear un mapa de usuarios predefinidos por nombre de usuario
        const usuariosPredefinidosMap = {};
        usuariosPredefinidos.forEach(u => {
            usuariosPredefinidosMap[u.username] = true;
        });
        
        // Agregar solo usuarios que no estén en la lista predefinida
        usuariosParsed.forEach(u => {
            if (!usuariosPredefinidosMap[u.username]) {
                listaUsuarios.push(u);
            }
        });
    }
    
    // Mostrar usuarios en la tabla
    listaUsuarios.forEach(usuario => {
        const fila = tablaUsuarios.insertRow();
        
        const celdaUsuario = fila.insertCell(0);
        celdaUsuario.textContent = usuario.username;
        
        const celdaNombre = fila.insertCell(1);
        celdaNombre.textContent = usuario.nombre;
        
        const celdaRol = fila.insertCell(2);
        celdaRol.textContent = usuario.rol === 'admin' ? 'Administrador' : 'Usuario estándar';
        
        const celdaAcciones = fila.insertCell(3);
        
        // No permitir eliminar usuarios predefinidos
        if (usuario.username === 'admin' || usuario.username === 'usuario') {
            celdaAcciones.innerHTML = '<span style="color: #999; font-style: italic;">Predefinido</span>';
        } else {
            celdaAcciones.innerHTML = '<button class="btn btn-sm btn-danger" onclick="eliminarUsuario(\'' + usuario.username + '\')"><i class="fas fa-trash"></i></button>';
        }
    });
}

function agregarUsuario() {
    const username = document.getElementById('nuevoUsuario').value.trim();
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const password = document.getElementById('nuevaContrasena').value.trim();
    const rol = document.getElementById('nuevoRol').value;
    
    // Validar campos
    if (!username || !nombre || !password) {
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
    
    // Crear nuevo usuario
    const nuevoUsuario = {
        username,
        nombre,
        password,
        rol
    };
    
    // Guardar en localStorage
    let usuariosRegistrados = [];
    if (usuariosGuardados) {
        usuariosRegistrados = JSON.parse(usuariosGuardados);
    }
    
    usuariosRegistrados.push(nuevoUsuario);
    localStorage.setItem('usuariosRegistrados', JSON.stringify(usuariosRegistrados));
    
    // Limpiar campos
    document.getElementById('nuevoUsuario').value = '';
    document.getElementById('nuevoNombre').value = '';
    document.getElementById('nuevaContrasena').value = '';
    document.getElementById('nuevoRol').value = 'usuario';
    
    // Recargar tabla
    cargarUsuarios();
    
    alert('Usuario agregado correctamente');
}

function eliminarUsuario(username) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) {
        return;
    }
    
    // Obtener usuarios guardados
    const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
    if (!usuariosGuardados) return;
    
    let usuariosRegistrados = JSON.parse(usuariosGuardados);
    
    // Filtrar el usuario a eliminar
    usuariosRegistrados = usuariosRegistrados.filter(u => u.username !== username);
    
    // Guardar en localStorage
    localStorage.setItem('usuariosRegistrados', JSON.stringify(usuariosRegistrados));
    
    // Recargar tabla
    cargarUsuarios();
    
    alert('Usuario eliminado correctamente');
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
