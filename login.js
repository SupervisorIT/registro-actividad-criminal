// Credenciales predefinidas
const usuarios = [
    // La contraseña de admin se verificará desde localStorage, pero mantenemos una por defecto
    { username: "admin", password: "SupervisorIT2025", nombre: "Administrador", rol: "admin" },
    { username: "usuario", password: "usuario123", nombre: "Usuario Estándar", rol: "usuario" }
];

// Lista de usuarios que se puede modificar (inicialmente contiene los usuarios predefinidos)
let listaUsuarios = [...usuarios];

// Verificar si ya hay una sesión activa
document.addEventListener('DOMContentLoaded', function() {
    // Cargar usuarios guardados en localStorage si existen
    const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
    if (usuariosGuardados) {
        // Combinar usuarios predefinidos con los guardados, evitando duplicados
        const usuariosParsed = JSON.parse(usuariosGuardados);
        
        // Crear un mapa de usuarios predefinidos por nombre de usuario
        const usuariosPredefinidosMap = {};
        usuarios.forEach(u => {
            usuariosPredefinidosMap[u.username] = true;
        });
        
        // Agregar solo usuarios que no estén en la lista predefinida
        usuariosParsed.forEach(u => {
            if (!usuariosPredefinidosMap[u.username]) {
                listaUsuarios.push(u);
            }
        });
    }
    
    // Verificar si hay modificaciones de contraseñas para usuarios predefinidos
    const usuariosPredefinidosModificados = localStorage.getItem('usuariosPredefinidosModificados');
    if (usuariosPredefinidosModificados) {
        const modificaciones = JSON.parse(usuariosPredefinidosModificados);
        
        // Actualizar contraseñas de usuarios predefinidos
        modificaciones.forEach(mod => {
            const index = listaUsuarios.findIndex(u => u.username === mod.username);
            if (index !== -1) {
                listaUsuarios[index].password = mod.password;
            }
        });
    }
    
    // Si hay una sesión activa, redirigir al formulario
    if (sessionStorage.getItem('usuarioActivo')) {
        window.location.href = 'index.html';
    }

    // Configurar el formulario de login
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Obtener la contraseña de admin desde localStorage si existe
            let adminPassword = localStorage.getItem('adminPassword');
            
            // Validar credenciales
            let usuario = null;
            
            // Caso especial para el usuario admin (verificar con localStorage)
            if (username === 'admin') {
                // Si hay una contraseña guardada en localStorage, usarla; si no, usar la predeterminada
                const adminPassToCheck = adminPassword || 'SupervisorIT2025';
                
                // Verificar si la contraseña ingresada coincide con la almacenada
                if (password === adminPassToCheck) {
                    usuario = listaUsuarios.find(u => u.username === 'admin');
                }
            } else {
                // Para otros usuarios, validar normalmente
                usuario = listaUsuarios.find(u => u.username === username && u.password === password);
            }
            
            if (usuario) {
                // Guardar información de sesión
                sessionStorage.setItem('usuarioActivo', JSON.stringify({
                    username: usuario.username,
                    nombre: usuario.nombre,
                    rol: usuario.rol,
                    timestamp: new Date().getTime()
                }));
                
                // Redirigir al formulario principal
                window.location.href = 'index.html';
            } else {
                // Mostrar mensaje de error
                errorMessage.textContent = 'Usuario o contraseña incorrectos';
                errorMessage.classList.add('show');
                
                // Ocultar mensaje después de 3 segundos
                setTimeout(() => {
                    errorMessage.classList.remove('show');
                }, 3000);
            }
        });
    }
    
    // Configurar botón para mostrar/ocultar contraseña
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Cambiar el icono
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
});
