// Credenciales predefinidas - SIEMPRE DISPONIBLES
const usuariosPredefinidos = [
    { username: "admin", password: "SupervisorIT2025", nombre: "Administrador", nombreCompleto: "Administrador del Sistema", cedula: "E-00-0000-00000", rol: "admin" },
    { username: "usuario", password: "usuario123", nombre: "Usuario Estándar", nombreCompleto: "Usuario Estándar", cedula: "E-00-0000-00001", rol: "usuario" }
];

// Lista de usuarios que se puede modificar (inicialmente contiene los usuarios predefinidos)
let listaUsuarios = [...usuariosPredefinidos];

// Configuración de API remota (opcional)
// Para habilitar login remoto, guardar en localStorage: AUTH_API_BASE = "https://tu-api.onrender.com"
const AUTH_API_BASE = (typeof localStorage !== 'undefined' && localStorage.getItem('AUTH_API_BASE')) || '';

// Verificar si ya hay una sesión activa
document.addEventListener('DOMContentLoaded', function() {
    // Cargar usuarios guardados en localStorage si existen
    const usuariosGuardados = localStorage.getItem('usuariosRegistrados');
    if (usuariosGuardados) {
        // Combinar usuarios predefinidos con los guardados, evitando duplicados
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
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const usernameRaw = document.getElementById('username').value;
            const passwordRaw = document.getElementById('password').value;
            const username = (usernameRaw || '').trim();
            const password = (passwordRaw || '').trim();
            const usernameLower = username.toLowerCase();
            
            // Intento 1: Login remoto si está configurado
            if (AUTH_API_BASE) {
                try {
                    const resp = await fetch(`${AUTH_API_BASE.replace(/\/$/, '')}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        const user = (data && data.user) || null;
                        if (user) {
                            const payload = {
                                username: user.username,
                                nombre: user.nombre || user.nombreCompleto,
                                nombreCompleto: user.nombreCompleto || user.nombre,
                                cedula: user.cedula || '',
                                rol: user.rol,
                                timestamp: new Date().getTime()
                            };
                            // Guardar token si llega
                            if (data.token) {
                                sessionStorage.setItem('authToken', data.token);
                            }
                            sessionStorage.setItem('usuarioActivo', JSON.stringify(payload));
                            window.location.href = 'index.html';
                            return; // éxito remoto, salir
                        }
                    }
                } catch (err) {
                    console.warn('Fallo login remoto, usando fallback local:', err);
                }
            }
            
            // Lógica simplificada para garantizar el acceso (fallback local)
            let usuario = null;
            
            // CASO ESPECIAL: Verificar primero si es el usuario admin con la contraseña predeterminada
            if (usernameLower === 'admin' && password === 'SupervisorIT2025') {
                console.log('Acceso con credenciales predeterminadas');
                usuario = usuariosPredefinidos[0]; // Usuario admin predefinido
                
                // Actualizar localStorage para mantener consistencia
                localStorage.setItem('adminPassword', 'SupervisorIT2025');
            } 
            // Verificar si es admin con contraseña personalizada en localStorage
            else if (usernameLower === 'admin') {
                const adminPassword = localStorage.getItem('adminPassword');
                if (adminPassword && password === adminPassword) {
                    console.log('Acceso con contraseña personalizada');
                    usuario = usuariosPredefinidos[0]; // Usuario admin predefinido
                }
            }
            // Para usuarios normales
            else {
                usuario = listaUsuarios.find(u => (u.username || '').toLowerCase() === usernameLower && (u.password || '') === password);
            }
            
            if (usuario) {
                // Preparar información de sesión (nombre completo y cédula si existen)
                const payload = {
                    username: usuario.username,
                    // Mantener compatibilidad con 'nombre' y preferir 'nombreCompleto' si está disponible
                    nombre: usuario.nombre || usuario.nombreCompleto,
                    nombreCompleto: usuario.nombreCompleto || usuario.nombre,
                    cedula: usuario.cedula || '',
                    rol: usuario.rol,
                    timestamp: new Date().getTime()
                };
                // Guardar información de sesión
                sessionStorage.setItem('usuarioActivo', JSON.stringify(payload));
                
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
