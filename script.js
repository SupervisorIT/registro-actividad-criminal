"use strict"; // Recomendado para evitar errores comunes

// --- Variables Globales (si son necesarias) ---

// Si script_productos.js no define window.productosRobados, descomentar y adaptar:
// window.productosRobados = window.productosRobados || []; 

// --- Funciones de Utilidad ---

function formatearFecha(input) {
    const valor = input.value;
    if (!valor) return;

    // Si el valor tiene 8 dígitos (DDMMYYYY)
    if (valor.length === 8 && /^\d+$/.test(valor)) {
        const dia = parseInt(valor.substring(0, 2));
        const mes = parseInt(valor.substring(2, 4));
        const año = parseInt(valor.substring(4, 8));
        
        // Validar que sea una fecha válida
        const fecha = new Date(año, mes - 1, dia);
        if (fecha.getDate() === dia && 
            (fecha.getMonth() + 1) === mes && 
            fecha.getFullYear() === año) {
            input.value = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${año}`;
        }
    } 
    // Si el valor viene del input date (YYYY-MM-DD)
    else if (valor.includes('-')) {
        const parts = valor.split('-');
        if (parts.length === 3) {
            const año = parseInt(parts[0]);
            const mes = parseInt(parts[1]);
            const dia = parseInt(parts[2]);
            input.value = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${año}`;
        }
        return fechaStr; // Devolver original en caso de error
    }
}


function formatearFechaCompleta(fechaObj) {
    if (!fechaObj || !(fechaObj instanceof Date)) return '-';
    const opciones = { 
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
    };
    return fechaObj.toLocaleDateString('es-ES', opciones);
}

function formatearFechaHora(fechaObj) {
    if (!fechaObj || !(fechaObj instanceof Date)) return '';
    try {
        // Usar 'es-PA' para formato panameño si es relevante
        return fechaObj.toLocaleDateString('es-PA') + ' ' + fechaObj.toLocaleTimeString('es-PA');
    } catch (e) {
        return fechaObj.toString();
    }
}

function formatearNumeroConComas(numero) {
    if (numero === null || numero === undefined || isNaN(numero)) return '0.00';
    
    // Asegurar que sea un número válido
    let num = 0;
    try {
        // Convertir a número asegurándonos de que no haya caracteres no numéricos
        if (typeof numero === 'string') {
            // Eliminar cualquier caracter que no sea dígito, punto o signo negativo
            numero = numero.replace(/[^\d.-]/g, '');
        }
        num = parseFloat(numero);
        if (isNaN(num)) num = 0;
    } catch (e) {
        console.error('Error al parsear número:', numero, e);
        num = 0;
    }
    
    // Formatear con 2 decimales
    const formateado = num.toFixed(2);
    let partes = formateado.split('.');
    let parteEntera = partes[0];
    let parteDecimal = partes[1];
    
    // Agregar comas para miles
    parteEntera = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return parteEntera + '.' + parteDecimal;
}

function obtenerMesesTrimestre(trimestre) { // trimestre 'Q1', 'Q2', etc.
    const mesesPorTrimestre = {
        Q1: [1, 2, 3], Q2: [4, 5, 6], Q3: [7, 8, 9], Q4: [10, 11, 12]
    };
    return mesesPorTrimestre[trimestre] || [];
}

function obtenerTextoTrimestre() {
    const select = document.getElementById('trimestre');
    if (select && select.options[select.selectedIndex]) {
        return select.options[select.selectedIndex].text; // '1er Trimestre', etc.
    }
    return select ? select.value : ''; // Fallback al valor 'Q1', etc.
}

// --- Variables y Funciones para Top 20 ---
let productosTop20 = JSON.parse(localStorage.getItem('productosTop20')) || [];

function actualizarTop20() {
    const filasCasos = document.querySelectorAll('#tablaCasos tbody tr:not(.total-row)');
    let nuevosProductos = [];
    
    filasCasos.forEach(fila => {
        const productoCell = fila.querySelector('td:nth-child(13)');
        const cantidadCell = fila.querySelector('td:nth-child(2)');
        
        if (!productoCell || !cantidadCell) return;
        
        const producto = productoCell.textContent.trim();
        const cantidad = parseInt(cantidadCell.textContent) || 0;
        
        if (!producto || cantidad <= 0) return;
        
        // Buscar si el producto ya existe en los nuevos productos
        const productoExistente = nuevosProductos.find(p => p.nombre.toLowerCase() === producto.toLowerCase());
        
        if (productoExistente) {
            productoExistente.cantidad += cantidad;
        } else {
            nuevosProductos.push({
                nombre: producto,
                cantidad: cantidad
            });
        }
    });
    
    // Actualizar productosTop20 con los nuevos datos
    productosTop20 = nuevosProductos;
    
    // Ordenar por cantidad descendente y limitar a 20 items
    productosTop20.sort((a, b) => b.cantidad - a.cantidad);
    productosTop20 = productosTop20.slice(0, 20);
    
    // Guardar en localStorage
    localStorage.setItem('productosTop20', JSON.stringify(productosTop20));
    

function mostrarTop20() {
    // Actualizar cada fila del top 20
    for (let i = 1; i <= 20; i++) {
        const producto = productosTop20[i - 1] || { nombre: '', cantidad: 0, cuantia: 0 };
        
        // Actualizar las celdas
        const nombreCell = document.getElementById(`nombre-${i}`);
        const cantidadCell = document.getElementById(`cantidad-${i}`);
        
        if (nombreCell && cantidadCell) {
            nombreCell.textContent = producto.nombre || '';
            cantidadCell.textContent = producto.cantidad > 0 ? producto.cantidad : '';
        }
    }

    // Actualizar el total si existe una fila de total
    const totalRow = document.querySelector('#tablaProductos tfoot tr');
    if (totalRow) {
        const totalProductos = productosTop20.reduce((sum, p) => sum + p.cantidad, 0);
        const totalCantidadCell = totalRow.querySelector('.total-cantidad');
        if (totalCantidadCell) {
            totalCantidadCell.textContent = totalProductos;
        }
    }
}

function actualizarTop20() {
    const filas = document.querySelectorAll('#tablaCasos tbody tr:not(.total-row)');
    let nuevosProductos = [];
    
    filas.forEach(fila => {
        const productoCell = fila.querySelector('td:nth-child(13)');
        const cantidadCell = fila.querySelector('td:nth-child(2)');
        
        if (!productoCell || !cantidadCell) return;
        
        const producto = productoCell.textContent.trim();
        const cantidad = parseInt(cantidadCell.textContent) || 0;
        
        if (!producto || cantidad <= 0) return;
        
        // Buscar si el producto ya existe en los nuevos productos
        const productoExistente = nuevosProductos.find(p => p.nombre.toLowerCase() === producto.toLowerCase());
        
        if (productoExistente) {
            productoExistente.cantidad += cantidad;
        } else {
            nuevosProductos.push({
                nombre: producto,
                cantidad: cantidad
            });
        }
    });
    
    // Actualizar productosTop20 con los nuevos datos
    productosTop20 = nuevosProductos;
    
    // Ordenar por cantidad descendente y limitar a 20 items
    productosTop20.sort((a, b) => b.cantidad - a.cantidad);
    productosTop20 = productosTop20.slice(0, 20);
    
    // Guardar en localStorage
    localStorage.setItem('productosTop20', JSON.stringify(productosTop20));
    
    // Actualizar la tabla
    mostrarTop20();
    
    console.log('Top 20 actualizado:', productosTop20); // Para depuración
}

function mostrarModalLimpiezaTop20() {
    // Prevenir cualquier comportamiento por defecto
    event.preventDefault();
    
    // Asegurarnos de que el modal está inicializado
    if (!$('#modalLimpiezaTop20').data('bs.modal')) {
        $('#modalLimpiezaTop20').modal({
            backdrop: 'static',
            keyboard: false
        });
    }
    
    // Mostrar el modal
    $('#modalLimpiezaTop20').modal('show');
    
    // Limpiar campos por si acaso
    document.getElementById('adminUsuario').value = '';
    document.getElementById('adminPassword').value = '';
    
    // Enfocar el campo de usuario
    setTimeout(() => {
        document.getElementById('adminUsuario').focus();
    }, 500);
}

function actualizarReportePerdidas() {
    const filas = document.querySelectorAll('#tablaCasos tbody tr:not(.total-row)');
    const reportePorMes = {
        'Abril': { casos: 0, perdidas: 0, fechas: [] },
        'Mayo': { casos: 0, perdidas: 0, fechas: [] },
        'Junio': { casos: 0, perdidas: 0, fechas: [] }
    };

    filas.forEach(fila => {
        const fechaCell = fila.querySelector('td:nth-child(11)');
        const cantidadCell = fila.querySelector('td:nth-child(2)');
        const cuantiaCell = fila.querySelector('td:nth-child(14)');

        if (!fechaCell || !cantidadCell || !cuantiaCell) return;

        const fechaStr = fechaCell.textContent.trim();
        if (!fechaStr || fechaStr === '') return;

        // Convertir la fecha a objeto Date
        const partes = fechaStr.split('/');
        if (partes.length !== 3) return;

        const fecha = new Date(partes[2], partes[1] - 1, partes[0]);
        if (isNaN(fecha.getTime())) return;

        const mes = fecha.toLocaleString('es-ES', { month: 'long' });
        const cantidad = parseInt(cantidadCell.textContent) || 0;
        const cuantiaStr = cuantiaCell.textContent.replace('B/.', '').trim();
        const cuantia = parseFloat(cuantiaStr) || 0;

        const nombreMes = mes.charAt(0).toUpperCase() + mes.slice(1);
        if (reportePorMes[nombreMes]) {
            reportePorMes[nombreMes].casos += cantidad;
            reportePorMes[nombreMes].perdidas += cuantia;
            reportePorMes[nombreMes].fechas.push(fechaStr);
        }
    });

    // Actualizar la tabla de reporte
    Object.entries(reportePorMes).forEach(([mes, datos]) => {
        const fila = document.querySelector(`#reporte-${mes.toLowerCase()}`);
        if (fila) {
            fila.querySelector('.casos').textContent = datos.casos;
            fila.querySelector('.perdidas').textContent = `B/. ${datos.perdidas.toFixed(3)}`;
            
            // Actualizar el rango de fechas
            const rangoCell = fila.querySelector('.rango-fechas');
            if (rangoCell) {
                if (datos.fechas.length > 0) {
                    datos.fechas.sort();
                    const inicio = datos.fechas[0];
                    const fin = datos.fechas[datos.fechas.length - 1];
                    rangoCell.textContent = inicio === fin ? inicio : `${inicio} - ${fin}`;
                } else {
                    rangoCell.textContent = '-';
                }
            }
        }
    });

    // Actualizar totales
    const totalCasos = Object.values(reportePorMes).reduce((sum, mes) => sum + mes.casos, 0);
    const totalPerdidas = Object.values(reportePorMes).reduce((sum, mes) => sum + mes.perdidas, 0);

    const totalRow = document.querySelector('#tablaPerdidas .total-row');
    if (totalRow) {
        const casosCell = totalRow.querySelector('.casos');
        const perdidasCell = totalRow.querySelector('.perdidas');
        const rangoCell = totalRow.querySelector('.rango-fechas');

        if (casosCell) casosCell.textContent = totalCasos;
        if (perdidasCell) perdidasCell.textContent = `B/. ${totalPerdidas.toFixed(3)}`;
        if (rangoCell) rangoCell.textContent = '-';
    }
}
    
    // Limpiar campos por si acaso
    document.getElementById('adminUsuario').value = '';
    document.getElementById('adminPassword').value = '';
    
    // Enfocar el campo de usuario
    setTimeout(() => {
        document.getElementById('adminUsuario').focus();
    }, 500);
}

function limpiarTop20() {
    const usuario = document.getElementById('adminUsuario').value;
    const password = document.getElementById('adminPassword').value;
    
    // Credenciales de administrador
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'admin123';
    
    if (usuario === ADMIN_USER && password === ADMIN_PASS) {
        // Confirmar antes de limpiar
        if (confirm('¿Está seguro que desea limpiar el historial del Top 20? Esta acción no puede deshacerse.')) {
            // Solo limpiar la tabla del Top 20 y su almacenamiento
            productosTop20 = [];
            localStorage.removeItem('productosTop20');
            mostrarTop20();
            $('#modalLimpiezaTop20').modal('hide');
            alert('Top 20 ha sido limpiado exitosamente.');
        } else {
            $('#modalLimpiezaTop20').modal('hide');
        }
    } else {
        alert('Credenciales incorrectas. Acceso denegado.');
    }
    
    // Limpiar campos de autenticación
    document.getElementById('adminUsuario').value = '';
    document.getElementById('adminPassword').value = '';
}

// --- Funciones de Cálculo ---

function calcularTotalesCasos() {
    console.log("Calculando totales de la tabla de casos...");
    let totalCasos = 0;
    let totalCuantia = 0;
    let totalDenuncias = 0;

    const filasCasos = document.querySelectorAll('#tablaCasosDelictivos tbody tr:not(.total-row):not(#placeholder-casos)');

    filasCasos.forEach(fila => {
        const cantidadInput = fila.querySelector('input[type="number"]');
        const cuantiaInput = fila.querySelector('.cuantia-input');
        const denunciasInput = fila.querySelector('.denuncias-input');

        // Procesar cantidad (asegurar que sea un número entero válido)
        let cantidad = 0;
        try {
            if (cantidadInput && cantidadInput.value) {
                cantidad = parseInt(cantidadInput.value) || 0;
                if (isNaN(cantidad) || !isFinite(cantidad)) cantidad = 0;
                cantidad = Math.max(0, cantidad);
            }
        } catch (e) {
            console.error('Error al procesar cantidad:', cantidadInput?.value, e);
        }
        
        // Procesar denuncias (asegurar que sea un número entero válido)
        let denuncias = 0;
        try {
            if (denunciasInput && denunciasInput.value) {
                denuncias = parseInt(denunciasInput.value) || 0;
                if (isNaN(denuncias) || !isFinite(denuncias)) denuncias = 0;
                denuncias = Math.max(0, denuncias);
            }
        } catch (e) {
            console.error('Error al procesar denuncias:', denunciasInput?.value, e);
        }
        
        // Procesar cuantía (asegurar que sea un número decimal válido)
        let cuantia = 0;
        try {
            if (cuantiaInput && cuantiaInput.value) {
                const cuantiaTexto = cuantiaInput.value.replace(/[^\d.-]/g, '');
                cuantia = parseFloat(cuantiaTexto) || 0;
                if (isNaN(cuantia) || !isFinite(cuantia)) cuantia = 0;
                cuantia = Math.max(0, Math.round(cuantia * 100) / 100);
            }
        } catch (e) {
            console.error('Error al procesar cuantía:', cuantiaInput?.value, e);
        }
        
        // Acumular totales
        totalCasos += cantidad;
        totalDenuncias += denuncias;
        totalCuantia += cuantia;
    });

    // Actualizar los elementos de totales
    const totalCantidadElement = document.getElementById('totalCantidad');
    const totalCuantiaElement = document.getElementById('totalCuantia');
    const totalDenunciasElement = document.getElementById('totalDenuncias');

    if (totalCantidadElement) totalCantidadElement.textContent = totalCasos;
    if (totalCuantiaElement) totalCuantiaElement.textContent = 'B/. ' + formatearNumeroConComas(totalCuantia);
    if (totalDenunciasElement) totalDenunciasElement.textContent = totalDenuncias;

    console.log("Totales calculados:", { totalCasos, totalCuantia, totalDenuncias });
}

// --- Funciones de Manipulación del DOM y Eventos ---

function inicializarApp() {
    console.log("Inicializando aplicación...");

    // Inicializar arrays si no existen
    window.productosRobados = window.productosRobados || [];

    // Cargar y mostrar el Top 20 de productos
    mostrarTop20();

    // Configurar evento para el botón de generar PDF
    const btnGenerarPDF = document.getElementById('btnGenerarPDF');
    if (btnGenerarPDF) {
        btnGenerarPDF.addEventListener('click', () => generarPDFPrincipal(false));
    }

    // Agregar evento para formatear fechas y actualizar totales
    document.addEventListener('input', function(e) {
        // Formatear fechas
        if (e.target.classList.contains('fecha-input')) {
            formatearFecha(e.target);
        } else if (e.target.classList.contains('cantidad-input') || 
                   e.target.classList.contains('cuantia-input') || 
                   e.target.classList.contains('denuncias-input')) {
            calcularTotalesCasos();
        }
    });

    // Agregar evento change para actualizar Top 20 cuando se complete la entrada
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('producto-input') || 
            e.target.classList.contains('cantidad-input')) {
            const fila = e.target.closest('tr');
            if (!fila) return;

            const productoInput = fila.querySelector('.producto-input');
            const cantidadInput = fila.querySelector('.cantidad-input');
            const cuantiaInput = fila.querySelector('.cuantia-input');

            if (productoInput && cantidadInput && cuantiaInput) {
                const producto = productoInput.value.trim();
                const cantidad = parseInt(cantidadInput.value) || 0;
                const cuantia = parseFloat(cuantiaInput.value) || 0;

                if (producto && cantidad > 0) {
                    // Actualizar el Top 20
                    const productoExistente = productosTop20.find(p => p.nombre.toLowerCase() === producto.toLowerCase());

                    if (productoExistente) {
                        productoExistente.cantidad = cantidad;
                        productoExistente.cuantia = cuantia;
                    } else {
                        productosTop20.push({
                            nombre: producto,
                            cantidad: cantidad,
                            cuantia: cuantia
                        });
                    }

                    // Ordenar y limitar a 20 items
                    productosTop20.sort((a, b) => b.cantidad - a.cantidad);
                    productosTop20 = productosTop20.slice(0, 20);

                    // Guardar en localStorage y actualizar la tabla
                    localStorage.setItem('productosTop20', JSON.stringify(productosTop20));
                    mostrarTop20();
                }
            }
        }
    });

    // Agregar evento para formatear fechas y actualizar totales
    document.addEventListener('input', function(e) {
        // Formatear fechas
        if (e.target.classList.contains('fecha-input')) {
            formatearFecha(e.target);
        } else if (e.target.classList.contains('cantidad-input') || 
                   e.target.classList.contains('cuantia-input') || 
                   e.target.classList.contains('denuncias-input')) {
            calcularTotalesCasos();
            actualizarReportePerdidas();
        }
    });

    // Configurar el selector de trimestre
    const trimestreSelect = document.getElementById('trimestre');
    if (trimestreSelect) {
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth(); // 0-11
        const trimestreActual = Math.floor(mesActual / 3) + 1; // 1-4
        trimestreSelect.value = `Q${trimestreActual}`;
        trimestreSelect.addEventListener('change', () => {
             validarFechasCasosContraTrimestreInline(); // Validar al cambiar trimestre
             actualizarTablaPerdidasTrimestre(); // Primero actualizar estructura de la tabla
             actualizarReportePerdidas(); // Luego actualizar los datos
        });
    }

    // Configurar fecha inicial
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = formatearFechaCompleta(new Date());
    }

    // Calcular totales iniciales al cargar
    calcularTotalesCasos();
    
    // Inicializar y actualizar tabla de pérdidas trimestrales
    actualizarTablaPerdidasTrimestre(); // Primero crear la estructura de la tabla
    actualizarReportePerdidas(); // Luego calcular y mostrar los datos

    // Añadir listeners a la tabla de casos para recalcular totales y pérdidas
    const tablaCasos = document.getElementById('tablaCasosDelictivos');
    if (tablaCasos) {
        tablaCasos.addEventListener('input', (event) => {
            if (event.target.matches('.cantidad-input, .cuantia-input, .denuncias-input')) {
                calcularTotalesCasos();
                // Recalcular pérdidas solo si cambia la cuantía o la fecha
                if (event.target.matches('.cuantia-input')) {
                     actualizarReportePerdidas();
                }
            }
        });
         tablaCasos.addEventListener('change', (event) => {
            // Para input date y select
            if (event.target.matches('input[type="date"], select.tipificacion-select')) {
                validarFechasCasosContraTrimestreInline(); // Validar fecha si cambia
                actualizarReportePerdidas(); // Recalcular pérdidas si cambia fecha o tipificación (aunque tipificación no afecta pérdidas directamente)
            }
        });
    }

    // Añadir validación inline a fechas
    agregarValidacionInlineFechasCasos();

    // Asegurar que haya al menos una fila o placeholder
    asegurarFilaVaciaCasos();

    // No necesitamos inicializar gráficos por ahora
    console.log('Omitiendo inicialización de gráficos.');

    // Inicializar información del usuario (si existe el elemento)
    const usuarioInfoElement = document.getElementById('usuarioInfo');
    if(usuarioInfoElement) {
        const usuarioActivo = sessionStorage.getItem('usuarioActivo');
        if (usuarioActivo) {
            try {
                const usuario = JSON.parse(usuarioActivo);
                usuarioInfoElement.textContent = usuario.nombre || 'N/A';
            } catch(e) {
                console.error("Error parsing usuarioActivo", e);
                usuarioInfoElement.textContent = 'Error';
            }
        } else {
             usuarioInfoElement.textContent = 'No conectado';
        }
    }

    // Si necesitas inicializar la lista de productos desde localStorage (asegúrate que el HTML tenga los elementos necesarios)
    // inicializarProductosRobados(); 

    console.log("Aplicación inicializada.");
}

function asegurarFilaVaciaCasos() {
    const tbody = document.querySelector('#tablaCasosDelictivos tbody');
    if (tbody) {
        const filasDatos = tbody.querySelectorAll('tr:not(.total-row):not(#placeholder-casos)');
        const placeholder = document.getElementById('placeholder-casos');
        if (filasDatos.length === 0 && placeholder) {
            placeholder.style.display = ''; // Mostrar placeholder
        } else if (filasDatos.length > 0 && placeholder) {
            placeholder.style.display = 'none'; // Ocultar placeholder
        }
        // Si ni filas ni placeholder existen, puedes optar por añadir una fila editable aquí si es necesario
    }
}


function validarFechasCasosContraTrimestreInline() {
    const trimestreSelect = document.getElementById('trimestre');
    const tablaCasos = document.getElementById('tablaCasosDelictivos');
    if (!trimestreSelect || !tablaCasos) return false; // No se puede validar

    const trimestre = trimestreSelect.value;
    const mesesDelTrimestre = obtenerMesesTrimestre(trimestre);
    const filasCasos = tablaCasos.querySelectorAll('tbody tr:not(.total-row):not(#placeholder-casos)');
    let hayErrores = false;

    filasCasos.forEach(fila => {
        const fechaInput = fila.querySelector('input.fecha-input[type="date"]');
        if (fechaInput) {
            // Limpiar errores previos
            fechaInput.classList.remove('is-invalid');
            let errorDiv = fila.querySelector('.mensaje-error-fecha');
            if (errorDiv) errorDiv.remove();

            if (fechaInput.value) {
                try {
                    // Usar UTC para evitar problemas de zona horaria al obtener el mes
                    const fechaParts = fechaInput.value.split('-');
                    const fechaUTC = new Date(Date.UTC(fechaParts[0], fechaParts[1] - 1, fechaParts[2]));
                    const mes = fechaUTC.getUTCMonth() + 1; // Mes (1-12)
                    
                    if (!mesesDelTrimestre.includes(mes)) {
                        hayErrores = true;
                        fechaInput.classList.add('is-invalid');
                        errorDiv = document.createElement('div');
                        errorDiv.className = 'mensaje-error-fecha invalid-feedback'; // Usar clase de Bootstrap si aplica
                        errorDiv.textContent = 'Fecha fuera del trimestre.';
                        // Insertar después del input
                        fechaInput.parentNode.insertBefore(errorDiv, fechaInput.nextSibling);
                    }
                } catch (e) {
                    console.error("Error validando fecha:", fechaInput.value, e);
                    // Opcionalmente marcar como inválido si la fecha no se puede parsear
                }
            }
        }
    });
    
    // Mostrar mensaje general si hay errores
    mostrarMensajeValidacionGlobal(hayErrores ? 'Hay fechas fuera del trimestre seleccionado.' : '', hayErrores);

    return hayErrores;
}

function agregarValidacionInlineFechasCasos() {
    const tabla = document.getElementById('tablaCasosDelictivos');
    if (!tabla) return;
    tabla.addEventListener('change', function(event) {
        if (event.target && event.target.matches('input.fecha-input[type="date"]')) {
            validarFechasCasosContraTrimestreInline();
        }
    });
}

function mostrarMensajeValidacionGlobal(mensaje, esError = true) {
    let mensajeDiv = document.getElementById('mensajeValidacionTrimestre');
    if (!mensajeDiv) return; // Si el div no existe, no hacemos nada

    if (mensaje) {
        mensajeDiv.textContent = mensaje;
        mensajeDiv.className = esError ? 'mensaje-validacion-error' : 'mensaje-validacion-ok'; // Clases para estilizar
        mensajeDiv.style.display = 'block'; // Mostrar
    } else {
        mensajeDiv.style.display = 'none'; // Ocultar si no hay mensaje
        mensajeDiv.textContent = '';
        mensajeDiv.className = 'mensaje-validacion-oculto';
    }
}

// --- Funciones para Reporte de Pérdidas Trimestrales ---

function actualizarTablaPerdidasTrimestre() {
    const trimestreSelect = document.getElementById('trimestre');
    const tbodyPerdidas = document.querySelector('#tablaPerdidas tbody');
    if (!trimestreSelect || !tbodyPerdidas) return;

    const trimestreValor = trimestreSelect.value;
    const mesesDelTrimestre = obtenerMesesTrimestre(trimestreValor);
    tbodyPerdidas.innerHTML = ''; // Limpiar

    mesesDelTrimestre.forEach(mesNum => {
        const nombreDelMes = new Date(2000, mesNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${nombreDelMes.charAt(0).toUpperCase() + nombreDelMes.slice(1)}</td>
                        <td class="casos-mes" data-mes="${mesNum}">0</td>
                        <td class="perdidas-mes" data-mes="${mesNum}">B/. 0.00</td>
                        <td class="fecha-mes" data-mes="${mesNum}">-</td>`;
        tbodyPerdidas.appendChild(tr);
    });
}


function actualizarReportePerdidas() {
    try {
        const trimestreSelect = document.getElementById('trimestre');
        if (!trimestreSelect) return;
        const trimestre = trimestreSelect.value;
        const mesesDelTrimestre = obtenerMesesTrimestre(trimestre);
        
        const datosPorMes = {};
        mesesDelTrimestre.forEach(m => {
            datosPorMes[m] = { casos: 0, perdidas: 0, fechaMin: null, fechaMax: null };
        });
        
        const filasCasos = document.querySelectorAll('#tablaCasosDelictivos tbody tr:not(.total-row):not(#placeholder-casos)');
        filasCasos.forEach(tr => {
            const fechaInput = tr.querySelector('input.fecha-input'); // Buscar por clase en lugar de por tipo
            const cantidadInput = tr.querySelector('.cantidad-input'); // Usar clase correcta
            const cuantiaInput = tr.querySelector('.cuantia-input');   // Usar clase correcta
            
            if (fechaInput && fechaInput.value && cantidadInput && cuantiaInput) {
                 const fechaVal = fechaInput.value; 
                 try {
                    // Procesar la fecha en formato DD/MM/AAAA o DD-MM-AAAA
                    let fechaUTC, mesNum;
                    
                    if (fechaVal.includes('/')) {
                        // Formato DD/MM/AAAA
                        const fechaParts = fechaVal.split('/');
                        fechaUTC = new Date(Date.UTC(fechaParts[2], fechaParts[1] - 1, fechaParts[0]));
                    } else if (fechaVal.includes('-')) {
                        const fechaParts = fechaVal.split('-');
                        // Verificar si está en formato AAAA-MM-DD o DD-MM-AAAA
                        if (fechaParts[0].length === 4) {
                            // Formato AAAA-MM-DD
                            fechaUTC = new Date(Date.UTC(fechaParts[0], fechaParts[1] - 1, fechaParts[2]));
                        } else {
                            // Formato DD-MM-AAAA
                            fechaUTC = new Date(Date.UTC(fechaParts[2], fechaParts[1] - 1, fechaParts[0]));
                        }
                    } else {
                        // Intentar procesar como fecha sin separadores (DDMMAAAA)
                        if (fechaVal.length >= 8) {
                            const dia = fechaVal.substring(0, 2);
                            const mes = fechaVal.substring(2, 4);
                            const anio = fechaVal.substring(4, 8);
                            fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));
                        } else {
                            console.error('Formato de fecha no reconocido:', fechaVal);
                            return; // Saltar esta fila si la fecha no es válida
                        }
                    }
                    
                    // Verificar que la fecha sea válida
                    if (isNaN(fechaUTC.getTime())) {
                        console.error('Fecha inválida:', fechaVal);
                        return; // Saltar esta fila si la fecha no es válida
                    }
                    
                    mesNum = fechaUTC.getUTCMonth() + 1; 

                    if (datosPorMes[mesNum]) { // Si el mes pertenece al trimestre
                        // Procesar cantidad (asegurar que sea un número entero)
                        let cantidad = 0;
                        try {
                            cantidad = parseInt(cantidadInput.value) || 0;
                        } catch (e) {
                            console.error('Error al parsear cantidad:', cantidadInput.value, e);
                        }
                        
                        // Procesar cuantía (limpiar y convertir a número decimal)
                        let cuantia = 0;
                        try {
                            // Eliminar cualquier caracter que no sea dígito, punto o signo negativo
                            const cuantiaTexto = cuantiaInput.value.replace(/[^\d.-]/g, '');
                            cuantia = parseFloat(cuantiaTexto) || 0;
                            // Verificar que sea un número válido
                            if (isNaN(cuantia) || !isFinite(cuantia)) cuantia = 0;
                        } catch (e) {
                            console.error('Error al parsear cuantía:', cuantiaInput.value, e);
                        }
                        
                        // Acumular valores
                        datosPorMes[mesNum].casos += cantidad; // Sumar la cantidad del input
                        datosPorMes[mesNum].perdidas += cuantia;
                        
                        if (!datosPorMes[mesNum].fechaMin || fechaUTC < datosPorMes[mesNum].fechaMin) {
                            datosPorMes[mesNum].fechaMin = fechaUTC;
                        }
                        if (!datosPorMes[mesNum].fechaMax || fechaUTC > datosPorMes[mesNum].fechaMax) {
                            datosPorMes[mesNum].fechaMax = fechaUTC;
                        }
                    }
                 } catch (e) {
                     console.error("Error procesando fecha en reporte pérdidas:", fechaVal, e);
                 }
            }
        });
        
        // Inicializar totales con valores seguros
        let totalCasosGeneral = 0;
        let totalPerdidasGeneral = 0;
        
        // Procesar cada mes del trimestre
        mesesDelTrimestre.forEach(mesNum => {
            const elCasos = document.querySelector(`.casos-mes[data-mes="${mesNum}"]`);
            const elPerdidas = document.querySelector(`.perdidas-mes[data-mes="${mesNum}"]`);
            const elFechas = document.querySelector(`.fecha-mes[data-mes="${mesNum}"]`);

            // Asegurar que los valores de casos sean enteros válidos
            const casosMes = Math.max(0, parseInt(datosPorMes[mesNum].casos) || 0);
            
            // Asegurar que los valores de pérdidas sean números decimales válidos
            let perdidasMes = 0;
            try {
                perdidasMes = parseFloat(datosPorMes[mesNum].perdidas) || 0;
                // Verificar que sea un número válido y finito
                if (isNaN(perdidasMes) || !isFinite(perdidasMes)) perdidasMes = 0;
                // Redondear a 2 decimales para evitar errores de punto flotante
                perdidasMes = Math.round(perdidasMes * 100) / 100;
            } catch (e) {
                console.error('Error al procesar pérdidas del mes', mesNum, e);
                perdidasMes = 0;
            }
            
            // Actualizar los elementos del DOM
            if (elCasos) elCasos.textContent = casosMes;
            if (elPerdidas) elPerdidas.textContent = 'B/. ' + formatearNumeroConComas(perdidasMes);
            
            if (elFechas) {
                if (datosPorMes[mesNum].fechaMin && datosPorMes[mesNum].fechaMax) {
                    // Usar formatearFecha para formato DD/MM/YYYY
                    const fMin = formatearFecha(datosPorMes[mesNum].fechaMin.toISOString().slice(0,10));
                    const fMax = formatearFecha(datosPorMes[mesNum].fechaMax.toISOString().slice(0,10));
                    elFechas.textContent = (fMin === fMax) ? fMin : `${fMin} - ${fMax}`;
                } else {
                    elFechas.textContent = '-';
                }
            }
            
            // Acumular totales con valores seguros
            totalCasosGeneral += casosMes;
            totalPerdidasGeneral += perdidasMes;
        });
        
        const elTotalCasosPerdidas = document.getElementById('totalCasosPerdidas');
        const elTotalPerdidasMonto = document.getElementById('totalPerdidasMonto');
        if (elTotalCasosPerdidas) elTotalCasosPerdidas.textContent = totalCasosGeneral;
        if (elTotalPerdidasMonto) elTotalPerdidasMonto.textContent = 'B/. ' + formatearNumeroConComas(totalPerdidasGeneral);
        
    } catch (error) {
        console.error('Error al actualizar reporte de pérdidas:', error);
    }
}


// --- Funciones de Generación de PDF (Limpiadas y unificadas) ---

// Función principal para iniciar la generación del PDF
// Si vistaPrevia es true, retorna el documento PDF para mostrarlo en el modal
// Si vistaPrevia es false o no se especifica, descarga el PDF directamente
async function generarPDFPrincipal(vistaPrevia = false) {
    console.log('Iniciando generación de PDF...');
    
    // 1. Validar fechas
    const hayErroresFecha = validarFechasCasosContraTrimestreInline();
    if (hayErroresFecha) {
        mostrarMensajeValidacionGlobal('Corrija las fechas resaltadas antes de generar el PDF.', true);
        return; // Detener si hay errores
    } else {
         mostrarMensajeValidacionGlobal(''); // Limpiar mensaje si no hay errores
    }

    // 2. Validar campos obligatorios básicos
    const empresa = document.getElementById('empresa').value;
    const responsable = document.getElementById('responsable').value;
    const cedula = document.getElementById('cedula').value;
    if (!empresa || !responsable || !cedula) {
        alert('Por favor complete los campos obligatorios: Empresa, Responsable y Cédula.');
        return;
    }
    
    // 3. Asegurarse de que jsPDF y autoTable estén cargados
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
        alert('Error: La biblioteca jsPDF no está disponible.');
        return;
    }
     if (typeof jspdf.jsPDF.autoTable !== 'function') {
        alert('Error: El plugin jsPDF-AutoTable no está disponible.');
        return;
    }
    const { jsPDF } = jspdf; // Destructuring para obtener el constructor

    try {
        // Crear nombre de archivo
        const trimestreTexto = obtenerTextoTrimestre().replace(/\s+/g, '_');
        const fechaTexto = document.getElementById('fecha').value.replace(/\//g, '-');
        const nombreArchivo = `Reporte_${empresa.replace(/\s+/g, '_')}_${trimestreTexto}_${fechaTexto}.pdf`;

        // Crear instancia del PDF
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // --- Contenido del PDF ---
        const azulOscuro = [30, 50, 70];
        const grisClaro = [240, 240, 240];
        doc.setFont('helvetica');
        let finalY = 15; // Posición Y inicial

        // Título
        doc.setFontSize(16);
        doc.setTextColor(...azulOscuro);
        doc.text('FORMULARIO PARA BASE DE DATOS Y ESTADÍSTICAS', 105, finalY, { align: 'center' });
        finalY += 10;

        // Sección Información General
        doc.setFillColor(...grisClaro);
        doc.rect(15, finalY, 180, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(...azulOscuro);
        doc.text('INFORMACIÓN GENERAL', 105, finalY + 6, { align: 'center' });
        finalY += 10;

        const infoGeneralData = [
            ['Empresa:', empresa, 'Fecha:', document.getElementById('fecha').value],
            ['Responsable:', responsable, 'Trimestre:', obtenerTextoTrimestre()],
            ['Cédula:', cedula, '', '']
        ];
        doc.autoTable({
            startY: finalY, body: infoGeneralData, theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 28 }, 1: { cellWidth: 62 },
                2: { fontStyle: 'bold', cellWidth: 28 }, 3: { cellWidth: 62 }
            }
        });
        finalY = doc.lastAutoTable.finalY + 5;

        // Sección Casos Delictivos
        doc.setFillColor(...grisClaro);
        doc.rect(15, finalY, 180, 8, 'F');
        doc.setFontSize(12);
        doc.text('CASOS DELICTIVOS OCURRIDOS EN EL TRIMESTRE', 105, finalY + 6, { align: 'center' });
        finalY += 10;

        const datosCasos = obtenerDatosCasosParaPDF(); // Usa la función auxiliar
        doc.autoTable({
            startY: finalY, head: [datosCasos[0]], body: datosCasos.slice(1), theme: 'grid',
            headStyles: { fillColor: grisClaro, textColor: azulOscuro, fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 8, cellPadding: 1.5, lineWidth: 0.1, overflow: 'linebreak' }, // Ajustar tamaño letra
            margin: { left: 15, right: 15 }, tableWidth: 180,
            columnStyles: { /* Definir anchos si es necesario para buen ajuste */ },
            didParseCell: (data) => { // Estilo para fila total
                 if (data.row.section === 'body' && data.row.raw[0] === 'TOTAL') {
                    data.cell.styles.fontStyle = 'bold';
                 }
             }
        });
        finalY = doc.lastAutoTable.finalY + 5;

        // Sección Reporte de Pérdidas
        doc.setFillColor(...grisClaro);
        doc.rect(15, finalY, 180, 8, 'F');
        doc.setFontSize(12);
        doc.text('REPORTE DE PÉRDIDAS TRIMESTRALES', 105, finalY + 6, { align: 'center' });
        finalY += 10;

        const datosPerdidas = obtenerDatosPerdidasParaPDF(); // Usa la función auxiliar
        doc.autoTable({
            startY: finalY, head: [datosPerdidas[0]], body: datosPerdidas.slice(1), theme: 'grid',
            headStyles: { fillColor: grisClaro, textColor: azulOscuro, fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1 },
            margin: { left: 15, right: 15 }, tableWidth: 180,
            columnStyles: { /* ... */ },
             didParseCell: (data) => { // Estilo para fila total
                 if (data.row.section === 'body' && data.row.raw[0] === 'TOTAL') {
                    data.cell.styles.fontStyle = 'bold';
                 }
             }
        });
        finalY = doc.lastAutoTable.finalY + 5;

         // Sección Top Productos (si hay datos)
        const datosProductos = obtenerDatosProductosParaPDF();
        if (datosProductos.length > 1) { // Si hay más que solo la cabecera
            // Comprobar si cabe en la página actual
            if (finalY + 20 > doc.internal.pageSize.height - 20) { // Margen inferior de 20
                 doc.addPage();
                 finalY = 20; // Reiniciar Y en nueva página
            }
            doc.setFillColor(...grisClaro);
            doc.rect(15, finalY, 180, 8, 'F');
            doc.setFontSize(12);
            doc.text('TOP 20 PRODUCTOS Y MERCANCÍAS ROBADAS', 105, finalY + 6, { align: 'center' });
            finalY += 10;
            doc.autoTable({
                startY: finalY, head: [datosProductos[0]], body: datosProductos.slice(1), theme: 'grid',
                // ... estilos ...
            });
            finalY = doc.lastAutoTable.finalY + 5;
        }

        // Pie de página en la primera página
        doc.setPage(1); // Volver a la primera página
        const fechaGeneracion = new Date();
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Documento generado el ${formatearFechaHora(fechaGeneracion)}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });

        // --- Fin Contenido PDF ---

        // 4. Guardar en Drive (si la función existe)
        if (typeof guardarPDFenDrive === 'function') {
            const pdfBlob = doc.output('blob');
            await guardarPDFenDrive(pdfBlob, nombreArchivo);
            console.log('PDF guardado en Google Drive correctamente');
            alert('Reporte guardado exitosamente en Google Drive.');
        } else {
            console.warn('Función guardarPDFenDrive no encontrada. Mostrando PDF.');
            // Si no hay función para guardar en drive, mostrarlo o descargarlo
             doc.output('dataurlnewwindow'); // Abrir en nueva pestaña
             // O descargar: doc.save(nombreArchivo);
        }

        // 5. Registrar en historial (si la función existe)
        if (typeof registrarReporte === 'function') {
             // Recopilar datos necesarios para el historial
             const datosReporte = { /* ... */ };
             registrarReporte(datosReporte);
        }

    } catch (error) {
        console.error('Error detallado al generar PDF:', error);
        alert('Ocurrió un error al generar el PDF: ' + error.message);
    }
}

// --- Funciones Auxiliares para Obtener Datos para PDF ---

function obtenerDatosCasosParaPDF() {
    const datos = [];
    datos.push(['Tipificación', 'Fecha', 'Cantidad', 'Cuantía (B/.)', 'Denuncias', 'Producto/Mercancía', 'Observaciones']);
    const filas = document.querySelectorAll('#tablaCasosDelictivos tbody tr:not(.total-row):not(#placeholder-casos)');
    filas.forEach(fila => {
        const tipificacion = fila.querySelector('select')?.value || '';
        const fecha = fila.querySelector('.fecha-input')?.value || '';
        const cantidad = fila.querySelector('.cantidad-input')?.value || '';
        const cuantia = fila.querySelector('.cuantia-input')?.value.replace('B/. ', '') || ''; // Limpiar posible formato
        const denuncias = fila.querySelector('.denuncias-input')?.value || '';
        const producto = fila.querySelector('.producto-input')?.value || '';
        const observaciones = fila.querySelector('textarea')?.value || '';
        // Añadir fila solo si tiene algún dato relevante (ej. tipificación o fecha)
        if (tipificacion || fecha) {
            datos.push([ tipificacion, formatearFecha(fecha), cantidad, cuantia, denuncias, producto, observaciones ]);
        }
    });
    // Fila Total
    datos.push([
        'TOTAL', '', document.getElementById('totalCasos')?.textContent || '0',
        document.getElementById('totalCuantia')?.textContent.replace('B/. ', '') || '0.00',
        document.getElementById('totalDenuncias')?.textContent || '0', '', ''
    ]);
    return datos;
}

function obtenerDatosPerdidasParaPDF() {
    const datos = [];
    datos.push(['Mes', 'Casos', 'Pérdidas (B/.)', 'Rango de Fechas']);
    const filas = document.querySelectorAll('#tablaPerdidas tbody tr'); // Incluir todas las filas generadas
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length === 4) {
            datos.push([ celdas[0].textContent, celdas[1].textContent, celdas[2].textContent, celdas[3].textContent ]);
        }
    });
     // Fila Total
     datos.push([
         'TOTAL', document.getElementById('totalCasosPerdidas')?.textContent || '0',
         document.getElementById('totalPerdidasMonto')?.textContent || 'B/. 0.00', ''
     ]);
    return datos;
}

function obtenerDatosProductosParaPDF() {
    const datos = [];
    datos.push(['#', 'Producto/Mercancía', 'Cantidad Total', 'Valor Total (B/.)']);
    const filas = document.querySelectorAll('#tablaProductos tbody tr'); 
    filas.forEach(fila => {
         const celdas = fila.querySelectorAll('td');
         if (celdas.length === 4) {
             datos.push([ celdas[0].textContent, celdas[1].textContent, celdas[2].textContent, celdas[3].textContent ]);
         }
    });
     // Fila Total
     datos.push([
         'TOTAL', '', document.getElementById('totalCantidadProductos')?.textContent || '0',
         document.getElementById('totalValorProductos')?.textContent || 'B/. 0.00'
     ]);
    return datos;
}

// --- Funciones para la tabla de delincuentes ---
let historialDelincuentes = [];

// Cargar historial al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const historialGuardado = localStorage.getItem('historialDelincuentes');
    if (historialGuardado) {
        historialDelincuentes = JSON.parse(historialGuardado);
        actualizarTablaHistorial();
    }
});

// Función para guardar en el historial
function guardarEnHistorial(delincuente) {
    historialDelincuentes.push(delincuente);
    localStorage.setItem('historialDelincuentes', JSON.stringify(historialDelincuentes));
    actualizarTablaHistorial();
}

// Función para actualizar la tabla del historial
function actualizarTablaHistorial() {
    const tabla = document.getElementById('tablaHistorialDelincuentes').getElementsByTagName('tbody')[0];
    const filaNoHistorial = document.getElementById('filaNoHistorial');

    // Limpiar tabla
    while (tabla.firstChild) {
        tabla.removeChild(tabla.firstChild);
    }

    if (historialDelincuentes.length === 0) {
        tabla.innerHTML = `
            <tr id="filaNoHistorial">
                <td colspan="14" style="text-align: center;">No hay registros en el historial</td>
            </tr>`;
        return;
    }

    // Agregar registros del historial
    historialDelincuentes.forEach((delincuente, index) => {
        const fila = tabla.insertRow();
        Object.values(delincuente).forEach((valor, i) => {
            const celda = fila.insertCell();
            if (i === 0) { // #
                celda.textContent = index + 1;
            } else {
                celda.textContent = valor || '';
            }
        });
    });
}

// --- Funciones para la tabla de delincuentes ---
function agregarDelincuente() {
    const tabla = document.getElementById('tablaDelincuentes').getElementsByTagName('tbody')[0];
    const filaNoDelincuentes = document.getElementById('filaNoDelincuentes');
    if (filaNoDelincuentes) {
        filaNoDelincuentes.style.display = 'none';
    }

    const fila = tabla.insertRow();
    const numCeldas = 15; // Número total de columnas
    const fecha = new Date().toISOString().split('T')[0];

    for (let i = 0; i < numCeldas; i++) {
        const celda = fila.insertCell();
        if (i === 0) { // #
            celda.textContent = tabla.rows.length;
        } else if (i === numCeldas - 1) { // Botón de acción
            celda.style.textAlign = 'center';
            celda.innerHTML = `
                <button type="button" class="btn btn-danger btn-sm" onclick="eliminarDelincuente(this)">
                    <i class="fas fa-trash"></i>
                </button>`;
        } else if (i === 9) { // Fecha de Captura
            celda.innerHTML = `<input type="date" class="form-control" value="${fecha}">`;
        } else if (i === 12) { // Cuantía
            celda.innerHTML = `<input type="number" class="form-control" min="0" step="0.01" placeholder="0.00">`;
        } else if (i === 3) { // Edad
            celda.innerHTML = `<input type="number" class="form-control" min="0" max="150">`;
        } else {
            celda.innerHTML = '<input type="text" class="form-control">';
        }
    }
}

function eliminarDelincuente(boton) {
    const fila = boton.closest('tr');
    const tabla = fila.closest('tbody');

    // Guardar datos en el historial antes de eliminar
    const delincuente = {
        numero: fila.cells[0].textContent,
        nombre: fila.cells[1].querySelector('input').value,
        cedula: fila.cells[2].querySelector('input').value,
        edad: fila.cells[3].querySelector('input').value,
        fechaCaptura: fila.cells[9].querySelector('input').value,
        delito: fila.cells[10].querySelector('input').value,
        cuantia: fila.cells[12].querySelector('input').value,
        denuncia: fila.cells[13].querySelector('input').value
    };

    guardarEnHistorial(delincuente);

    // Eliminar fila
    fila.remove();

    // Actualizar números
    const filas = tabla.getElementsByTagName('tr');
    for (let i = 0; i < filas.length; i++) {
        if (filas[i].id !== 'filaNoDelincuentes') {
            filas[i].cells[0].textContent = i + 1;
        }
    }

    // Mostrar mensaje si no hay delincuentes
    if (tabla.rows.length === 1) {
        document.getElementById('filaNoDelincuentes').style.display = '';
    }
}

// Función para abrir el modal de tipificación
function abrirModalTipificacion(boton) {
    const modal = document.getElementById('modalTipificacion');
    const primerElemento = modal.querySelector('.tipificacion-card');
    const cerrarBoton = modal.querySelector('.close');

    // Guardar el elemento que tenía el foco antes de abrir el modal
    const elementoAnterior = boton;

    // Mostrar el modal
    $(modal).modal('show');

    // Cuando el modal se muestre completamente
    $(modal).on('shown.bs.modal', function () {
        // Dar foco al primer elemento del modal
        if (primerElemento) {
            primerElemento.focus();
        }
    });

    // Cuando el modal se cierre
    $(modal).on('hidden.bs.modal', function () {
        // Devolver el foco al elemento anterior
        if (elementoAnterior) {
            elementoAnterior.focus();
        }
    });

    // Manejar el cierre con Escape
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            $(modal).modal('hide');
        }
    });
}

// --- Inicialización General ---
document.addEventListener('DOMContentLoaded', inicializarApp);

// --- Funciones Globales (si son llamadas desde HTML onclick) ---

// Ejemplo: si 'script_casos.js' no define estas globalmente
window.agregarFilaEditable = window.agregarFilaEditable || function(btn) {
    console.log("Agregar fila editable llamado...");
    const tbody = document.querySelector('#tablaCasosDelictivos tbody');
    const filaTotal = tbody.querySelector('.total-row');
    const placeholder = document.getElementById('placeholder-casos');
    const plantilla = tbody.querySelector('tr:not(.total-row):not(#placeholder-casos)');

    if (!plantilla) {
         console.error("No se encontró fila plantilla para clonar.");
         return; 
    }
    const nuevaFila = plantilla.cloneNode(true);

    // Limpiar valores
    nuevaFila.querySelectorAll('input, select').forEach(el => {
        if (el.tagName === 'SELECT') {
            // Reiniciar el select de tipificación
            el.selectedIndex = 0;
        } else if (el.type === 'number') {
            el.value = '0';
        } else if (el.type === 'text') {
            if (el.classList.contains('cuantia-input')) {
                el.value = '0.00';
            } else if (el.classList.contains('fecha-input')) {
                el.value = '';
                el.placeholder = 'DD/MM/AAAA';
            } else {
                el.value = '';
            }
        }
    });

    // Configurar botones de acción
    const tdAccion = nuevaFila.querySelector('td:last-child');
    tdAccion.innerHTML = `<div style="display: flex; justify-content: center; gap: 5px;">
        <button type="button" class="btn btn-success btn-sm" title="Agregar" onclick="agregarFilaEditable(this)">+</button>
        <button type="button" class="btn btn-danger btn-sm" title="Eliminar" onclick="eliminarFilaEditable(this)" style="display: inline-block !important; visibility: visible !important; background-color: #dc3545; color: white;">&times;</button>
    </div>`;

    // Insertar la nueva fila antes de la fila de totales
    if (filaTotal) {
        tbody.insertBefore(nuevaFila, filaTotal);
    } else {
        tbody.appendChild(nuevaFila);
    }

    // Ocultar el placeholder si existe
    if (placeholder) placeholder.style.display = 'none';

    // Obtener los valores de la fila anterior
    const filaAnterior = botonAgregar.closest('tr');
    const productoInput = filaAnterior.querySelector('.producto-input');
    const cantidadInput = filaAnterior.querySelector('.cantidad-input');
    const cuantiaInput = filaAnterior.querySelector('.cuantia-input');

    if (productoInput && cantidadInput && cuantiaInput) {
        const producto = productoInput.value.trim();
        const cantidad = parseInt(cantidadInput.value) || 0;
        const cuantia = parseFloat(cuantiaInput.value) || 0;

        if (producto && cantidad > 0) {
            // Actualizar el Top 20
            const productoExistente = productosTop20.find(p => p.nombre.toLowerCase() === producto.toLowerCase());

            if (productoExistente) {
                productoExistente.cantidad += cantidad;
                productoExistente.cuantia += cuantia;
            } else {
                productosTop20.push({
                    nombre: producto,
                    cantidad: cantidad,
                    cuantia: cuantia
                });
            }

            // Ordenar y limitar a 20 items
            productosTop20.sort((a, b) => b.cantidad - a.cantidad);
            productosTop20 = productosTop20.slice(0, 20);

            // Guardar en localStorage y actualizar la tabla
            localStorage.setItem('productosTop20', JSON.stringify(productosTop20));
            mostrarTop20();
        }
    }

    // Recalcular totales
    calcularTotalesCasos();
    actualizarReportePerdidas();
    console.log("Nueva fila agregada.");
};

window.eliminarFilaEditable = window.eliminarFilaEditable || function(btn) {
    console.log("Eliminar fila editable llamado...");
    const fila = btn.closest('tr');
    const tbody = fila.parentNode;
    const filasDatos = tbody.querySelectorAll('tr:not(.total-row):not(#placeholder-casos)');

    if (filasDatos.length > 1) {
        fila.remove();
        console.log("Fila eliminada.");
    } else {
        alert("Debe existir al menos una fila para registrar casos.");
        console.log("Intento de eliminar la última fila bloqueado.");
        return; // No eliminar la última fila
    }

    // Mostrar placeholder si ya no quedan filas
    asegurarFilaVaciaCasos(); 
    
    // Recalcular
    calcularTotalesCasos();
    actualizarReportePerdidas();
};

// Asegúrate que cerrarSesion esté global si el botón la llama
window.cerrarSesion = window.cerrarSesion || function() {
    sessionStorage.removeItem('usuarioActivo');
    window.location.href = 'login.html';
};

// Variables para almacenar el documento PDF generado
let pdfDocGenerado = null;

// Función para mostrar la vista previa del PDF
window.mostrarVistaPrevia = window.mostrarVistaPrevia || function() {
    // Primero, generar el PDF
    generarPDFPrincipal(true).then(doc => {
        if(doc) {
            // Guardar el documento generado para uso posterior
            pdfDocGenerado = doc;
            
            // Convertir el PDF a formato de datos URI para mostrarlo en un iframe
            const pdfDataUri = doc.output('datauristring');
            
            // Crear el modal si no existe
            if (!document.getElementById('vistaPreviaModal')) {
                const modalHTML = `
                <div id="vistaPreviaModal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.7);">
                    <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 20px; width: 80%; max-width: 900px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e9ecef; padding-bottom: 10px; margin-bottom: 15px;">
                            <h3 style="margin: 0;">Vista Previa del Documento</h3>
                            <span class="close" style="cursor: pointer; font-size: 28px;" onclick="document.getElementById('vistaPreviaModal').style.display='none'">&times;</span>
                        </div>
                        <div id="pdfViewer" style="width: 100%; height: 500px;"></div>
                        <div style="margin-top: 15px; text-align: right;">
                            <button onclick="imprimirDocumento()" class="btn btn-primary" style="margin-right: 10px; padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir</button>
                            <button onclick="guardarDocumentoLocal()" class="btn btn-success" style="padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Guardar PDF</button>
                        </div>
                    </div>
                </div>
                `;
                const div = document.createElement('div');
                div.innerHTML = modalHTML;
                document.body.appendChild(div.firstChild);
            }
            
            // Mostrar el PDF en el visor
            document.getElementById('pdfViewer').innerHTML = `<iframe src="${pdfDataUri}" width="100%" height="100%" style="border: none;"></iframe>`;
            
            // Mostrar el modal
            document.getElementById('vistaPreviaModal').style.display = 'block';
        }
    }).catch(error => {
        console.error("Error al generar vista previa:", error);
        alert("Error al generar la vista previa del documento. Por favor intente nuevamente.");
    });
};

// Función para imprimir el documento
window.imprimirDocumento = window.imprimirDocumento || function() {
    if (!pdfDocGenerado) {
        alert("No hay documento para imprimir. Por favor genere primero la vista previa.");
        return;
    }
    
    try {
        // Intentar imprimir usando el iframe del visor
        const iframe = document.querySelector('#pdfViewer iframe');
        if (iframe) {
            iframe.contentWindow.print();
        } else {
            // Alternativa: abrir en nueva ventana e imprimir
            const pdfDataUri = pdfDocGenerado.output('datauristring');
            const printWindow = window.open(pdfDataUri);
            if (printWindow) {
                printWindow.addEventListener('load', function() {
                    printWindow.print();
                }, true);
            } else {
                alert("No se pudo abrir la ventana de impresión. Por favor revise la configuración de su navegador.");
            }
        }
    } catch (error) {
        console.error("Error al imprimir:", error);
        alert("Hubo un problema al imprimir. Intente guardar el PDF y luego imprimirlo.");
    }
};

// Función para guardar el documento localmente
window.guardarDocumentoLocal = window.guardarDocumentoLocal || function() {
    if (!pdfDocGenerado) {
        alert("No hay documento para guardar. Por favor genere primero la vista previa.");
        return;
    }
    
    try {
        // Formatear fecha actual para el nombre del archivo
        const fecha = new Date();
        const fechaFormateada = fecha.toISOString().slice(0, 10).replace(/-/g, '');
        const nombreArchivo = `Reporte_Delitos_${fechaFormateada}.pdf`;
        
        // Guardar el documento PDF
        pdfDocGenerado.save(nombreArchivo);
        console.log('PDF guardado como:', nombreArchivo);
    } catch (error) {
        console.error("Error al guardar documento:", error);
        alert("Hubo un problema al guardar el PDF. Por favor intente nuevamente.");
    }
};

// ... (resto del código)
// window.eliminarProducto = window.eliminarProducto || function(index) { ... }
// window.actualizarProducto = window.actualizarProducto || function(index, campo, valor) { ... }

// --- Fin del Script ---