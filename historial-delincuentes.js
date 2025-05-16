/**
 * Historial de Delincuentes
 * Este script maneja el historial de delincuentes de manera independiente
 * para que los delincuentes eliminados de la tabla principal permanezcan en el historial.
 */

(function() {
    console.log('Inicializando sistema de historial de delincuentes...');
    
    // Guardar las funciones originales
    const guardarDelincuenteOriginal = window.guardarDelincuente;
    const eliminarDelincuenteOriginal = window.eliminarDelincuente;
    
    // Sobrescribir la función de guardar delincuente
    window.guardarDelincuente = function() {
        // Llamar a la función original primero
        if (typeof guardarDelincuenteOriginal === 'function') {
            const resultado = guardarDelincuenteOriginal.apply(this, arguments);
            
            // Después de guardar, actualizar el historial
            setTimeout(function() {
                // Si estamos editando un delincuente existente
                if (window.delincuenteEditandoId !== null && window.delincuenteEditandoId !== undefined) {
                    const delincuente = window.delincuentes[window.delincuenteEditandoId];
                    if (delincuente) {
                        agregarAlHistorial(delincuente);
                    }
                } 
                // Si estamos agregando un nuevo delincuente
                else if (window.delincuentes && window.delincuentes.length > 0) {
                    const delincuente = window.delincuentes[window.delincuentes.length - 1];
                    if (delincuente) {
                        agregarAlHistorial(delincuente);
                    }
                }
            }, 500);
            
            return resultado;
        }
    };
    
    // Sobrescribir la función de eliminar delincuente
    window.eliminarDelincuente = function(index) {
        // Obtener el delincuente antes de eliminarlo
        if (window.delincuentes && index >= 0 && index < window.delincuentes.length) {
            const delincuente = window.delincuentes[index];
            // Asegurarse de que esté en el historial antes de eliminarlo
            agregarAlHistorial(delincuente);
        }
        
        // Llamar a la función original para completar la eliminación
        if (typeof eliminarDelincuenteOriginal === 'function') {
            return eliminarDelincuenteOriginal.apply(this, arguments);
        }
    };
    
    // Función para agregar un delincuente al historial
    function agregarAlHistorial(delincuente) {
        if (!delincuente || !delincuente.cedula) {
            console.error('Delincuente inválido para agregar al historial:', delincuente);
            return;
        }
        
        console.log('Agregando/actualizando delincuente en historial:', delincuente.nombreCompleto);
        
        // Cargar el historial actual
        let historial = [];
        try {
            const historialGuardado = localStorage.getItem('delincuentesPersistentes');
            if (historialGuardado) {
                historial = JSON.parse(historialGuardado);
            }
        } catch (e) {
            console.error('Error al cargar historial:', e);
        }
        
        // Crear objeto para el historial con los campos reducidos
        const delincuenteHistorial = {
            nombre: delincuente.nombreCompleto || '',
            cedula: delincuente.cedula || '',
            edad: delincuente.edad || '',
            delito: delincuente.delito || '',
            cuantia: delincuente.monto || '',
            denuncia: delincuente.denuncia || ''
        };
        
        // Verificar si ya existe en el historial
        const existeEnHistorial = historial.findIndex(d => d.cedula === delincuente.cedula);
        
        if (existeEnHistorial !== -1) {
            // Actualizar el existente
            historial[existeEnHistorial] = delincuenteHistorial;
        } else {
            // Agregar el nuevo
            historial.push(delincuenteHistorial);
        }
        
        // Guardar el historial actualizado
        localStorage.setItem('delincuentesPersistentes', JSON.stringify(historial));
        console.log('Historial actualizado, ahora tiene', historial.length, 'delincuentes');
        
        // Actualizar la tabla de historial
        actualizarTablaHistorial();
    }
    
    // Función para actualizar la tabla de historial
    function actualizarTablaHistorial() {
        const tablaHistorial = document.getElementById('tablaDelincuentesPersistentes');
        if (!tablaHistorial) {
            console.error('Tabla de historial no encontrada');
            return;
        }
        
        const tbody = tablaHistorial.querySelector('tbody');
        if (!tbody) {
            console.error('Cuerpo de tabla de historial no encontrado');
            return;
        }
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        // Cargar el historial
        let historial = [];
        try {
            const historialGuardado = localStorage.getItem('delincuentesPersistentes');
            if (historialGuardado) {
                historial = JSON.parse(historialGuardado);
            }
        } catch (e) {
            console.error('Error al cargar historial para mostrar:', e);
        }
        
        // Si no hay delincuentes en el historial, mostrar mensaje
        if (!historial || historial.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="7" class="text-center">No hay delincuentes en el historial</td>';
            tbody.appendChild(tr);
            return;
        }
        
        // Agregar cada delincuente al historial
        historial.forEach((d, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${d.nombre || ''}</td>
                <td>${d.cedula || ''}</td>
                <td>${d.edad || ''}</td>
                <td>${d.delito || ''}</td>
                <td>${d.cuantia || ''}</td>
                <td>${d.denuncia || ''}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Actualizar contador si existe
        const contador = tablaHistorial.querySelector('.total');
        if (contador) {
            contador.textContent = historial.length;
        }
    }
    
    // Exponer la función de actualizar tabla de historial globalmente
    window.actualizarTablaHistorialDesdeTabla = actualizarTablaHistorial;
    
    // Actualizar la tabla de historial al cargar la página
    setTimeout(actualizarTablaHistorial, 1000);
    
    console.log('Sistema de historial de delincuentes inicializado');
})();
