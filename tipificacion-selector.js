/**
 * Script para manejar el selector de tipificación con diseño moderno
 */

/**
 * Script para manejar el selector de tipificación con diseño moderno
 * Versión simplificada para mayor compatibilidad
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando selector de tipificación...');
    
    // Cargar Font Awesome si no está cargado
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Configurar eventos para las tarjetas de tipificación
    configurarTarjetasTipificacion();
    
    // Observar cambios en el DOM para detectar nuevos elementos
    const observer = new MutationObserver(function() {
        configurarTarjetasTipificacion();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

/**
 * Configura las tarjetas de tipificación con eventos
 */
function configurarTarjetasTipificacion() {
    // Configurar las tarjetas en el modal
    document.querySelectorAll('.tipificacion-card').forEach(function(card) {
        // Evitar duplicar eventos
        if (card.dataset.initialized) return;
        card.dataset.initialized = 'true';
        
        // Agregar efecto hover
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        // Agregar evento de clic
        card.addEventListener('click', function() {
            const valor = this.getAttribute('data-value');
            const botonActual = document.querySelector('.tipificacion-selector-btn-activo');
            
            if (botonActual) {
                const container = botonActual.closest('.tipificacion-container');
                if (container) {
                    const textoElement = container.querySelector('.tipificacion-texto');
                    const inputElement = container.querySelector('.tipificacion-input');
                    
                    if (textoElement) textoElement.textContent = valor;
                    if (inputElement) {
                        inputElement.value = valor;
                        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                
                // Quitar clase activa
                botonActual.classList.remove('tipificacion-selector-btn-activo');
            }
            
            // Efecto de selección
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(0)';
                $('#modalTipificacion').modal('hide');
            }, 200);
        });
    });
}

// Función global para abrir el modal de tipificación
window.abrirModalTipificacion = function(boton) {
    // Quitar clase activa de cualquier botón anterior
    document.querySelectorAll('.tipificacion-selector-btn-activo').forEach(function(btn) {
        btn.classList.remove('tipificacion-selector-btn-activo');
    });
    
    // Marcar este botón como activo
    boton.classList.add('tipificacion-selector-btn-activo');
    
    // Abrir el modal
    $('#modalTipificacion').modal('show');
};

// Actualizar la función agregarFilaTipificacion si existe
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (typeof window.agregarFilaTipificacion === 'function') {
            const agregarFilaTipificacionOriginal = window.agregarFilaTipificacion;
            
            window.agregarFilaTipificacion = function() {
                agregarFilaTipificacionOriginal();
                setTimeout(configurarTarjetasTipificacion, 100);
            };
        }
    }, 500);
});

// Actualizar la función agregarFilaTipificacion si existe
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (typeof window.agregarFilaTipificacion === 'function') {
            // Guardar referencia a la función original
            const agregarFilaTipificacionOriginal = window.agregarFilaTipificacion;
            
            // Reemplazar con nueva función que inicializa los selectores
            window.agregarFilaTipificacion = function() {
                // Llamar a la función original
                agregarFilaTipificacionOriginal();
                
                // Inicializar los nuevos selectores
                setTimeout(inicializarSelectorTipificacion, 0);
            };
        }
    }, 500);
});
