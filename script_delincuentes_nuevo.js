// Sistema de gestión de delincuentes capturados

// Definir la función renderizarTablaDelincuentesSimple al inicio para que esté disponible inmediatamente
function renderizarTablaDelincuentesSimple() {
    var tbody = document.getElementById('tbodyDelincuentesSimple');
    if (!tbody) return;
    tbody.innerHTML = '';
    // Solo leer de window.delincuentes (no de localStorage)
    var delincuentes = window.delincuentes || [];
    if (!delincuentes.length) {
        var fila = document.createElement('tr');
        fila.innerHTML = '<td colspan="15" style="text-align: center; color: #888;">No hay delincuentes registrados <button type="button" class="btn btn-success btn-sm" title="Agregar Delincuente" onclick="abrirModalNuevoDelincuente()" style="font-size:16px;min-width:32px;margin-left:10px;">+</button></td>';
        tbody.appendChild(fila);
        return;
    }
    
    delincuentes.forEach(function(d, i) {
        var fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${i + 1}</td>
            <td>${d.nombreCompleto || ''}</td>
            <td>${d.cedula || ''}</td>
            <td>${d.edad || ''}</td>
            <td>${d.direccion || ''}</td>
            <td>${d.vehiculo || ''}</td>
            <td>${d.placa || ''}</td>
            <td>${d.color || ''}</td>
            <td>${d.fechaCaptura || ''}</td>
            <td>${d.delito || ''}</td>
            <td>${d.productos || ''}</td>
            <td>${d.cuantia || ''}</td>
            <td>${d.denuncia || ''}</td>
            <td style="white-space:nowrap;">
                <button type="button" class="btn btn-success btn-sm" title="Agregar Delincuente" onclick="abrirModalNuevoDelincuente()" style="font-size:16px;min-width:32px;">+</button>
                <button type="button" class="btn btn-danger btn-sm" title="Eliminar este delincuente" onclick="eliminarDelincuentePorIndice(${i})" style="font-size:16px;min-width:32px;">X</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

// Hacer global la función de renderizado inmediatamente
window.renderizarTablaDelincuentesSimple = renderizarTablaDelincuentesSimple;

// Función para inicializar la tabla de delincuentes
function inicializarDelincuentes() {
    // Solo actualizar la tabla existente, NO limpiar window.delincuentes aquí
    actualizarTablaDelincuentes();
}

// Función para verificar si un delincuente tiene información
function tieneInformacion(delincuente) {
    return delincuente.nombreCompleto || delincuente.cedula || 
           delincuente.edad || delincuente.lugar;
}

// Función para agregar un nuevo delincuente (abrir modal)
function abrirModalNuevoDelincuente() {
    // Accesibilidad: quitar aria-hidden al abrir el modal
    var modal = document.getElementById('nuevoDelincuenteModal');
    if (modal) {
        modal.removeAttribute('aria-hidden');
        modal.classList.add('show');
        modal.style.display = 'block';
        // Limpiar el formulario
        var form = document.getElementById('formDelincuente');
        if (form) form.reset();
        // Quitar clases de validación
        var camposInvalidos = modal.querySelectorAll('.is-invalid');
        camposInvalidos.forEach(campo => campo.classList.remove('is-invalid'));
        // Establecer la fecha actual
        var fechaInput = document.getElementById('fechaDelincuente');
        if (fechaInput) {
            var hoy = new Date();
            var fechaFormateada = hoy.toISOString().split('T')[0];
            fechaInput.value = fechaFormateada;
        }
        // Enfocar el primer campo
        var primerCampo = modal.querySelector('input, select, textarea');
        if (primerCampo) primerCampo.focus();
    } else {
        console.error('Modal no encontrado');
    }
}
window.abrirModalNuevoDelincuente = abrirModalNuevoDelincuente;

function cerrarModalNuevoDelincuente() {
    var modal = document.getElementById('nuevoDelincuenteModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}
window.cerrarModalNuevoDelincuente = cerrarModalNuevoDelincuente;

// La función renderizarTablaDelincuentesSimple ya está definida al inicio del archivo

// Función para guardar un nuevo delincuente desde el modal
function guardarNuevoDelincuente(actualizando = false) {
    var form = document.getElementById('formNuevoDelincuente');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Recoger los datos del formulario
    var delincuente = {
        nombreCompleto: document.getElementById('nuevoNombreCompleto').value.trim(),
        cedula: document.getElementById('nuevoCedula').value.trim(),
        edad: document.getElementById('nuevoEdad').value.trim(),
        direccion: document.getElementById('nuevoDireccion').value.trim(),
        vehiculo: document.getElementById('nuevoVehiculo').value.trim(),
        placa: document.getElementById('nuevoPlaca').value.trim(),
        color: document.getElementById('nuevoColor').value.trim(),
        fechaCaptura: document.getElementById('nuevoFecha').value.trim(),
        delito: document.getElementById('nuevoDelito').value.trim(),
        productos: document.getElementById('nuevoProductos').value.trim(),
        cuantia: document.getElementById('nuevoCuantia').value.trim(),
        denuncia: document.getElementById('nuevoDenuncia').value.trim()
    };

    // Validación de duplicados por cédula (solo si la cédula no está vacía)
    if (delincuente.cedula) {
        var delincuentesExistentes = [];
        if (localStorage.getItem('delincuentes')) {
            try {
                delincuentesExistentes = JSON.parse(localStorage.getItem('delincuentes'));
                if (!Array.isArray(delincuentesExistentes)) delincuentesExistentes = [];
            } catch (e) {
                delincuentesExistentes = [];
            }
        }
        
        var duplicado = delincuentesExistentes.some(function(d) {
            return d.cedula === delincuente.cedula && d.cedula !== '';
        });
        
        if (duplicado) {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Ya existe un delincuente con la misma cédula.', 'error');
            } else {
                alert('Ya existe un delincuente con la misma cédula.');
            }
            return;
        }
    }

    // Validación y formato de cuantía
    var cuantia = (delincuente.cuantia || '').replace(/[^\d.]/g, '');
    if (cuantia !== '') {
        cuantia = parseFloat(cuantia);
        if (isNaN(cuantia) || cuantia < 0) {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('La cuantía debe ser un número válido mayor o igual a 0.', 'error');
            } else {
                alert('La cuantía debe ser un número válido mayor o igual a 0.');
            }
            return;
        }
        delincuente.monto = 'B/. ' + cuantia.toFixed(2);
    } else {
        delincuente.monto = '';
    }

    // Agregar a la tabla temporal (window.delincuentes) - NO duplicar
    if (!window.delincuentes) window.delincuentes = [];
    window.delincuentes.push(delincuente);
    
    // Actualizar la tabla visual
    if (typeof renderizarTablaDelincuentesSimple === 'function') {
        renderizarTablaDelincuentesSimple();
    }
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('delincuentes', JSON.stringify(window.delincuentes));
    
    // Agregar al historial de delincuentes persistentes
    try {
        // Intentar usar la función del historial si existe
        if (typeof window.agregarAlHistorial === 'function') {
            window.agregarAlHistorial(delincuente);
        } else {
            // Si no existe la función, guardar directamente en el historial
            let historial = [];
            try {
                const historialGuardado = localStorage.getItem('delincuentesPersistentes');
                if (historialGuardado) {
                    historial = JSON.parse(historialGuardado);
                    if (!Array.isArray(historial)) historial = [];
                }
            } catch (e) {
                console.error('Error al cargar historial:', e);
                historial = [];
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
            const existeEnHistorial = historial.findIndex(d => d.cedula === delincuente.cedula && d.cedula !== '');
            
            if (existeEnHistorial !== -1) {
                // Actualizar el existente
                historial[existeEnHistorial] = delincuenteHistorial;
            } else {
                // Agregar el nuevo
                historial.push(delincuenteHistorial);
            }
            
            // Guardar el historial actualizado
            localStorage.setItem('delincuentesPersistentes', JSON.stringify(historial));
            console.log('Historial actualizado desde guardarNuevoDelincuente, ahora tiene', historial.length, 'delincuentes');
            
            // Actualizar la tabla de historial si existe la función
            if (typeof window.actualizarTablaHistorialDesdeTabla === 'function') {
                window.actualizarTablaHistorialDesdeTabla();
            }
        }
    } catch (error) {
        console.error('Error al guardar en historial:', error);
    }
    
    // Cerrar el modal y limpiar el formulario
    cerrarModalNuevoDelincuente();
    form.reset();
    
    // Mensaje de éxito
    if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('Delincuente agregado a la tabla temporal.', 'success');
    } else {
        alert('Delincuente agregado a la tabla temporal.');
    }
}

// Hacer global la función
window.guardarNuevoDelincuente = guardarNuevoDelincuente;

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
    
    // NO GUARDAR EN LOCALSTORAGE
    
    // Actualizar la tabla
    actualizarTablaDelincuentes();

    // Cerrar el modal
    cerrarModalDelincuente();
    // Accesibilidad: aria-hidden true cuando el modal está cerrado
    var modal = document.getElementById('delincuenteModal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
    }

    // Resetear el ID del delincuente que se estaba editando
    window.delincuenteEditandoId = null;

    // NOTA: El historial persistente solo se debe actualizar al guardar el documento principal,
    // no en cada guardado temporal de la tabla. Si quieres guardar en el historial, hazlo en la acción final del formulario principal.
}

// Función para agregar un delincuente al historial
function agregarDelincuenteAlHistorial(delincuente) {
    // Verificar si existe la variable global delincuentesPersistentes
    if (typeof window.delincuentesPersistentes === 'undefined') {
        window.delincuentesPersistentes = [];
        // Intentar cargar del localStorage
        const delincuentesGuardados = localStorage.getItem('delincuentesPersistentes');
        if (delincuentesGuardados) {
            try {
                window.delincuentesPersistentes = JSON.parse(delincuentesGuardados);
            } catch (e) {
                window.delincuentesPersistentes = [];
            }
        }
    }
    // Agregar o actualizar delincuente en el historial
    const idx = window.delincuentesPersistentes.findIndex(d => d.cedula === delincuente.cedula);
    if (idx !== -1) {
        window.delincuentesPersistentes[idx] = delincuente;
    } else {
        window.delincuentesPersistentes.push(delincuente);
    }
    localStorage.setItem('delincuentesPersistentes', JSON.stringify(window.delincuentesPersistentes));
    // Actualizar la tabla de historial inmediatamente
    if (typeof actualizarTablaHistorial === 'function') {
        actualizarTablaHistorial();
    }
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
    // Accesibilidad: poner aria-hidden al cerrar el modal
    var modal = document.getElementById('nuevoDelincuenteModal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
    }
    // Cerrar el modal principal de delincuente
    var modalDelincuente = document.getElementById('delincuenteModal');
    if (modalDelincuente) {
        modalDelincuente.style.display = 'none';
    }
}

// Función para guardar la lista de delincuentes
function guardarDelincuentes() {
    try {
        // Eliminado: No guardar delincuentes capturados en localStorage para que la tabla se reinicie cada vez que se recargue la página.
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
        // Eliminado: No guardar delincuentes capturados en localStorage para que la tabla se reinicie cada vez que se recargue la página.
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
            var delincuenteHistorial = {
  nombre: delincuente.nombreCompleto,
  cedula: delincuente.cedula,
  edad: delincuente.edad,
  delito: delincuente.delito,
  cuantia: delincuente.monto,
  denuncia: delincuente.denuncia
};
agregarDelincuenteAlHistorial(delincuenteHistorial);
            
            // Vaciar los datos del delincuente, pero conservar la fila
            window.delincuentes[index] = {
                nombreCompleto: '',
                cedula: '',
                edad: '',
                direccion: '',
                vehiculo: '',
                placa: '',
                colorVehiculo: '',
                lugar: '',
                fecha: '',
                delito: '',
                mercancias: '',
                monto: '',
                denuncia: ''
            };
            // Guardar en localStorage
            guardarDelincuentes();
            // Actualizar la tabla
            actualizarTablaDelincuentes();
            // Mostrar notificación
            mostrarNotificacion('Datos del delincuente borrados, fila conservada.', 'success');
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
    const tablaBody = document.querySelector('#tablaDelincuentesSimple tbody');
    
    if (!tablaBody) {
        console.error('No se encontró el cuerpo de la tabla de delincuentes');
        return;
    }
    
    // Limpiar solo el contenido visual de la tabla, NO window.delincuentes
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
            <td colspan="14" style="text-align: center;">No hay delincuentes registrados</td>
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
// Siempre inicializar el array en memoria si no existe
if (!window.delincuentes) {
    window.delincuentes = [];
}
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
