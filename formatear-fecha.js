/**
 * Script para formatear automáticamente las fechas
 * Convierte entradas como "01052025" a formato "01/05/2025"
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar los campos de fecha existentes
    inicializarCamposFecha();
    
    // Observar cambios en el DOM para detectar nuevos campos de fecha
    const observer = new MutationObserver(function() {
        inicializarCamposFecha();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

/**
 * Inicializa todos los campos de fecha con el evento para formateo automático
 */
function inicializarCamposFecha() {
    document.querySelectorAll('.fecha-input').forEach(function(input) {
        // Evitar duplicar eventos
        // Forzar la inicialización aunque el input tenga el atributo en el HTML
        if (input.getAttribute('data-formateo-inicializado') === 'true' && !input._formateoInicializado) {
            // Si el atributo existe solo por el HTML, pero no lo hemos inicializado en JS, seguimos
        } else if (input._formateoInicializado) {
            return;
        }
        input._formateoInicializado = true;
        input.setAttribute('data-formateo-inicializado', 'true');
        
        // Agregar evento input para formatear mientras el usuario escribe
        input.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/[^\d]/g, ''); // Eliminar todo excepto dígitos
            if (valor.length > 8) valor = valor.substring(0, 8); // Limitar a 8 dígitos
            if (valor.length === 8) {
                // Si hay exactamente 8 dígitos, formatear como DD/MM/AAAA
                const dia = valor.substring(0, 2);
                const mes = valor.substring(2, 4);
                const anio = valor.substring(4, 8);
                // Validar día y mes
                const diaNum = parseInt(dia, 10);
                const mesNum = parseInt(mes, 10);
                if (diaNum > 0 && diaNum <= 31 && mesNum > 0 && mesNum <= 12) {
                    e.target.value = `${dia}/${mes}/${anio}`;
                } else {
                    e.target.value = valor;
                }
            } else {
                // Formateo progresivo
                let formateado = valor;
                if (valor.length > 4) {
                    formateado = valor.substring(0,2) + '/' + valor.substring(2,4) + '/' + valor.substring(4);
                } else if (valor.length > 2) {
                    formateado = valor.substring(0,2) + '/' + valor.substring(2);
                }
                e.target.value = formateado;
            }
        });
        
        // Agregar evento blur para formatear cuando el campo pierde el foco
        input.addEventListener('blur', function(e) {
            let valor = e.target.value.replace(/[^\d]/g, ''); // Eliminar todo excepto dígitos
            if (valor.length > 8) valor = valor.substring(0, 8); // Limitar a 8 dígitos
            if (valor.length === 8) {
                const dia = valor.substring(0, 2);
                const mes = valor.substring(2, 4);
                const anio = valor.substring(4, 8);
                e.target.value = `${dia}/${mes}/${anio}`;
            } else if (valor.length > 0) {
                let formateado = valor;
                if (valor.length > 4) {
                    formateado = valor.substring(0,2) + '/' + valor.substring(2,4) + '/' + valor.substring(4);
                } else if (valor.length > 2) {
                    formateado = valor.substring(0,2) + '/' + valor.substring(2);
                }
                e.target.value = formateado;
            }
        });
    });
}

/**
 * Función global para formatear una fecha
 * @param {string} valor - Valor de fecha a formatear (ej: "01052025")
 * @returns {string} - Fecha formateada (ej: "01/05/2025")
 */
window.formatearFecha = function(valor) {
    if (!valor) return '';
    
    // Eliminar caracteres no numéricos
    const soloNumeros = valor.replace(/[^\d]/g, '');
    
    if (soloNumeros.length >= 8) {
        const dia = soloNumeros.substring(0, 2);
        const mes = soloNumeros.substring(2, 4);
        const anio = soloNumeros.substring(4, 8);
        
        return `${dia}/${mes}/${anio}`;
    }
    
    return valor;
};
