"use strict"; // Recomendado para evitar errores comunes

// --- Variables Globales (si son necesarias) ---
// Si script_delincuentes.js no define window.delincuentes, descomentar y adaptar:
// window.delincuentes = window.delincuentes || []; 
// Si script_productos.js no define window.productosRobados, descomentar y adaptar:
// window.productosRobados = window.productosRobados || []; 

// --- Funciones de Utilidad ---

function formatearFecha(fechaStr) {
    // Formato YYYY-MM-DD que viene del input date
    if (!fechaStr) return '';
    try {
        // Crear fecha asegurando que no haya problemas de zona horaria (interpretando como UTC para evitar cambios de día)
        const parts = fechaStr.split('-');
        if (parts.length === 3) {
            const fecha = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            const opciones = { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' };
            return fecha.toLocaleDateString('es-PA', opciones); // Usar 'es-PA' para formato panameño DD/MM/YYYY
        }
        return fechaStr; // Devolver original si el formato no es esperado
    } catch (e) {
        console.error("Error formateando fecha:", fechaStr, e);
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

// --- Funciones de Cálculo ---

function calcularTotalesCasos() {
    console.log("Calculando totales de la tabla de casos...");
    let totalCasos = 0;
    let totalCuantia = 0;
    let totalDenuncias = 0;

    const filasCasos = document.querySelectorAll('#tablaCasosDelictivos tbody tr:not(.total-row):not(#placeholder-casos)');

    filasCasos.forEach(fila => {
        const cantidadInput = fila.querySelector('.cantidad-input'); // Clase añadida al input de cantidad
        const cuantiaInput = fila.querySelector('.cuantia-input');   // Clase añadida al input de cuantía
        const denunciasInput = fila.querySelector('.denuncias-input'); // Clase añadida al input de denuncias

        // Procesar cantidad (asegurar que sea un número entero válido)
        let cantidad = 0;
        try {
            if (cantidadInput && cantidadInput.value) {
                cantidad = parseInt(cantidadInput.value) || 0;
                // Verificar que sea un número válido
                if (isNaN(cantidad) || !isFinite(cantidad)) cantidad = 0;
                // Asegurar que sea positivo
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
                // Verificar que sea un número válido
                if (isNaN(denuncias) || !isFinite(denuncias)) denuncias = 0;
                // Asegurar que sea positivo
                denuncias = Math.max(0, denuncias);
            }
        } catch (e) {
            console.error('Error al procesar denuncias:', denunciasInput?.value, e);
        }
        
        // Procesar cuantía (asegurar que sea un número decimal válido)
        let cuantia = 0;
        try {
            if (cuantiaInput && cuantiaInput.value) {
                // Eliminar cualquier caracter que no sea dígito, punto o signo negativo
                const cuantiaTexto = cuantiaInput.value.replace(/[^\d.-]/g, '');
                cuantia = parseFloat(cuantiaTexto) || 0;
                // Verificar que sea un número válido
                if (isNaN(cuantia) || !isFinite(cuantia)) cuantia = 0;
                // Asegurar que sea positivo y redondear a 2 decimales
                cuantia = Math.max(0, Math.round(cuantia * 100) / 100);
            }
        } catch (e) {
            console.error('Error al procesar cuantía:', cuantiaInput?.value, e);
        }
        
        // Acumular totales con valores seguros
        totalCasos += cantidad;
        totalDenuncias += denuncias;
        totalCuantia += cuantia;
    });

    const totalCasosElement = document.getElementById('totalCasos');     // ID ajustado en HTML
    const totalCuantiaElement = document.getElementById('totalCuantia');   // ID existe
    const totalDenunciasElement = document.getElementById('totalDenuncias'); // ID existe

    if (totalCasosElement) totalCasosElement.textContent = totalCasos;
    if (totalCuantiaElement) totalCuantiaElement.textContent = 'B/. ' + formatearNumeroConComas(totalCuantia); // Aplicar formato
    if (totalDenunciasElement) totalDenunciasElement.textContent = totalDenuncias;

    console.log("Totales calculados:", { totalCasos, totalCuantia, totalDenuncias });
}

// --- Funciones de Manipulación del DOM y Eventos ---

function inicializarApp() {
    console.log("Inicializando aplicación...");
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

    // Inicializar gráfico (si Chart.js está cargado y existe el canvas)
    if (typeof inicializarGraficos === 'function') {
        inicializarGraficos();
    } else {
        console.log('La función inicializarGraficos no está definida');
    }

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

// --- Función para actualizar la tabla de delincuentes y dejar siempre la fila de inputs ---
function actualizarTablaDelincuentes() {
    const tbody = document.querySelector('#tablaDelincuentesSimple tbody');
    tbody.innerHTML = '';
    if (!window.delincuentes) window.delincuentes = [];
    window.delincuentes.forEach((delincuente, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="text" class="form-control" value="${delincuente.nombreCompleto || ''}" onchange="actualizarDelincuente(${index}, 'nombreCompleto', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.cedula || ''}" onchange="actualizarDelincuente(${index}, 'cedula', this.value)"></td>
            <td><input type="number" class="form-control" value="${delincuente.edad || ''}" onchange="actualizarDelincuente(${index}, 'edad', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.direccion || ''}" onchange="actualizarDelincuente(${index}, 'direccion', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.vehiculo || ''}" onchange="actualizarDelincuente(${index}, 'vehiculo', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.placa || ''}" onchange="actualizarDelincuente(${index}, 'placa', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.color || ''}" onchange="actualizarDelincuente(${index}, 'color', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.lugar || ''}" onchange="actualizarDelincuente(${index}, 'lugar', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.fecha || ''}" onchange="actualizarDelincuente(${index}, 'fecha', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.delito || ''}" onchange="actualizarDelincuente(${index}, 'delito', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.productos || ''}" onchange="actualizarDelincuente(${index}, 'productos', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.cuantia || ''}" onchange="actualizarDelincuente(${index}, 'cuantia', this.value)"></td>
            <td><input type="text" class="form-control" value="${delincuente.denuncia || ''}" onchange="actualizarDelincuente(${index}, 'denuncia', this.value)"></td>
            <td style="text-align: center;">
                <button type="button" class="btn btn-danger btn-sm" onclick="eliminarDelincuente(${index})">X</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
    // Fila de inputs vacía al final
    const filaNueva = document.createElement('tr');
    filaNueva.innerHTML = `
        <td></td>
        <td><input type="text" class="form-control" id="nuevoNombreCompleto" placeholder="Nombre y Apellido"></td>
        <td><input type="text" class="form-control" id="nuevoCedula" placeholder="Cédula"></td>
        <td><input type="number" class="form-control" id="nuevoEdad" placeholder="Edad"></td>
        <td><input type="text" class="form-control" id="nuevoDireccion" placeholder="Dirección"></td>
        <td><input type="text" class="form-control" id="nuevoVehiculo" placeholder="Vehículo"></td>
        <td><input type="text" class="form-control" id="nuevoPlaca" placeholder="Placa"></td>
        <td><input type="text" class="form-control" id="nuevoColor" placeholder="Color"></td>
        <td><input type="text" class="form-control" id="nuevoLugar" placeholder="Lugar"></td>
        <td><input type="text" class="form-control" id="nuevoFecha" placeholder="Fecha de Captura"></td>
        <td><input type="text" class="form-control" id="nuevoDelito" placeholder="Delito"></td>
        <td><input type="text" class="form-control" id="nuevoProductos" placeholder="Productos"></td>
        <td><input type="text" class="form-control" id="nuevoCuantia" placeholder="Cuantía"></td>
        <td><input type="text" class="form-control" id="nuevoDenuncia" placeholder="N° Denuncia/Resolución"></td>
        <td style="text-align: center;">
            <button type="button" class="btn btn-success btn-sm" title="Agregar" onclick="agregarDelincuenteDesdeTabla()">+</button>
        </td>
    `;
    tbody.appendChild(filaNueva);
}

// --- Función para agregar delincuente desde la fila de inputs al final de la tabla ---
function agregarDelincuenteDesdeTabla() {
    const nombreCompleto = document.getElementById('nuevoNombreCompleto').value;
    const cedula = document.getElementById('nuevoCedula').value;
    const edad = document.getElementById('nuevoEdad').value;
    const direccion = document.getElementById('nuevoDireccion').value;
    const vehiculo = document.getElementById('nuevoVehiculo').value;
    const placa = document.getElementById('nuevoPlaca').value;
    const color = document.getElementById('nuevoColor').value;
    const lugar = document.getElementById('nuevoLugar').value;
    const fecha = document.getElementById('nuevoFecha').value;
    const delito = document.getElementById('nuevoDelito').value;
    const productos = document.getElementById('nuevoProductos').value;
    const cuantia = document.getElementById('nuevoCuantia').value;
    const denuncia = document.getElementById('nuevoDenuncia').value;
    if (!window.delincuentes) window.delincuentes = [];
    window.delincuentes.push({
        nombreCompleto,
        cedula,
        edad,
        direccion,
        vehiculo,
        placa,
        color,
        lugar,
        fecha,
        delito,
        productos,
        cuantia,
        denuncia
    });
    if (typeof actualizarTablaDelincuentes === 'function') {
        actualizarTablaDelincuentes();
    }
}

// --- Función para agregar una fila vacía de delincuente ---
function agregarFilaDelincuente() {
    if (!window.delincuentes) window.delincuentes = [];
    window.delincuentes.push({
        nombreCompleto: '',
        cedula: '',
        edad: '',
        direccion: '',
        vehiculo: '',
        placa: '',
        color: '',
        lugar: '',
        fecha: '',
        delito: '',
        productos: '',
        cuantia: '',
        denuncia: ''
    });
    if (typeof actualizarTablaDelincuentes === 'function') {
        actualizarTablaDelincuentes();
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

// Función para reiniciar el formulario principal sin afectar las tablas perpetuas
function reiniciarFormulario() {
    console.log('Ejecutando reiniciarFormulario()...');
    
    // Limpiar campos de texto y selects
    document.getElementById('empresa').value = '';
    document.getElementById('responsable').value = '';
    document.getElementById('cedula').value = '';
    document.getElementById('fecha').value = '';
    
    // Reiniciar selects de trimestre
    const selectMes = document.getElementById('mes');
    if (selectMes) selectMes.selectedIndex = 0;
    
    const selectTrimestre = document.getElementById('trimestre');
    if (selectTrimestre) selectTrimestre.selectedIndex = 0;
    
    // Limpiar tabla de casos delictivos
    const tablaCasos = document.getElementById('tablaCasosDelictivos');
    if (tablaCasos) {
        const tbody = tablaCasos.querySelector('tbody');
        if (tbody) {
            // Mantener solo la primera fila y limpiarla
            while (tbody.children.length > 1) {
                tbody.removeChild(tbody.lastChild);
            }
            
            if (tbody.children.length === 1) {
                const primeraFila = tbody.children[0];
                const selects = primeraFila.querySelectorAll('select');
                selects.forEach(select => select.selectedIndex = 0);
                
                const inputs = primeraFila.querySelectorAll('input, textarea');
                inputs.forEach(input => input.value = '');
            }
        }
    }
    
    // Reiniciar totales
    const totalCasos = document.getElementById('totalCasos');
    if (totalCasos) totalCasos.textContent = '0';
    
    const totalCuantia = document.getElementById('totalCuantia');
    if (totalCuantia) totalCuantia.textContent = 'B/. 0.00';
    
    const totalDenuncias = document.getElementById('totalDenuncias');
    if (totalDenuncias) totalDenuncias.textContent = '0';
    
    // Limpiar tabla de pérdidas si existe
    if (typeof actualizarTablaPerdidas === 'function') {
        actualizarTablaPerdidas();
    }
    
    // Eliminar datos temporales del localStorage (excepto tablas perpetuas)
    localStorage.removeItem('casosTemporal');
    localStorage.removeItem('formularioTemporal');
    
    // Nota: NO eliminamos 'delincuentesPersistentes' ni 'productosRobados'
    // ya que son tablas perpetuas que deben mantenerse
    
    console.log('Formulario reiniciado correctamente');
}

// Función principal para iniciar la generación del PDF
async function generarPDFPrincipal() {
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
    
    // 3. Asegurarse de que jsPDF está cargado
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
        alert('Error: La biblioteca jsPDF no está disponible.');
        return;
    }
    
    // Obtener el constructor de jsPDF
    const { jsPDF } = jspdf;
    
    // Crear una instancia de jsPDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Verificar si autoTable está disponible
    if (typeof doc.autoTable !== 'function') {
        console.error('AutoTable no está disponible en el objeto jsPDF');
        
        // Intentar cargar AutoTable manualmente si no está disponible
        if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined') {
            console.log('Intentando cargar AutoTable manualmente...');
            
            // Cargar el script de AutoTable dinámicamente
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
            script.onload = function() {
                console.log('AutoTable cargado manualmente');
                // Intentar generar el PDF nuevamente
                setTimeout(generarPDFPrincipal, 500);
            };
            script.onerror = function() {
                alert('Error: No se pudo cargar el plugin jsPDF-AutoTable.');
            };
            document.head.appendChild(script);
        } else {
            alert('Error: El plugin jsPDF-AutoTable no está disponible.');
        }
        return;
    }

    try {
        // Crear nombre de archivo
        const trimestreTexto = obtenerTextoTrimestre().replace(/\s+/g, '_');
        const fechaTexto = document.getElementById('fecha').value.replace(/\//g, '-');
        const nombreArchivo = `Reporte_${empresa.replace(/\s+/g, '_')}_${trimestreTexto}_${fechaTexto}.pdf`;

        // Ya tenemos la instancia del PDF creada anteriormente

        // --- Contenido del PDF ---
        const azulOscuro = [30, 50, 70];
        const grisClaro = [240, 240, 240];
        doc.setFont('helvetica');
        let finalY = 15; // Posición Y inicial

        // Título principal
        doc.setFontSize(18);
        doc.setTextColor(...azulOscuro);
        doc.text('REGISTRO DE ACTIVIDAD CRIMINAL', 105, finalY, { align: 'center' });
        finalY += 12;

        // Información General sin rectángulo de fondo
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        // Empresa y fecha en la misma línea
        doc.text('Empresa: ' + empresa, 20, finalY);
        doc.text('Fecha: ' + document.getElementById('fecha').value, 120, finalY);
        finalY += 7;
        
        // Trimestre
        doc.text('Trimestre: ' + obtenerTextoTrimestre(), 20, finalY);
        finalY += 7;
        
        // Responsable y cédula
        doc.text('Responsable de Seguridad: ' + responsable, 20, finalY);
        doc.text('Cédula: ' + cedula, 120, finalY);
        finalY += 15;
        
        // Ya no necesitamos la tabla para la información general
        // porque la hemos formateado directamente con doc.text

        // Sección Casos Delictivos
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('CASOS DELICTIVOS OCURRIDOS EN EL TRIMESTRE', 105, finalY, { align: 'center' });
        finalY += 8;

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
        finalY = doc.lastAutoTable.finalY + 20; // Aumentar el espacio entre tablas a 20mm

        // Sección Reporte de Pérdidas
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('REPORTE DE PÉRDIDAS TRIMESTRALES', 105, finalY, { align: 'center' });
        finalY += 8;

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

        // Se ha eliminado la sección TOP 20 PRODUCTOS Y MERCANCÍAS ROBADAS por solicitud del usuario

        // Pie de página en la primera página
        doc.setPage(1); // Volver a la primera página
        const fechaGeneracion = new Date();
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Documento generado el ${formatearFechaHora(fechaGeneracion)}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });

        // Se ha eliminado la sección de Delincuentes Capturados por solicitud del usuario
        // generarTablaDelincuentesPDF(doc); // Comentado para no incluir esta sección

        // --- Fin Contenido PDF ---

        // 4. Mostrar o guardar el PDF
        try {
            // Intentar abrir en una nueva ventana
            doc.output('dataurlnewwindow'); // Abrir en nueva pestaña
            
            // Alternativa: Descargar directamente
            // doc.save(nombreArchivo);
            
            // Mostrar mensaje de éxito antes de recargar
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Documento PDF generado correctamente. Recargando página...', 'success');
            }
            
            // Esperar 2 segundos y luego recargar la página completamente (como F5)
            setTimeout(function() {
                console.log('Recargando página para nuevo formulario...');
                location.reload(true); // true fuerza recarga desde el servidor, no desde caché
            }, 2000);
            
            return; // Salir de la función para evitar ejecutar el código de reinicio manual
            
        } catch (error) {
            console.error('Error al mostrar el PDF:', error);
            alert('Error al mostrar el PDF. Intente nuevamente.');
        }
        
        // 5. Este código solo se ejecutará si hay un error y no se recarga la página
        // Reiniciar el formulario principal manteniendo las tablas perpetuas como respaldo
        setTimeout(function() {
            console.log('Reiniciando formulario principal...');
            
            try {
                // Guardar datos de tablas perpetuas
                const delincuentesPersistentes = localStorage.getItem('delincuentesPersistentes');
                const productosRobados = localStorage.getItem('productosRobados');
                
                // Limpiar el formulario principal
                document.getElementById('empresa').value = '';
                document.getElementById('responsable').value = '';
                document.getElementById('cedula').value = '';
                document.getElementById('fecha').value = '';
                
                // Reiniciar selects de trimestre
                const selectMes = document.getElementById('mes');
                if (selectMes) selectMes.selectedIndex = 0;
                
                const selectTrimestre = document.getElementById('trimestre');
                if (selectTrimestre) selectTrimestre.selectedIndex = 0;
                
                // Limpiar tabla de casos delictivos
                const tablaCasos = document.getElementById('tablaCasosDelictivos');
                if (tablaCasos) {
                    const tbody = tablaCasos.querySelector('tbody');
                    if (tbody) {
                        // Mantener solo la primera fila y limpiarla
                        while (tbody.children.length > 1) {
                            tbody.removeChild(tbody.lastChild);
                        }
                        
                        if (tbody.children.length === 1) {
                            const primeraFila = tbody.children[0];
                            const selects = primeraFila.querySelectorAll('select');
                            selects.forEach(select => select.selectedIndex = 0);
                            
                            const inputs = primeraFila.querySelectorAll('input, textarea');
                            inputs.forEach(input => input.value = '');
                        }
                    }
                }
                
                // Reiniciar totales
                const totalCasos = document.getElementById('totalCasos');
                if (totalCasos) totalCasos.textContent = '0';
                
                const totalCuantia = document.getElementById('totalCuantia');
                if (totalCuantia) totalCuantia.textContent = 'B/. 0.00';
                
                const totalDenuncias = document.getElementById('totalDenuncias');
                if (totalDenuncias) totalDenuncias.textContent = '0';
                
                // Limpiar tabla de pérdidas si existe
                if (typeof actualizarTablaPerdidas === 'function') {
                    actualizarTablaPerdidas();
                }
                
                // Eliminar datos temporales del localStorage (excepto tablas perpetuas)
                localStorage.removeItem('casosTemporal');
                localStorage.removeItem('formularioTemporal');
                
                // Restaurar tablas perpetuas
                if (typeof renderizarTablaHistorialDelincuentes === 'function') {
                    renderizarTablaHistorialDelincuentes();
                }
                
                if (typeof actualizarTablaProductos === 'function') {
                    actualizarTablaProductos();
                }
                
                // Limpiar la tabla de delincuentes capturados
                const tablaDelincuentes = document.getElementById('tbodyDelincuentesSimple');
                if (tablaDelincuentes) {
                    tablaDelincuentes.innerHTML = '';
                    // Agregar mensaje de no hay delincuentes registrados con botón para agregar
                    const fila = document.createElement('tr');
                    fila.innerHTML = '<td colspan="15" style="text-align: center; color: #888;">No hay delincuentes registrados <button type="button" class="btn btn-success btn-sm" title="Agregar Delincuente" onclick="abrirModalNuevoDelincuente()" style="font-size:16px;min-width:32px;margin-left:10px;">+</button></td>';
                    tablaDelincuentes.appendChild(fila);
                }
                
                // Limpiar los datos de delincuentes en memoria
                if (typeof window.delincuentes !== 'undefined') {
                    window.delincuentes = [];
                }
                
                // Limpiar localStorage de delincuentes temporales
                localStorage.removeItem('delincuentes');
                
                // Limpiar tabla de pérdidas trimestrales
                const tablaPerdidas = document.getElementById('tablaPerdidas');
                if (tablaPerdidas) {
                    const tbody = tablaPerdidas.querySelector('tbody');
                    if (tbody) {
                        // Mantener la estructura pero reiniciar los valores
                        const filas = tbody.querySelectorAll('tr');
                        filas.forEach(fila => {
                            const celdas = fila.querySelectorAll('td');
                            if (celdas.length >= 3) {
                                // Mantener el nombre del mes en la primera celda
                                // Reiniciar casos y pérdidas
                                if (celdas[1]) celdas[1].textContent = '0';
                                if (celdas[2]) celdas[2].textContent = 'B/. 0.00';
                                if (celdas[3]) celdas[3].textContent = '-';
                            }
                        });
                    }
                }
                
                // Asegurarse de que las tablas perpetuas se mantengan
                if (delincuentesPersistentes) {
                    localStorage.setItem('delincuentesPersistentes', delincuentesPersistentes);
                }
                
                if (productosRobados) {
                    localStorage.setItem('productosRobados', productosRobados);
                }
                
                console.log('Formulario reiniciado correctamente y tablas perpetuas mantenidas');
            } catch (error) {
                console.error('Error al reiniciar el formulario:', error);
            }
            
            // Mostrar mensaje de confirmación
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Documento guardado y formulario reiniciado correctamente.', 'success');
            }
        }, 1000); // Esperar 1 segundo para que el usuario pueda ver el PDF

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

function obtenerDatosDelincuentesParaPDF() {
    const datos = [];
    datos.push(['Nombre y Apellido', 'Cédula', 'Edad', 'Dirección', 'Vehículo', 'Placa', 'Color', 'Lugar', 'Fecha Captura', 'Delito', 'Productos', 'Cuantía (B/.)', 'N° Denuncia']);
    
    // Asumiendo que window.delincuentes es llenado por script_delincuentes.js
    if (window.delincuentes && Array.isArray(window.delincuentes)) {
        window.delincuentes.forEach(d => {
            // Añadir solo si el objeto tiene datos (o adaptar según estructura de script_delincuentes.js)
            if (d.nombreCompleto || d.cedula) { 
                 datos.push([
                     d.nombreCompleto || '', d.cedula || '', d.edad || '', d.direccion || '',
                     d.vehiculo || '', d.placa || '', d.colorVehiculo || '', d.lugar || '',
                     formatearFecha(d.fecha) || '', // Asume que d.fecha es YYYY-MM-DD
                     d.delito || '', d.mercancias || '', 
                     d.monto ? d.monto.replace('B/. ', '') : '', // Limpiar formato si existe
                     d.denuncia || ''
                 ]);
            }
        });
    } 
    // Si no hay delincuentes o el array está vacío, la tabla solo tendrá la cabecera.
    // Se podría añadir una fila indicando "No hay datos" si se prefiere.
     if (datos.length === 1) { // Solo cabecera
         datos.push(['','','','','No hay datos registrados','','','','','','','','']);
     }
    return datos;
}

function generarTablaDelincuentesPDF(doc) { // doc es la instancia de jsPDF
    try {
        const datosDelincuentes = obtenerDatosDelincuentesParaPDF();
        
        // Añadir nueva página horizontal
        doc.addPage('a4', 'landscape');
        let finalY = 15; // Y inicial en la nueva página

        // Título
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('DELINCUENTES CAPTURADOS', 148.5, finalY, { align: 'center' });
        finalY += 8;

        if (datosDelincuentes.length <= 1) {
            doc.setFontSize(10);
            doc.text('No hay delincuentes registrados.', 148.5, finalY + 10, { align: 'center' });
        } else {
            doc.autoTable({
                startY: finalY,
                head: [datosDelincuentes[0]],
                body: datosDelincuentes.slice(1),
                theme: 'grid',
                headStyles: { /* ... estilos ... */ fontSize: 7 },
                styles: { /* ... estilos ... */ fontSize: 6.5, cellPadding: 1, overflow: 'linebreak' },
                columnStyles: { /* ... definir anchos para landscape ... */ },
                margin: { left: 15, right: 15 },
                tableWidth: 267 // Ancho para landscape
            });
        }

         // Pie de página en esta página horizontal
         const fechaGeneracion = new Date();
         doc.setFontSize(8);
         doc.setTextColor(100, 100, 100);
         // Posición Y ajustada para landscape (menor altura)
         doc.text(`Documento generado el ${formatearFechaHora(fechaGeneracion)}`, 148.5, doc.internal.pageSize.height - 10, { align: 'center' }); 

    } catch (error) {
        console.error('Error al generar tabla de delincuentes:', error);
        // Opcional: Añadir texto de error en el PDF
        doc.text('Error al generar la tabla de delincuentes.', 20, 40);
    }
     // Volver a portrait para continuar si fuera necesario (o si esta es la última página)
     // doc.setPage(doc.internal.getNumberOfPages()); // Asegurarse de estar en la última página
     // Considerar si necesitas volver a portrait: doc.addPage('a4', 'portrait');
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
    // Clonar la PRIMERA fila de datos como plantilla (si existe)
    const plantilla = tbody.querySelector('tr:not(.total-row):not(#placeholder-casos)');
    if (!plantilla) {
         console.error("No se encontró fila plantilla para clonar.");
         return; 
    }
    const nuevaFila = plantilla.cloneNode(true);

    // Limpiar valores
    nuevaFila.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else if (el.type === 'date') el.value = '';
        else if (el.type === 'number') el.value = '0';
        else if (el.type === 'text' && el.classList.contains('cuantia-input')) el.value = '0.00';
        else if (el.type === 'text') {
            // Mantener el ancho original del campo de texto
            const originalWidth = el.style.width;
            el.value = '';
            // Asegurar que el campo mantenga su ancho después de limpiarlo
            if (originalWidth) el.style.width = originalWidth;
            // Establecer un ancho mínimo para el campo de producto
            if (el.name === 'producto[]') {
                el.style.minWidth = '150px';
                el.style.width = '100%';
                el.style.boxSizing = 'border-box';
            }
            // Asegurar que el campo de fecha tenga el placeholder correcto
            if (el.classList.contains('fecha-input')) {
                el.placeholder = 'DD/MM/AAAA';
                // Inicializar el formateo de fechas
                if (!el.dataset.formateoInicializado) {
                    el.dataset.formateoInicializado = 'true';
                    
                    // Agregar evento input para formatear mientras el usuario escribe
                    el.addEventListener('input', function(e) {
                        const valor = e.target.value.replace(/[^\d]/g, ''); // Eliminar todo excepto dígitos
                        
                        if (valor.length >= 8) {
                            // Si hay al menos 8 dígitos, formatear como DD/MM/AAAA
                            const dia = valor.substring(0, 2);
                            const mes = valor.substring(2, 4);
                            const anio = valor.substring(4, 8);
                            
                            // Validar día y mes
                            const diaNum = parseInt(dia, 10);
                            const mesNum = parseInt(mes, 10);
                            
                            if (diaNum > 0 && diaNum <= 31 && mesNum > 0 && mesNum <= 12) {
                                e.target.value = `${dia}/${mes}/${anio}`;
                            }
                        }
                    });
                    
                    // Agregar evento blur para formatear cuando el campo pierde el foco
                    el.addEventListener('blur', function(e) {
                        const valor = e.target.value.replace(/[^\d]/g, ''); // Eliminar todo excepto dígitos
                        
                        if (valor.length >= 8) {
                            // Si hay al menos 8 dígitos, formatear como DD/MM/AAAA
                            const dia = valor.substring(0, 2);
                            const mes = valor.substring(2, 4);
                            const anio = valor.substring(4, 8);
                            
                            // Validar día y mes
                            const diaNum = parseInt(dia, 10);
                            const mesNum = parseInt(mes, 10);
                            
                            if (diaNum > 0 && diaNum <= 31 && mesNum > 0 && mesNum <= 12) {
                                e.target.value = `${dia}/${mes}/${anio}`;
                            }
                        }
                    });
                }
            }
        }
        else if (el.tagName === 'TEXTAREA') el.value = '';
    });

    // Configurar botones de acción
    const tdAccion = nuevaFila.querySelector('td:last-child');
    tdAccion.innerHTML = `<div style="display: flex; justify-content: center; gap: 5px;">
                            <button type="button" class="btn btn-success btn-sm" title="Agregar" onclick="agregarFilaEditable(this)">+</button>
                            <button type="button" class="btn btn-danger btn-sm" title="Eliminar" onclick="eliminarFilaEditable(this)" style="display: inline-block !important; visibility: visible !important; background-color: #dc3545; color: white;">&times;</button>
                          </div>`; // Mejorado estilo y visibilidad

    tbody.insertBefore(nuevaFila, filaTotal);
    if (placeholder) placeholder.style.display = 'none'; // Ocultar placeholder

    // Recalcular
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

// Función global para abrir el modal de delincuente
function abrirModalDelincuenteSimple() {
    var modal = document.getElementById('delincuenteModal');
    if (modal) {
        modal.style.display = 'block';
    }
}
// Nota: El resto del sistema debe usar abrirModalDelincuente (la versión avanzada) para evitar conflictos.

// Funciones para el modal de vista previa (si aún se usan)
window.mostrarVistaPrevia = window.mostrarVistaPrevia || function() {
    // Esta función debería ahora probablemente llamar a generarPDFPrincipal()
    // o generar el PDF y mostrarlo en el modal #pdfViewer
    console.warn("Función mostrarVistaPrevia() llamada, pero podría estar obsoleta. Considera llamar a generarPDFPrincipal().");
     // Ejemplo de cómo podría mostrar en el modal:
     /*
     generarPDFPrincipal().then(doc => { // Asumiendo que generarPDFPrincipal devuelve el doc
         if(doc) {
             const pdfDataUri = doc.output('datauristring');
             document.getElementById('pdfViewer').innerHTML = `<iframe src="${pdfDataUri}" width="100%" height="100%"></iframe>`;
             $('#vistaPreviaModal').modal('show'); // Asumiendo que usas jQuery para Bootstrap modal
         }
     }).catch(error => {
         console.error("Error al generar vista previa:", error);
     });
     */
     // Por ahora, llamaremos a la función principal de generación/guardado
     generarPDFPrincipal();
};

window.imprimirDocumento = window.imprimirDocumento || function() {
    // Necesita obtener el PDF de la vista previa (si existe) o regenerarlo
    console.warn("Función imprimirDocumento() no implementada completamente en este ejemplo.");
    // const iframe = document.querySelector('#pdfViewer iframe');
    // if (iframe) {
    //     iframe.contentWindow.print();
    // }
};

window.guardarDocumentoLocal = window.guardarDocumentoLocal || function() {
     // Necesita obtener el PDF de la vista previa (si existe) o regenerarlo y guardarlo localmente
     console.warn("Función guardarDocumentoLocal() no implementada completamente en este ejemplo.");
     // Ejemplo de regenerar y guardar:
     /*
     generarPDFPrincipal().then(doc => { // Asumiendo que devuelve el doc
         if(doc) {
            const nombreArchivo = `Reporte_Local_${new Date().toISOString().slice(0,10)}.pdf`;
            doc.save(nombreArchivo);
         }
     }).catch(error => {
        console.error("Error al guardar localmente:", error);
     });
     */
};

// Funciones de productos (si el HTML tuviera los elementos)
// window.agregarProducto = window.agregarProducto || function() { ... }
// window.eliminarProducto = window.eliminarProducto || function(index) { ... }
// window.actualizarProducto = window.actualizarProducto || function(index, campo, valor) { ... }

// --- Fin del Script ---