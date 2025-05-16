// Sistema de gestión de delincuentes capturados
// Función para inicializar la tabla de delincuentes
function inicializarDelincuentes() {
    // Verificar si hay delincuentes guardados en localStorage
    const delincuentesGuardados = localStorage.getItem('delincuentes');
    
    // Inicializar el array global de delincuentes
    window.delincuentes = [];
    
    if (delincuentesGuardados) {
        try {
            // Intentar parsear los datos guardados
            const datos = JSON.parse(delincuentesGuardados);
            
            // Verificar que sea un array
            if (Array.isArray(datos)) {
                window.delincuentes = datos;
                console.log('Delincuentes cargados:', window.delincuentes.length);
            } else {
                console.error('Los datos guardados no son un array válido');
            }
        } catch (error) {
            console.error('Error al cargar delincuentes:', error);
        }
    }
    
    // Actualizar la tabla con los datos cargados
    actualizarTablaDelincuentes();
}

// Función para verificar si un delincuente tiene información
function tieneInformacion(delincuente) {
    return delincuente.nombreCompleto || delincuente.cedula || 
           delincuente.edad || delincuente.lugar;
}

// Función para agregar un nuevo delincuente (abrir modal)
function agregarDelincuente() {
    // Mostrar el modal
    const modal = document.getElementById('delincuenteModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Limpiar el formulario
        document.getElementById('formDelincuente').reset();
        
        // Quitar clases de validación
        const camposInvalidos = document.querySelectorAll('.is-invalid');
        camposInvalidos.forEach(campo => campo.classList.remove('is-invalid'));
        
        // Establecer la fecha actual
        const fechaInput = document.getElementById('fechaDelincuente');
        const hoy = new Date();
        const fechaFormateada = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        fechaInput.value = fechaFormateada;
    } else {
        console.error('Modal no encontrado');
    }
}

// Función para formatear cédulas panameñas (desactivada)
function formatearCedula(input) {
    // Simplemente devolver el input sin modificarlo
    return input;
}

// Función para validar un campo individual
function validarCampo(campo) {
    // Ya no formateamos la cédula automáticamente
    
    if (campo.checkValidity()) {
        campo.classList.remove('is-invalid');
        campo.classList.add('is-valid');
        return true;
    } else {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');
        return false;
    }
}

// Función para validar y guardar el delincuente
function validarYGuardarDelincuente() {
    // Obtener todos los campos requeridos
    const camposRequeridos = document.querySelectorAll('#formDelincuente [required]');
    let formValido = true;
    
    // Validar cada campo
    camposRequeridos.forEach(campo => {
        if (!validarCampo(campo)) {
            formValido = false;
        }
    });
    
    // Si el formulario es válido, guardar el delincuente
    if (formValido) {
        guardarDelincuente();
    } else {
        // Mostrar mensaje de error
        mostrarNotificacion('Por favor complete todos los campos requeridos.', 'error');
    }
}

// Función para guardar el delincuente
function guardarDelincuente() {
    // Obtener valores del formulario
    const nombreCompleto = document.getElementById('nombreCompletoDelincuente').value;
    const cedula = document.getElementById('cedulaDelincuente').value;
    const edad = document.getElementById('edadDelincuente').value;
    const direccion = document.getElementById('direccionDelincuente').value;
    const vehiculo = document.getElementById('vehiculoDelincuente').value;
    const placa = document.getElementById('placaDelincuente').value;
    const colorVehiculo = document.getElementById('colorVehiculoDelincuente').value;
    const lugar = document.getElementById('lugarDelincuente').value;
    const fecha = document.getElementById('fechaDelincuente').value;
    const delito = document.getElementById('delitoDelincuente').value;
    const mercancias = document.getElementById('mercanciasDelincuente').value;
    const monto = document.getElementById('montoDelincuente').value;
    const denuncia = document.getElementById('denunciaDelincuente').value;
    
    // Crear objeto delincuente
    const delincuente = {
        nombreCompleto,
        cedula,
        edad,
        direccion,
        vehiculo,
        placa,
        colorVehiculo,
        lugar,
        fecha,
        delito,
        mercancias,
        monto,
        denuncia,
        fechaCaptura: new Date().toISOString() // Agregar fecha de captura para el historial
    };
    
    // Verificar si estamos editando un delincuente existente
    if (window.delincuenteEditandoId !== null && window.delincuenteEditandoId !== undefined) {
        // Actualizar el delincuente existente
        window.delincuentes[window.delincuenteEditandoId] = delincuente;
        mostrarNotificacion(`Delincuente ${nombreCompleto} actualizado correctamente.`, 'success');
    } else {
        // Agregar nuevo delincuente
        window.delincuentes.push(delincuente);
        mostrarNotificacion(`Delincuente ${nombreCompleto} agregado correctamente.`, 'success');
    }
    
    // Guardar en localStorage
    guardarDelincuentes();
    
    // Actualizar la tabla
    actualizarTablaDelincuentes();
    
    // Agregar al historial de delincuentes persistentes
    agregarDelincuenteAlHistorial(delincuente);
    
    // Cerrar el modal
    cerrarModalDelincuente();
    
    // Resetear el ID del delincuente que se estaba editando
    window.delincuenteEditandoId = null;
}

// Función para agregar un delincuente al historial
function agregarDelincuenteAlHistorial(delincuente) {
    console.log('Agregando delincuente al historial:', delincuente);
    
    // Verificar si existe la variable global delincuentesPersistentes
    if (typeof window.delincuentesPersistentes === 'undefined') {
        window.delincuentesPersistentes = [];
        
        // Intentar cargar del localStorage
        const delincuentesGuardados = localStorage.getItem('delincuentesPersistentes');
        if (delincuentesGuardados) {
            try {
                window.delincuentesPersistentes = JSON.parse(delincuentesGuardados);
                console.log('Delincuentes persistentes cargados:', window.delincuentesPersistentes.length);
            } catch (e) {
                console.error('Error al cargar delincuentes persistentes:', e);
            }
        }
    }
    
    // Crear objeto simplificado para el historial con solo los campos necesarios
    const delincuenteHistorial = {
        nombre: delincuente.nombreCompleto,
        cedula: delincuente.cedula,
        edad: delincuente.edad,
        delito: delincuente.delito,
        cuantia: delincuente.monto,
        denuncia: delincuente.denuncia,
        fecha: delincuente.fecha || new Date().toISOString().split('T')[0]
    };
    
    console.log('Objeto para historial creado:', delincuenteHistorial);
    
    // Verificar si ya existe un delincuente con la misma cédula en el historial
    const existeEnHistorial = window.delincuentesPersistentes.findIndex(d => d.cedula === delincuente.cedula);
    
    if (existeEnHistorial !== -1) {
        // Actualizar el delincuente existente en el historial
        window.delincuentesPersistentes[existeEnHistorial] = delincuenteHistorial;
        console.log('Delincuente actualizado en el historial');
    } else {
        // Agregar al historial
        window.delincuentesPersistentes.push(delincuenteHistorial);
        console.log('Nuevo delincuente agregado al historial');
    }
    
    // Guardar el historial actualizado
    localStorage.setItem('delincuentesPersistentes', JSON.stringify(window.delincuentesPersistentes));
    console.log('Historial guardado en localStorage');
    
    // Forzar la actualización de la tabla de historial
    setTimeout(function() {
        // Intentar con la función del archivo delincuentes-persistentes-fix.js
        if (typeof window.actualizarTablaDelincuentes === 'function') {
            console.log('Actualizando tabla de delincuentes con la función global');
            window.actualizarTablaDelincuentes();
        } else {
            console.log('Función actualizarTablaDelincuentes no encontrada');
            // Intentar actualizar manualmente
            const tablaHistorial = document.getElementById('tablaDelincuentesPersistentes');
            if (tablaHistorial) {
                console.log('Actualizando tabla de historial manualmente');
                const tbody = tablaHistorial.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = '';
                    
                    if (window.delincuentesPersistentes.length === 0) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = '<td colspan="7" class="text-center">No hay delincuentes registrados</td>';
                        tbody.appendChild(tr);
                    } else {
                        window.delincuentesPersistentes.forEach((d, index) => {
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
                    }
                }
            } else {
                console.log('Tabla de historial no encontrada, intentando crearla');
                // Intentar crear la tabla si no existe
                if (typeof crearTablaDelincuentesPersistentes === 'function') {
                    crearTablaDelincuentesPersistentes();
                    // Intentar actualizar de nuevo después de crear la tabla
                    setTimeout(agregarDelincuenteAlHistorial, 500, delincuente);
                }
            }
        }
    }, 100);
}

// Función para mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    
    // Icono según el tipo
    let icono = '';
    switch (tipo) {
        case 'success':
            icono = '✓';
            break;
        case 'error':
            icono = '✗';
            break;
        case 'warning':
            icono = '⚠';
            break;
        default:
            icono = 'ℹ';
    }
    
    // Contenido de la notificación
    notificacion.innerHTML = `
        <div class="notificacion-icono">${icono}</div>
        <div class="notificacion-mensaje">${mensaje}</div>
        <button class="notificacion-cerrar" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 10);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 5000);
}

// Función para abrir el modal de delincuente para un nuevo registro
function abrirModalDelincuente() {
    const modal = document.getElementById('delincuenteModal');
    if (modal) {
        // Limpiar el formulario antes de abrirlo
        document.getElementById('formDelincuente').reset();
        // Cambiar el título del modal
        const modalHeader = modal.querySelector('.modal-header h3');
        if (modalHeader) {
            modalHeader.innerHTML = '<i class="fas fa-user-plus"></i> Agregar Delincuente';
        }
        // Ocultar el ID del delincuente (para edición)
        window.delincuenteEditandoId = null;
        // Mostrar el modal
        modal.style.display = 'block';
    }
}

// Función para abrir el modal de delincuente para edición
function editarDelincuente(index) {
    const modal = document.getElementById('delincuenteModal');
    if (modal && window.delincuentes && window.delincuentes[index]) {
        const delincuente = window.delincuentes[index];
        
        // Cambiar el título del modal
        const modalHeader = modal.querySelector('.modal-header h3');
        if (modalHeader) {
            modalHeader.innerHTML = '<i class="fas fa-user-edit"></i> Editar Delincuente';
        }
        
        // Llenar el formulario con los datos del delincuente
        document.getElementById('nombreCompletoDelincuente').value = delincuente.nombreCompleto || '';
        document.getElementById('cedulaDelincuente').value = delincuente.cedula || '';
        document.getElementById('edadDelincuente').value = delincuente.edad || '';
        document.getElementById('direccionDelincuente').value = delincuente.direccion || '';
        document.getElementById('vehiculoDelincuente').value = delincuente.vehiculo || '';
        document.getElementById('placaDelincuente').value = delincuente.placa || '';
        document.getElementById('colorVehiculoDelincuente').value = delincuente.colorVehiculo || '';
        document.getElementById('lugarDelincuente').value = delincuente.lugar || '';
        document.getElementById('fechaDelincuente').value = delincuente.fecha || '';
        document.getElementById('delitoDelincuente').value = delincuente.delito || '';
        document.getElementById('mercanciasDelincuente').value = delincuente.mercancias || '';
        document.getElementById('montoDelincuente').value = delincuente.monto || '';
        document.getElementById('denunciaDelincuente').value = delincuente.denuncia || '';
        
        // Guardar el índice del delincuente que se está editando
        window.delincuenteEditandoId = index;
        
        // Mostrar el modal
        modal.style.display = 'block';
    }
}

// Función para cerrar el modal de delincuente
function cerrarModalDelincuente() {
    const modal = document.getElementById('delincuenteModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para guardar la lista de delincuentes
function guardarDelincuentes() {
    try {
        localStorage.setItem('delincuentes', JSON.stringify(window.delincuentes));
        return true;
    } catch (error) {
        console.error('Error al guardar delincuentes:', error);
        mostrarNotificacion('Error al guardar los datos. Es posible que el almacenamiento esté lleno.', 'error');
        return false;
    }
}

// Función para guardar sin mostrar alerta
function guardarDelincuentesSinAlerta() {
    try {
        localStorage.setItem('delincuentes', JSON.stringify(window.delincuentes));
        return true;
    } catch (error) {
        console.error('Error al guardar delincuentes:', error);
        return false;
    }
}

// Función para eliminar un delincuente
function eliminarDelincuente(index) {
    if (index >= 0 && index < window.delincuentes.length) {
        const delincuente = window.delincuentes[index];
        
        // Confirmar eliminación
        if (confirm('¿Está seguro que desea eliminar este delincuente?')) {
            // Guardar una copia del delincuente en el historial antes de eliminarlo
            agregarDelincuenteAlHistorial(delincuente);
            
            // Eliminar el delincuente del array
            window.delincuentes.splice(index, 1);
            
            // Guardar en localStorage
            guardarDelincuentes();
            
            // Actualizar la tabla
            actualizarTablaDelincuentes();
            
            // Mostrar notificación
            mostrarNotificacion('Delincuente eliminado de la tabla principal pero conservado en el historial.', 'success');
        }
    }
}

// Función para actualizar un delincuente
function actualizarDelincuente(index, campo, valor) {
    if (index >= 0 && index < window.delincuentes.length) {
        // Actualizar el campo
        window.delincuentes[index][campo] = valor;
        
        // Guardar en localStorage sin mostrar alerta
        guardarDelincuentesSinAlerta();
    }
}

// Función para actualizar la tabla de delincuentes
function actualizarTablaDelincuentes() {
    const tablaBody = document.querySelector('#tablaDelincuentes tbody');
    
    if (!tablaBody) {
        console.error('No se encontró el cuerpo de la tabla de delincuentes');
        return;
    }
    
    // Limpiar la tabla pero conservar la fila con el botón +
    const filaNoDelincuentes = document.getElementById('filaNoDelincuentes');
    tablaBody.innerHTML = '';
    
    // Verificar si hay delincuentes con información
    const delincuentesConInfo = window.delincuentes ? window.delincuentes.filter(d => tieneInformacion(d)) : [];
    
    // Si no hay delincuentes, mostrar la fila con el mensaje y botón +
    if (delincuentesConInfo.length === 0) {
        // Recrear la fila con el botón +
        const filaNueva = document.createElement('tr');
        filaNueva.id = 'filaNoDelincuentes';
        filaNueva.innerHTML = `
            <td>1</td>
            <td colspan="14" style="text-align: center;">No hay delincuentes registrados</td>
            <td style="text-align: center;">
                <button type="button" class="btn btn-success" style="font-size: 18px; padding: 0px 8px; font-weight: bold;" title="Agregar Delincuente" onclick="abrirModalDelincuente()">
                    +
                </button>
            </td>
        `;
        tablaBody.appendChild(filaNueva);
        return;
    }
    
    // Agregar filas para cada delincuente
    window.delincuentes.forEach((delincuente, index) => {
        // Solo mostrar delincuentes con información
        if (!tieneInformacion(delincuente)) {
            return;
        }
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="text" class="form-control" value="${delincuente.nombreCompleto || ''}" 
                onchange="actualizarDelincuente(${index}, 'nombreCompleto', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.cedula || ''}" 
                onchange="actualizarDelincuente(${index}, 'cedula', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.edad || ''}" 
                onchange="actualizarDelincuente(${index}, 'edad', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.direccion || ''}" 
                onchange="actualizarDelincuente(${index}, 'direccion', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.vehiculo || ''}" 
                onchange="actualizarDelincuente(${index}, 'vehiculo', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.placa || ''}" 
                onchange="actualizarDelincuente(${index}, 'placa', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.colorVehiculo || ''}" 
                onchange="actualizarDelincuente(${index}, 'colorVehiculo', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.lugar || ''}" 
                onchange="actualizarDelincuente(${index}, 'lugar', this.value)"></td>
            <td><input type="date" class="form-control" value="${delincuente.fecha || ''}" 
                onchange="actualizarDelincuente(${index}, 'fecha', this.value)"></td>
            <td>
                <select class="form-control" onchange="actualizarDelincuente(${index}, 'delito', this.value)">
                    <option value="">Seleccione...</option>
                    <option value="Hurto" ${delincuente.delito === 'Hurto' ? 'selected' : ''}>Hurto</option>
                    <option value="Robo" ${delincuente.delito === 'Robo' ? 'selected' : ''}>Robo</option>
                    <option value="Robo a mano armada" ${delincuente.delito === 'Robo a mano armada' ? 'selected' : ''}>Robo a mano armada</option>
                    <option value="Hurto de vehículo" ${delincuente.delito === 'Hurto de vehículo' ? 'selected' : ''}>Hurto de vehículo</option>
                    <option value="Robo de vehículo" ${delincuente.delito === 'Robo de vehículo' ? 'selected' : ''}>Robo de vehículo</option>
                    <option value="Homicidio" ${delincuente.delito === 'Homicidio' ? 'selected' : ''}>Homicidio</option>
                    <option value="Secuestro" ${delincuente.delito === 'Secuestro' ? 'selected' : ''}>Secuestro</option>
                    <option value="Extorsión" ${delincuente.delito === 'Extorsión' ? 'selected' : ''}>Extorsión</option>
                    <option value="Fraude" ${delincuente.delito === 'Fraude' ? 'selected' : ''}>Fraude</option>
                    <option value="Otro" ${!['Hurto', 'Robo', 'Robo a mano armada', 'Hurto de vehículo', 'Robo de vehículo', 'Homicidio', 'Secuestro', 'Extorsión', 'Fraude'].includes(delincuente.delito) ? 'selected' : ''}>Otro</option>
                </select>
            </td>
            <td><input type="text" class="form-control" value="${delincuente.mercancias || ''}" 
                onchange="actualizarDelincuente(${index}, 'mercancias', this.value)"></td>
            <td><input type="text" class="form-control monto-input" value="${delincuente.monto || ''}" 
                onfocus="this.value = this.value.replace(/[^\\d.]/g, '')"
                onblur="formatearMontoFinal(this)"
                onchange="actualizarDelincuente(${index}, 'monto', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.denuncia || ''}" 
                onchange="actualizarDelincuente(${index}, 'denuncia', this.value)"></td>
            <td style="text-align:center;">
                <div style="display: flex; justify-content: center; gap: 5px;">
                    <button type="button" class="btn btn-success" style="font-size: 20px; padding: 0px 10px; font-weight: bold; display: inline-block;" title="Agregar Delincuente" onclick="abrirModalDelincuente()">+</button>
                    <button type="button" class="btn btn-warning" style="font-size: 20px; padding: 0px 10px; font-weight: bold; display: inline-block;" title="Editar Delincuente" onclick="editarDelincuente(${index})">✏️</button>
                    <button type="button" class="btn btn-danger" style="font-size: 20px; padding: 0px 10px; font-weight: bold; display: inline-block;" title="Eliminar" onclick="eliminarDelincuente(${index})">×</button>
                </div>
            </td>
        `;
        tablaBody.appendChild(fila);
    });
}

// Función para formatear montos
function formatearMontoFinal(input) {
    if (!input.value) return;
    
    // Eliminar caracteres no numéricos excepto punto decimal
    let valor = input.value.replace(/[^0-9.]/g, '');
    
    // Asegurar que solo haya un punto decimal
    const partes = valor.split('.');
    if (partes.length > 2) {
        valor = partes[0] + '.' + partes.slice(1).join('');
    }
    
    // Convertir a número y formatear
    const numero = parseFloat(valor);
    if (!isNaN(numero)) {
        input.value = 'B/. ' + numero.toFixed(2);
    } else {
        input.value = '';
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    inicializarDelincuentes();
    
    // Agregar evento para el delito "Otro"
    const delitoSelect = document.getElementById('delitoDelincuente');
    if (delitoSelect) {
        delitoSelect.addEventListener('change', function() {
            const otroDelitoContainer = document.getElementById('otroDelitoContainer');
            if (otroDelitoContainer) {
                if (this.value === 'Otro') {
                    otroDelitoContainer.style.display = 'block';
                    document.getElementById('otroDelitoDelincuente').required = true;
                } else {
                    otroDelitoContainer.style.display = 'none';
                    document.getElementById('otroDelitoDelincuente').required = false;
                }
            }
        });
    }
    
    // Agregar estilos para notificaciones si no existen
    if (!document.getElementById('notificaciones-styles')) {
        const style = document.createElement('style');
        style.id = 'notificaciones-styles';
        style.textContent = `
            .notificacion {
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                align-items: center;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                max-width: 350px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                z-index: 9999;
                background-color: white;
            }
            
            .notificacion.mostrar {
                transform: translateX(0);
            }
            
            .notificacion-icono {
                margin-right: 15px;
                font-size: 24px;
                width: 24px;
                height: 24px;
                text-align: center;
                line-height: 24px;
            }
            
            .notificacion-mensaje {
                flex-grow: 1;
            }
            
            .notificacion-cerrar {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                margin-left: 10px;
            }
            
            .notificacion-success {
                border-left: 4px solid #28a745;
            }
            
            .notificacion-success .notificacion-icono {
                color: #28a745;
            }
            
            .notificacion-error {
                border-left: 4px solid #dc3545;
            }
            
            .notificacion-error .notificacion-icono {
                color: #dc3545;
            }
            
            .notificacion-warning {
                border-left: 4px solid #ffc107;
            }
            
            .notificacion-warning .notificacion-icono {
                color: #ffc107;
            }
            
            .notificacion-info {
                border-left: 4px solid #17a2b8;
            }
            
            .notificacion-info .notificacion-icono {
                color: #17a2b8;
            }
        `;
        document.head.appendChild(style);
    }
});
