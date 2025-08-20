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
        
        // Crear objeto para el historial con todos los campos relevantes
        const delincuenteHistorial = {
            nombreCompleto: delincuente.nombreCompleto || delincuente.nombre || '',
            nombre: delincuente.nombreCompleto || delincuente.nombre || '',
            cedula: delincuente.cedula || '',
            edad: delincuente.edad || '',
            direccion: delincuente.direccion || '',
            vehiculo: delincuente.vehiculo || '',
            placa: delincuente.placa || '',
            color: delincuente.color || delincuente.colorVehiculo || '',
            fechaCaptura: delincuente.fechaCaptura || delincuente.fecha || '',
            delito: delincuente.delito || '',
            productos: delincuente.productos || delincuente.mercancias || '',
            cuantia: (delincuente.cuantia != null ? delincuente.cuantia : (delincuente.monto != null ? delincuente.monto : '')),
            denuncia: delincuente.denuncia || ''
        };
        
        // Verificar si ya existe en el historial
        const existeEnHistorial = historial.findIndex(d => d.cedula === delincuente.cedula);
        
        if (existeEnHistorial !== -1) {
            // Fusionar: mantener el valor nuevo si no está vacío; conservar el anterior en caso contrario
            const prev = historial[existeEnHistorial] || {};
            const mergeCampo = (k) => {
                const nuevo = delincuenteHistorial[k];
                const anterior = prev[k];
                historial[existeEnHistorial][k] = (nuevo !== undefined && String(nuevo).trim() !== '') ? nuevo : (anterior !== undefined ? anterior : '');
            };
            const claves = ['nombreCompleto','nombre','cedula','edad','direccion','vehiculo','placa','color','fechaCaptura','delito','productos','cuantia','denuncia'];
            claves.forEach(mergeCampo);
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
    
    // Exponer las funciones de historial globalmente
    window.actualizarTablaHistorialDesdeTabla = actualizarTablaHistorial;
    window.renderizarTablaHistorialDelincuentes = actualizarTablaHistorial;
    window.agregarAlHistorial = agregarAlHistorial;
    
    // Actualizar la tabla de historial al cargar la página
    setTimeout(actualizarTablaHistorial, 1000);
    
    console.log('Sistema de historial de delincuentes inicializado');
})();
