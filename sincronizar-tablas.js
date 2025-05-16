/**
 * Script para sincronizar las tablas de delincuentes
 * Este archivo asegura que los delincuentes se muestren correctamente en ambas tablas
 * Versión mejorada: sincronización automática sin necesidad de botón
 */

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando manejo de delincuentes con sincronización automática...');
    
    // Esperar a que todo esté cargado
    setTimeout(function() {
        // Sincronizar tablas al inicio
        sincronizarTablasDelincuentes();
        
        // Configurar sincronización automática cada 30 segundos
        setInterval(sincronizarTablasDelincuentes, 30000);
        
        // Configurar el evento para el botón de agregar delincuente
        const botonesAgregarDelincuente = document.querySelectorAll('.btn-success');
        botonesAgregarDelincuente.forEach(boton => {
            boton.addEventListener('click', function() {
                // Configurar el formulario cuando se abra el modal
                const formDelincuente = document.getElementById('formAgregarDelincuente');
                if (formDelincuente) {
                    // Eliminar listeners previos para evitar duplicados
                    const nuevoForm = formDelincuente.cloneNode(true);
                    formDelincuente.parentNode.replaceChild(nuevoForm, formDelincuente);
                    
                    // Agregar nuevo listener
                    nuevoForm.addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        // Obtener valores del formulario
                        const nombre = document.getElementById('nombreCompletoDelincuente').value;
                        const cedula = document.getElementById('cedulaDelincuente').value;
                        const edad = document.getElementById('edadDelincuente').value;
                        const delito = document.getElementById('delitoDelincuente').value;
                        const monto = document.getElementById('montoDelincuente').value;
                        const denuncia = document.getElementById('denunciaDelincuente').value;
                        
                        // Crear objeto delincuente para la tabla actual
                        const delincuente = {
                            nombreCompleto: nombre,
                            cedula: cedula,
                            edad: edad,
                            delito: delito,
                            monto: monto,
                            denuncia: denuncia,
                            fecha: document.getElementById('fechaDelincuente').value
                        };
                        
                        // Agregar a la tabla actual
                        agregarDelincuenteATablaActual(delincuente);
                        
                        // Crear objeto para el historial
                        const delincuenteHistorial = {
                            nombre: nombre,
                            cedula: cedula,
                            edad: edad,
                            delito: delito,
                            cuantia: monto,
                            denuncia: denuncia
                        };
                        
                        // Agregar al historial
                        agregarDelincuenteAlHistorial(delincuenteHistorial);
                        
                        // Cerrar el modal
                        const modal = document.getElementById('modalAgregarDelincuente');
                        if (modal) {
                            modal.style.display = 'none';
                        }
                        
                        // Mostrar mensaje de éxito
                        alert('Delincuente agregado correctamente');
                        
                        // Sincronizar tablas
                        setTimeout(sincronizarTablasDelincuentes, 500);
                    });
                }
            });
        });
    }, 1000);
});

// Función para agregar delincuente a la tabla actual
function agregarDelincuenteATablaActual(delincuente) {
    console.log('Agregando delincuente a tabla actual:', delincuente);
    
    // Obtener la tabla actual
    const tablaActual = document.getElementById('tablaDelincuentes');
    if (!tablaActual) {
        console.error('Tabla actual no encontrada');
        return;
    }
    
    const tbody = tablaActual.querySelector('tbody');
    if (!tbody) {
        console.error('Cuerpo de tabla actual no encontrado');
        return;
    }
    
    // Contar filas existentes para el número
    const numFilas = tbody.querySelectorAll('tr').length;
    
    // Crear nueva fila
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${numFilas + 1}</td>
        <td>${delincuente.nombreCompleto || ''}</td>
        <td>${delincuente.cedula || ''}</td>
        <td>${delincuente.edad || ''}</td>
        <td>${delincuente.direccion || ''}</td>
        <td>${delincuente.vehiculo || ''}</td>
        <td>${delincuente.placa || ''}</td>
        <td>${delincuente.colorVehiculo || ''}</td>
        <td>${delincuente.lugar || ''}</td>
        <td>${delincuente.fecha || ''}</td>
        <td>${delincuente.delito || ''}</td>
        <td>${delincuente.mercancias || ''}</td>
        <td>${delincuente.monto || ''}</td>
        <td>${delincuente.denuncia || ''}</td>
        <td>
            <button class="btn btn-sm btn-danger">Eliminar</button>
        </td>
    `;
    
    // Agregar a la tabla
    tbody.appendChild(tr);
    console.log('Delincuente agregado a tabla actual');
}

// Función para agregar delincuente al historial
function agregarDelincuenteAlHistorial(delincuente) {
    console.log('Agregando delincuente al historial:', delincuente);
    
    // Cargar delincuentes existentes
    let delincuentesPersistentes = [];
    const datosGuardados = localStorage.getItem('delincuentesPersistentes');
    
    if (datosGuardados) {
        try {
            delincuentesPersistentes = JSON.parse(datosGuardados);
        } catch (e) {
            console.error('Error al cargar delincuentes del historial:', e);
        }
    }
    
    // Verificar si ya existe
    const existeEnHistorial = delincuentesPersistentes.findIndex(d => d.cedula === delincuente.cedula);
    
    if (existeEnHistorial !== -1) {
        // Actualizar existente
        delincuentesPersistentes[existeEnHistorial] = delincuente;
    } else {
        // Agregar nuevo
        delincuentesPersistentes.push(delincuente);
    }
    
    // Guardar en localStorage
    localStorage.setItem('delincuentesPersistentes', JSON.stringify(delincuentesPersistentes));
    console.log('Historial actualizado en localStorage');
    
    // Actualizar la tabla de historial
    actualizarTablaHistorial(delincuentesPersistentes);
}

// Función para actualizar la tabla de historial
function actualizarTablaHistorial(delincuentes) {
    console.log('Actualizando tabla de historial con', delincuentes.length, 'delincuentes');
    
    // Obtener la tabla de historial
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
    
    // Limpiar la tabla
    tbody.innerHTML = '';
    
    // Verificar si hay delincuentes
    if (delincuentes.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">No hay delincuentes registrados</td>';
        tbody.appendChild(tr);
    } else {
        // Agregar cada delincuente
        delincuentes.forEach((delincuente, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${delincuente.nombre || ''}</td>
                <td>${delincuente.cedula || ''}</td>
                <td>${delincuente.edad || ''}</td>
                <td>${delincuente.delito || ''}</td>
                <td>${delincuente.cuantia || ''}</td>
                <td>${delincuente.denuncia || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Actualizar el total
    const totalElement = document.querySelector('.tabla-delincuentes-persistentes-container .total');
    if (totalElement) {
        totalElement.textContent = delincuentes.length;
    }
    
    console.log('Tabla de historial actualizada correctamente');
}

// Función para sincronizar ambas tablas
function sincronizarTablasDelincuentes() {
    console.log('');
    
    // Cargar delincuentes del localStorage
    let delincuentesPersistentes = [];
    const datosGuardados = localStorage.getItem('delincuentesPersistentes');
    
    if (datosGuardados) {
        try {
            delincuentesPersistentes = JSON.parse(datosGuardados);
            console.log('Delincuentes cargados para sincronización:', delincuentesPersistentes.length);
            
            // Actualizar la tabla de historial
            actualizarTablaHistorial(delincuentesPersistentes);
            
            // Sincronizar con la tabla actual si existe la función
            if (typeof window.actualizarTablas === 'function') {
                window.actualizarTablas();
            }
            
            // Disparar evento personalizado para notificar que la sincronización se completó
            document.dispatchEvent(new CustomEvent('tablaSincronizada'));
            
        } catch (e) {
            console.error('Error al sincronizar tablas:', e);
        }
    } else {
        console.log('No hay datos guardados para sincronizar');
    }
    
    return true; // Indica que la sincronización se completó
}
