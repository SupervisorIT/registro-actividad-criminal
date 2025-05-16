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
