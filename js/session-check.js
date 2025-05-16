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
                usuarioInfo.textContent = usuario.nombre || usuario.username;
            }
            
            // Guardar en localStorage para uso en otras páginas
            localStorage.setItem('usuarioActual', usuario.username);
            
            // Mostrar u ocultar elementos según el rol del usuario
            if (usuario.rol === 'admin') {
                // Mostrar elementos de administrador
                const adminElements = document.querySelectorAll('.admin-only');
                adminElements.forEach(el => {
                    el.style.display = 'block';
                });
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
