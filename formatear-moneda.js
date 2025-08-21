/**
 * Funciones para formateo de moneda
 */

// Función para formatear moneda con símbolo de Balboa
function formatearMoneda(numero) {
    // Asegurar que sea un número
    if (isNaN(numero)) return 'B/. 0.00';
    
    // Formatear con dos decimales
    let monto = parseFloat(numero).toFixed(2);
    
    // Agregar separadores de miles
    let partes = monto.split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Devolver con símbolo de moneda
    return 'B/. ' + partes.join('.');
}

// ------------------------------
// Normalización de entradas
// ------------------------------

// Convierte una cadena a número con dos decimales.
// Reglas:
// - Si hay separador decimal (coma o punto), se respeta y se normaliza a punto.
// - Si NO hay separador decimal y hay > 2 dígitos, se interpreta como centavos (2536 -> 25.36).
// - Si NO hay separador y hay 1-2 dígitos, se formatea a 2 decimales ("5" -> 5.00, "25" -> 25.00).
function normalizarDosDecimales(cadena) {
    if (cadena == null) return '0.00';
    let str = String(cadena).trim();
    if (!str) return '0.00';

    // Reemplazar coma por punto como decimal
    str = str.replace(/,/g, '.');

    if (str.includes('.')) {
        // Mantener solo primer punto y dígitos
        const m = str.match(/^-?\d*(?:\.\d*)?/);
        let val = m ? m[0] : '0';
        if (val === '' || val === '-' || val === '.') val = '0';
        return (parseFloat(val) || 0).toFixed(2);
    }

    // Sin punto: extraer dígitos
    const digits = (str.match(/\d+/g) || []).join('');
    if (digits.length === 0) return '0.00';
    if (digits.length === 1) return `0.0${digits}`;
    if (digits.length === 2) return `0.${digits}`;
    const enteros = digits.slice(0, -2);
    const dec = digits.slice(-2);
    return `${parseInt(enteros, 10)}.${dec}`;
}

// Formatea una cadena numérica a moneda con B/. y separadores de miles.
function formatearCadenaComoBalboa(cadena) {
    const norm = normalizarDosDecimales(cadena);
    return formatearMoneda(norm);
}

// Listeners delegados para cuantías
// - #nuevoCuantia (texto): mostrar con B/. y miles en blur; quitar formato en focus para fácil edición
// - .cuantia-input (number): aplicar 2 decimales en blur (sin separadores)
(function initAutoFormatoMoneda() {
    if (typeof document === 'undefined') return;

    // Focus: quitar formato en #nuevoCuantia
    document.addEventListener('focus', function(e) {
        const el = e.target;
        if (el && el.id === 'nuevoCuantia') {
            // Remover prefijo y comas para edición
            const raw = String(el.value || '').replace(/B\/.\s*/i, '').replace(/,/g, '');
            el.value = raw;
        }
    }, true);

    // Blur: aplicar formato en #nuevoCuantia
    document.addEventListener('blur', function(e) {
        const el = e.target;
        if (el && el.id === 'nuevoCuantia') {
            el.value = formatearCadenaComoBalboa(el.value || '');
        }
    }, true);

    // Blur: normalizar a dos decimales en .cuantia-input (inputs de tabla tipo number)
    document.addEventListener('blur', function(e) {
        const el = e.target;
        if (el && el.classList && el.classList.contains('cuantia-input')) {
            const norm = normalizarDosDecimales(el.value || '');
            // Mantener como número válido para input type=number
            el.value = norm;
        }
    }, true);
})();
