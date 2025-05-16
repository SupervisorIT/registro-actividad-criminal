// Función para calcular el total de casos delictivos
function calcularTotalCasosDelictivos() {
    let totalDenuncias = 0;
    let totalCantidad = 0;
    let totalCuantia = 0;
    
    const filas = document.querySelectorAll('#tablaCasosDelictivos tbody tr:not(.total-row)');
    
    filas.forEach(fila => {
        const cantidadInput = fila.querySelector('input[name="cantidad[]"]');
        const cuantiaInput = fila.querySelector('input[name="cuantia[]"]');
        const denunciasInput = fila.querySelector('input[name="denuncias[]"]');
        
        const cantidad = parseInt(cantidadInput?.value) || 0;
        totalCantidad += cantidad;
        
        const cuantia = parseFloat(cuantiaInput?.value) || 0;
        totalCuantia += cuantia;
        
        const denuncias = parseInt(denunciasInput?.value) || 0;
        totalDenuncias += denuncias;
    });
    
    const totalRow = document.querySelector('#tablaCasosDelictivos .total-row');
    if (totalRow) {
        totalRow.querySelector('#totalCantidad').textContent = totalCantidad;
        totalRow.querySelector('#totalCuantia').textContent = totalCuantia.toFixed(2);
        totalRow.querySelector('#totalDenuncias').textContent = totalDenuncias;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const tabla = document.getElementById('tablaCasosDelictivos');
    if (!tabla) return;

    tabla.addEventListener('input', function(event) {
        const input = event.target;
        const name = input.getAttribute('name');

        // Solo validar cantidad y denuncias para que sean números enteros
        if (name === 'cantidad[]' || name === 'denuncias[]') {
            input.value = input.value.replace(/[^\d]/g, '');
        }
        
        calcularTotalCasosDelictivos();
    });

    calcularTotalCasosDelictivos();
});

document.addEventListener('DOMContentLoaded', function() {
    const tabla = document.getElementById('tablaCasosDelictivos');
    if (tabla) {
        tabla.querySelectorAll('input[name="cuantia[]"]').forEach(input => {
            input.removeAttribute('pattern');
            input.removeAttribute('type');
            input.setAttribute('type', 'text');
            input.setAttribute('inputmode', 'decimal');
            input.style.textAlign = 'right';
        });
    }
});

function agregarFilaTipificacion() {
    const tabla = document.getElementById('tablaCasosDelictivos');
    const tbody = tabla.querySelector('tbody');
    const filaTotal = tbody.querySelector('.total-row');
    const primeraFila = tbody.querySelector('tr:not(.total-row)');
    
    if (primeraFila) {
        const nuevaFila = primeraFila.cloneNode(true);
        
        nuevaFila.querySelectorAll('input').forEach(input => {
            if (input.name === 'fecha[]') {
                input.value = '';
            } else if (input.name === 'observaciones[]') {
                input.value = '';
            } else if (input.name === 'cuantia[]') {
                input.value = '';
            } else {
                input.value = '0';
            }
        });
        
        // No necesitamos resetear el select ya que ahora todas las opciones son válidas
        // y la primera opción (Hurto) es una selección válida por defecto
        
        tbody.insertBefore(nuevaFila, filaTotal);
        calcularTotalCasosDelictivos();
    }
}

// Inicializar delincuentes si no existe
if (!window.delincuentes) {
    window.delincuentes = [];
}

// Función para formatear cédula
function formatearCedula(input) {
    let cedula = input.value.replace(/[^\d]/g, '');
    let cedulaFormateada = '';
    
    if (cedula.length > 0) {
        // Agregar el primer número y un guión
        cedulaFormateada = cedula.charAt(0);
        
        if (cedula.length > 1) {
            // Agregar guión después del primer número
            cedulaFormateada += '-';
            
            // Agregar los siguientes números hasta el segundo guión
            let segundaParte = cedula.slice(1, 5);
            cedulaFormateada += segundaParte;
            
            if (cedula.length > 5) {
                // Agregar segundo guión y números restantes
                cedulaFormateada += '-';
                cedulaFormateada += cedula.slice(5);
            }
        }
    }
    
    input.value = cedulaFormateada;
}

// Función para formatear fecha y hora actual
function formatearFechaHoraActual() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

// Establecer fecha actual en campos de fecha al cargar
document.addEventListener('DOMContentLoaded', function() {
    const fechaInputs = document.querySelectorAll('input[type="date"]');
    for (let fechaInput of fechaInputs) {
        if (!fechaInput.value) {
            fechaInput.value = formatearFechaHoraActual();
        }
    }
});

// Cargar delincuentes al iniciar
document.addEventListener('DOMContentLoaded', function() {
    const delincuentesGuardados = localStorage.getItem('delincuentes');
    if (delincuentesGuardados) {
        window.delincuentes = JSON.parse(delincuentesGuardados);
    }
});

// Función para guardar delincuentes sin mostrar alerta
function guardarDelincuentesSinAlerta() {
    try {
        localStorage.setItem('delincuentes', JSON.stringify(window.delincuentes));
    } catch (error) {
        console.error('Error al guardar delincuentes:', error);
    }
}

// Función para guardar delincuentes con alerta
function guardarDelincuentes() {
    try {
        localStorage.setItem('delincuentes', JSON.stringify(window.delincuentes));
        alert('Delincuentes guardados correctamente');
    } catch (error) {
        console.error('Error al guardar delincuentes:', error);
        alert('Error al guardar delincuentes');
    }
}
