// Credenciales predefinidas - SIEMPRE DISPONIBLES
const usuariosPredefinidos = [
    { username: "admin", password: "SupervisorIT2025", nombre: "Administrador", nombreCompleto: "Administrador del Sistema", cedula: "E-00-0000-00000", rol: "admin" },
    { username: "usuario", password: "usuario123", nombre: "Usuario Estándar", nombreCompleto: "Usuario Estándar", cedula: "E-00-0000-00001", rol: "usuario" }
];

// Deshabilitado: no se usa login local ni lista de usuarios locales
// let listaUsuarios = [...usuariosPredefinidos];

// Configuración de API remota (opcional)
// Para habilitar login remoto, guardar en localStorage: AUTH_API_BASE = "https://tu-api.onrender.com"
let AUTH_API_BASE = (typeof localStorage !== 'undefined' && localStorage.getItem('AUTH_API_BASE')) || '';
// Autoconfiguración: si no está definida y estamos en Render o localhost, usar la API pública
(function initApiBase(){
    try {
        if (!AUTH_API_BASE) {
            const host = (location && location.hostname) ? location.hostname : '';
            if (host.includes('onrender.com') || host === 'localhost' || host === '127.0.0.1') {
                AUTH_API_BASE = 'https://rac-auth-api.onrender.com';
                try { localStorage.setItem('AUTH_API_BASE', AUTH_API_BASE); } catch {}
            }
        }
        console.log('AUTH_API_BASE:', AUTH_API_BASE || '(sin configurar)');
    } catch(e) { /* noop */ }
})();

// Verificar si ya hay una sesión activa
document.addEventListener('DOMContentLoaded', function() {
    // Autenticación exclusivamente remota: no cargar ni usar usuarios locales
    
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
                        // Requerir token; sin token no continuamos como remoto
                        if (!data || !data.token) {
                            errorMessage.textContent = 'El servidor no devolvió token. Intente de nuevo o contacte al administrador.';
                            errorMessage.classList.add('show');
                            setTimeout(() => errorMessage.classList.remove('show'), 4000);
                            return;
                        }
                        // Bloquear cuentas inactivas (borrado lógico)
                        if (user && user.activo === false) {
                            errorMessage.textContent = 'Tu cuenta está desactivada. Contacta al administrador.';
                            errorMessage.classList.add('show');
                            setTimeout(() => errorMessage.classList.remove('show'), 5000);
                            return;
                        }
                        if (user) {
                            // Validar token inmediatamente
                            const base = (AUTH_API_BASE || '').replace(/\/$/, '');
                            try {
                                const v = await fetch(base + '/auth/validate', { method: 'GET', headers: { 'Authorization': 'Bearer ' + data.token, 'Accept': 'application/json' } });
                                if (!v.ok) {
                                    const t = await v.text().catch(()=> '');
                                    console.warn('Validación de token falló:', v.status, t);
                                    errorMessage.textContent = 'Token inválido devuelto por el servidor. Inicie sesión nuevamente.';
                                    errorMessage.classList.add('show');
                                    setTimeout(() => errorMessage.classList.remove('show'), 5000);
                                    return;
                                }
                            } catch (e) {
                                console.warn('Error validando token:', e);
                                errorMessage.textContent = 'No se pudo validar el token. Revise conexión e intente nuevamente.';
                                errorMessage.classList.add('show');
                                setTimeout(() => errorMessage.classList.remove('show'), 5000);
                                return;
                            }

                            // Guardar token obligatorio
                            sessionStorage.setItem('authToken', data.token);
                            // Marcar origen remoto
                            sessionStorage.setItem('authOrigin', 'remote');

                            // No más prompts ni PATCH aquí; el modal en index.html gestionará datos faltantes
                            const payload = {
                                username: user.username,
                                nombre: user.nombre || user.nombreCompleto || '',
                                nombreCompleto: user.nombreCompleto || user.nombre || '',
                                cedula: user.cedula || '',
                                empresa: user.empresa || '',
                                correo: user.correo || '',
                                celular: user.celular || '',
                                rol: user.rol,
                                timestamp: new Date().getTime()
                            };

                            sessionStorage.setItem('usuarioActivo', JSON.stringify(payload));
                            window.location.href = 'index.html';
                            return; // éxito remoto, salir
                        }
                    }
                    // Si la respuesta remota no es OK o no devolvió usuario, mostrar error y NO hacer fallback local
                    try {
                        const t = await resp.text();
                        console.warn('Login remoto no OK:', resp.status, t);
                    } catch {}
                    errorMessage.textContent = 'No se pudo iniciar sesión contra el servidor remoto. Verifique credenciales o conexión.';
                    errorMessage.classList.add('show');
                    setTimeout(() => errorMessage.classList.remove('show'), 4000);
                    return;
                } catch (err) {
                    // Error de red u origen CORS. Mostrar error y NO hacer fallback si está configurado el remoto.
                    console.warn('Fallo login remoto:', err);
                    errorMessage.textContent = 'Error conectando al servidor remoto (CORS/Red). Revise configuración y reintente.';
                    errorMessage.classList.add('show');
                    setTimeout(() => errorMessage.classList.remove('show'), 4000);
                    return;
                }
            }

            // Sin backend remoto no hay autenticación válida
            errorMessage.textContent = 'No hay backend remoto configurado. Configure AUTH_API_BASE o abra la versión desplegada.';
            errorMessage.classList.add('show');
            setTimeout(() => errorMessage.classList.remove('show'), 4000);
            return;
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
