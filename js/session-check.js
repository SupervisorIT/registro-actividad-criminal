// Verificar si hay una sesión activa
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay un usuario activo en la sesión
    const usuarioActivo = sessionStorage.getItem('usuarioActivo');
    
    if (!usuarioActivo) {
        // Si no hay sesión activa, redirigir al login
        window.location.href = 'login.html';
    } else {
        // Si hay sesión activa, mostrar la información del usuario
        try {
            const usuario = JSON.parse(usuarioActivo);
            const usuarioInfo = document.getElementById('usuarioInfo');
            
            if (usuarioInfo) {
                const nombreMostrar = usuario.nombreCompleto || usuario.nombre || usuario.username;
                const cedulaMostrar = usuario.cedula ? ` — ${usuario.cedula}` : '';
                usuarioInfo.textContent = `${nombreMostrar}${cedulaMostrar}`;
            }
            
            // Guardar en localStorage para uso en otras páginas
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
    }
});

// Función para cerrar sesión
function cerrarSesion() {
    // Eliminar la información de sesión
    sessionStorage.removeItem('usuarioActivo');
    localStorage.removeItem('usuarioActual');
    
    // Redirigir al login
    window.location.href = 'login.html';
}
