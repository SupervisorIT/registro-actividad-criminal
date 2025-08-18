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
                        let user = (data && data.user) || null;
                        if (user) {
                            // Guardar token si llega
                            if (data.token) {
                                sessionStorage.setItem('authToken', data.token);
                            }

                            // Si faltan datos, pedirlos y actualizarlos antes de entrar
                            const requiredKeys = ['nombre','nombreCompleto','cedula','empresa','correo','celular'];
                            const localMissing = requiredKeys.filter(k => !((user[k] || '').toString().trim()));
                            let missing = Array.isArray(data.missingFields) ? data.missingFields.filter(Boolean) : [];
                            missing = Array.from(new Set([...(missing||[]), ...localMissing]));
                            if (missing.length) {
                                try {
                                    const updates = {};
                                    if (missing.includes('nombre')) {
                                        const v = prompt('Falta su Nombre corto/Mostrable. Ingréselo:');
                                        if (v && v.trim()) updates.nombre = v.trim();
                                    }
                                    if (missing.includes('nombreCompleto')) {
                                        const v = prompt('Falta su Nombre Completo. Ingréselo:');
                                        if (v && v.trim()) updates.nombreCompleto = v.trim();
                                    }
                                    if (missing.includes('cedula')) {
                                        const v = prompt('Falta su Cédula (formato E-00-0000-00000). Ingrésela:');
                                        if (v && v.trim()) updates.cedula = v.trim();
                                    }
                                    if (missing.includes('empresa')) {
                                        const v = prompt('Falta su Empresa. Ingrésela:');
                                        if (v && v.trim()) updates.empresa = v.trim();
                                    }
                                    if (missing.includes('correo')) {
                                        const v = prompt('Falta su Correo. Ingréselo:');
                                        if (v && v.trim()) updates.correo = v.trim();
                                    }
                                    if (missing.includes('celular')) {
                                        const v = prompt('Falta su Celular. Ingréselo:');
                                        if (v && v.trim()) updates.celular = v.trim();
                                    }

                                    if (Object.keys(updates).length) {
                                        const token = sessionStorage.getItem('authToken');
                                        const patch = await fetch(`${AUTH_API_BASE.replace(/\/$/, '')}/users/me`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify(updates)
                                        });
                                        // No bloquear el acceso si el PATCH falla; solo avisar
                                        if (!patch.ok) {
                                            console.warn('No se pudo actualizar el perfil remoto:', await patch.text());
                                        } else {
                                            try {
                                                const patched = await patch.json();
                                                if (patched && patched.user) {
                                                    user = { ...user, ...patched.user, nombreCompleto: patched.user.nombreCompleto || patched.user.nombre };
                                                } else {
                                                    // si la API no devuelve user, al menos reflejar updates localmente
                                                    user = { ...user, ...updates };
                                                }
                                            } catch {
                                                user = { ...user, ...updates };
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.warn('Error completando datos faltantes:', e);
                                }
                            }

                            const payload = {
                                username: user.username,
                                nombre: user.nombre || user.nombreCompleto,
                                nombreCompleto: user.nombreCompleto || user.nombre,
                                cedula: user.cedula || '',
                                rol: user.rol,
                                timestamp: new Date().getTime()
                            };

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
