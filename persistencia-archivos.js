/*
  Persistencia portable a Excel (XLSX) y/o archivo local usando File System Access API.
  Expone funciones globales:
   - exportarDatosExcel()
   - importarDesdeExcel(file?)
   - seleccionarYExportarExcel()

  Lee datos desde:
   - window.delincuentes / localStorage['delincuentes'] / localStorage['delincuentesPersistentes']
   - window.productosRobados / localStorage['productosRobados']
   - Tablas del DOM: #tablaCasosDelictivos y #tablaPerdidas

  Escribe datos hacia:
   - localStorage y variables globales cuando se importa
   - permite descarga directa .xlsx o guardado con File System Access
*/
(function () {
  const hasFS = !!(window.showSaveFilePicker && window.FileSystemWritableFileStream);
  // Bandera global para evitar prompts del sistema y usar descarga directa siempre
  if (typeof window.FORZAR_DESCARGA_EXCEL === 'undefined') {
    window.FORZAR_DESCARGA_EXCEL = true;
  }

  // --- Logger simple para modal de auditoría ---
  // Cargar logs previos desde localStorage para que viajen entre sesiones
  const _LOGS_KEY = 'logsAuditoria';
  function _cargarLogsPrevios() {
    try {
      const arr = JSON.parse(localStorage.getItem(_LOGS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  const _logs = _cargarLogsPrevios();
  function _ts() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2,'0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function _guardarLogs() {
    try {
      // Limitar tamaño a 5000 entradas para evitar crecimiento sin control
      const MAX = 5000;
      if (_logs.length > MAX) _logs.splice(0, _logs.length - MAX);
      localStorage.setItem(_LOGS_KEY, JSON.stringify(_logs));
    } catch {}
  }
  function log(msg) {
    try {
      const line = `[${_ts()}] ${msg}`;
      _logs.push(line);
      console.log(line);
      _guardarLogs();
    } catch {}
  }
  function getLogs() { return _logs.slice(); }
  function clearLogs() {
    _logs.length = 0;
    try { localStorage.setItem(_LOGS_KEY, JSON.stringify(_logs)); } catch {}
  }
  window.getLogsPersist = getLogs;
  window.clearLogsPersist = clearLogs;

  // Acción pública para borrar logs desde la UI (modal propietario o fallback)
  window.borrarLogsAuditoria = function() {
    try {
      const ok = (typeof window.confirm === 'function')
        ? window.confirm('¿Está seguro de borrar todos los logs de auditoría? Esta acción no se puede deshacer.')
        : true;
      if (!ok) return;
      clearLogs();
      if (typeof window.abrirModalLogs === 'function') {
        window.abrirModalLogs('');
      } else {
        const pre = document.getElementById('logsContenido');
        if (pre) pre.textContent = '';
      }
      if (typeof window.mostrarNotificacion === 'function') window.mostrarNotificacion('Logs borrados', 'success');
    } catch (e) { console.warn('Error al borrar logs:', e); }
  };

  // --- Snapshots en localStorage para exportación confiable ---
  function snapshotEncabezadoToStorage() {
    try {
      const data = {
        Empresa: document.getElementById('empresa')?.value || '',
        Fecha: document.getElementById('fecha')?.value || '',
        Responsable: document.getElementById('responsable')?.value || '',
        Trimestre: document.getElementById('trimestre')?.value || '',
        Cedula: document.getElementById('cedula')?.value || ''
      };
      localStorage.setItem('encabezadoFormulario', JSON.stringify(data));
      return data;
    } catch { return {}; }
  }

  function readEncabezadoSnapshot() {
    try {
      return JSON.parse(localStorage.getItem('encabezadoFormulario') || '{}') || {};
    } catch { return {}; }
  }

  function toJSONCasosDesdeDOM() {
    const casos = [];
    const tbody = document.querySelector('#tablaCasosDelictivos tbody');
    if (!tbody) return casos;
    const rows = Array.from(tbody.querySelectorAll('tr'))
      .filter(tr => !tr.classList.contains('total-row') && tr.id !== 'placeholder-casos');
    for (const tr of rows) {
      const tds = tr.querySelectorAll('td');
      // Estructura esperada: 0 Tipificación,1 Fecha,2 Cantidad,3 Cuantía,4 Denuncias,5 Producto,6 Tipo,7 Observaciones,8 Acción
      if (tds.length < 9) continue;
      const tipificacion = tr.querySelector('.tipificacion-input')?.value || tds[0].innerText.trim();
      const fecha = tr.querySelector('.fecha-input')?.value
                  || tr.querySelector("input[name='fecha[]']")?.value
                  || tds[1].querySelector('input')?.value
                  || tds[1].innerText.trim();
      const cantidad = tr.querySelector('.cantidad-input')?.value
                     || tr.querySelector("input[name='cantidad[]']")?.value
                     || tds[2].querySelector('input')?.value
                     || tds[2].innerText.trim();
      const cuantia = tr.querySelector('.cuantia-input')?.value
                    || tr.querySelector("input[name='cuantia[]']")?.value
                    || tds[3].querySelector('input')?.value
                    || tds[3].innerText.trim();
      const denuncias = tr.querySelector('.denuncias-input')?.value
                      || tr.querySelector("input[name='denuncias[]']")?.value
                      || tds[4].querySelector('input')?.value
                      || tds[4].innerText.trim();
      const producto = tr.querySelector('.producto-input')?.value
                      || tr.querySelector("input[name='producto[]']")?.value
                      || tds[5].querySelector('input')?.value
                      || tds[5].innerText.trim();
      const tipoProducto = tr.querySelector('.tipo-producto-input')?.value
                          || tr.querySelector("input[name='tipoProducto[]']")?.value
                          || tds[6].querySelector('input')?.value
                          || tds[6].innerText.trim();
      const observaciones = tr.querySelector("input[name='observaciones[]']")?.value
                          || tds[7].querySelector('input')?.value
                          || tds[7].innerText.trim();
      // evitar fila vacía completamente
      if ([tipificacion, fecha, cantidad, cuantia, denuncias, producto, tipoProducto, observaciones].some(v => (v ?? '').toString().trim() !== '')) {
        casos.push({ tipificacion, fecha, cantidad, cuantia, denuncias, producto, tipoProducto, observaciones });
      }
    }
    return casos;
  }

  function toJSONCasosFallbackStorage() {
    try {
      const raw = localStorage.getItem('casosDelictivos');
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function snapshotCasosToStorage() {
    const casos = toJSONCasosDesdeDOM();
    try { localStorage.setItem('casosDelictivos', JSON.stringify(casos)); } catch {}
    return casos;
  }

  function toJSONPerdidasDesdeDOM() {
    const perdidas = [];
    const tbody = document.querySelector('#tablaPerdidas tbody');
    if (!tbody) return perdidas;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    for (const tr of rows) {
      const tds = tr.querySelectorAll('td');
      if (tds.length < 4) continue;
      const mes = tds[0].innerText.trim();
      const casos = tds[1].innerText.trim();
      const monto = tds[2].innerText.trim();
      const rango = tds[3].innerText.trim();
      if ([mes, casos, monto, rango].some(v => v !== '')) {
        perdidas.push({ mes, casos, monto, rango });
      }
    }
    return perdidas;
  }

  function getDatosParaExportar() {
    // Encabezado del formulario
    // Encabezado del formulario (usar snapshot si faltan valores)
    const encDOM = {
      Empresa: document.getElementById('empresa')?.value || '',
      Fecha: document.getElementById('fecha')?.value || '',
      Responsable: document.getElementById('responsable')?.value || '',
      Trimestre: document.getElementById('trimestre')?.value || '',
      Cedula: document.getElementById('cedula')?.value || ''
    };
    const encSnap = readEncabezadoSnapshot();
    let encabezado = {
      Empresa: encDOM.Empresa || encSnap.Empresa || '',
      Fecha: encDOM.Fecha || encSnap.Fecha || '',
      Responsable: encDOM.Responsable || encSnap.Responsable || '',
      Trimestre: encDOM.Trimestre || encSnap.Trimestre || '',
      Cedula: encDOM.Cedula || encSnap.Cedula || ''
    };

    // Fallback de Fecha si viene vacía: usar la fecha actual en formato DD/MM/AAAA
    if (!encabezado.Fecha) {
      try {
        const hoy = new Date();
        const dd = String(hoy.getDate()).padStart(2, '0');
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const yyyy = hoy.getFullYear();
        encabezado.Fecha = `${dd}/${mm}/${yyyy}`;
      } catch {}
    }

    const delincuentes = (window.delincuentes && Array.isArray(window.delincuentes))
      ? window.delincuentes : (JSON.parse(localStorage.getItem('delincuentes') || '[]'));
    const delincuentesPersistentes = JSON.parse(localStorage.getItem('delincuentesPersistentes') || '[]');
    const productosRobados = (window.productosRobados && Array.isArray(window.productosRobados))
      ? window.productosRobados : (JSON.parse(localStorage.getItem('productosRobados') || '[]'));
    // Casos: refrescar snapshot antes, y usar fallback si queda vacío
    let casos = toJSONCasosDesdeDOM();
    if (!casos.length) casos = toJSONCasosFallbackStorage();
    const perdidas = toJSONPerdidasDesdeDOM();

    return { encabezado, delincuentes, delincuentesPersistentes, productosRobados, casos, perdidas };
  }

  function armarWorkbook(datos) {
    const wb = XLSX.utils.book_new();
    const { encabezado = {}, delincuentes = [], delincuentesPersistentes = [], productosRobados = [], casos = [], perdidas = [] } = datos || {};

    // Hoja Encabezado (1 fila)
    const wsEnc = XLSX.utils.aoa_to_sheet([[ 'Empresa','Fecha','Responsable','Trimestre','Cédula' ], [
      encabezado.Empresa || '', encabezado.Fecha || '', encabezado.Responsable || '', encabezado.Trimestre || '', encabezado.Cedula || ''
    ]]);
    XLSX.utils.book_append_sheet(wb, wsEnc, 'Encabezado');

    // Casos (con títulos capitalizados)
    const casosAOA = [ ['Tipificación','Fecha','Cantidad','Cuantía (B/.)','Denuncias','Producto/Mercancía','Tipo de producto','Observaciones'] ];
    for (const c of casos) {
      casosAOA.push([
        c.tipificacion ?? '', c.fecha ?? '', c.cantidad ?? '', c.cuantia ?? '', c.denuncias ?? '', c.producto ?? '', c.tipoProducto ?? '', c.observaciones ?? ''
      ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(casosAOA), 'Casos');

    // Delincuentes: PRIORIDAD Historial completo
    const delFuente = Array.isArray(delincuentesPersistentes) && delincuentesPersistentes.length ? delincuentesPersistentes : delincuentes;
    const delAOA = [ ['Nombre y Apellido','Cédula','Edad','Dirección','Vehículo','Placa','Color','Fecha Captura','Delito','Productos','Cuantía (B/.)','N° Denuncia'] ];
    // Índices para enriquecer desde 'delincuentes'
    const byCed = new Map();
    const byNom = new Map();
    for (const d of (delincuentes || [])) {
      if (d.cedula) byCed.set(String(d.cedula).trim(), d);
      const nom = (d.nombreCompleto || d.nombre || '').toString().toLowerCase().trim();
      if (nom) byNom.set(nom, d);
    }
    for (const base of (delFuente || [])) {
      const ced = base.cedula ? String(base.cedula).trim() : '';
      const nomKey = (base.nombreCompleto || base.nombre || '').toString().toLowerCase().trim();
      const match = (ced && byCed.get(ced)) || (nomKey && byNom.get(nomKey)) || base;
      const nombreCompleto = base.nombreCompleto || base.nombre || match.nombreCompleto || match.nombre || '';
      const direccion = base.direccion || match.direccion || '';
      const vehiculo = base.vehiculo || match.vehiculo || '';
      const placa = base.placa || match.placa || '';
      const color = base.color || base.colorVehiculo || match.color || match.colorVehiculo || '';
      const fechaCap = base.fecha || base.fechaCaptura || match.fecha || match.fechaCaptura || '';
      const delito = base.delito || match.delito || '';
      const productos = base.productos || base.mercancias || match.productos || match.mercancias || '';
      const cuantia = (base.cuantia ?? base.monto ?? match.cuantia ?? match.monto ?? '');
      const denuncia = base.denuncia || match.denuncia || '';
      const edad = base.edad || match.edad || '';
      const cedula = ced || match.cedula || '';
      delAOA.push([ nombreCompleto, cedula, edad, direccion, vehiculo, placa, color, fechaCap, delito, productos, cuantia, denuncia ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(delAOA), 'Delincuentes');

    // (Eliminado) Hoja compacta 'DelincuentesHist' a petición: solo mantener 'Delincuentes'

    // Productos robados
    const prodAOA = [ ['Producto/Mercancía','Tipo de producto','Cantidad Total'] ];
    for (const p of (productosRobados || [])) {
      prodAOA.push([ p.nombre || p.producto || '', p.tipo || '', p.cantidad || 0 ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodAOA), 'Productos');

    // Pérdidas: siempre listar los 12 meses, rellenando solo lo que exista en el registro
    const perdAOA = [ ['Mes','Casos','Pérdidas (B/.)','Rango de Fechas'] ];
    const mesesOrden = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const norm = (s) => (s||'').toString().trim().toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g,' ');
    const mapa = new Map();
    for (const r of (perdidas || [])) {
      const clave = norm(r.mes);
      if (clave) mapa.set(clave, r);
    }
    for (const mes of mesesOrden) {
      const k = norm(mes);
      const r = mapa.get(k) || {};
      perdAOA.push([ mes, r.casos || '', r.monto || '', r.rango || '' ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perdAOA), 'Perdidas');

    // Hoja de Logs: incluir logs de auditoría de la sesión para que viaje con el archivo
    try {
      const logs = getLogs();
      const logsAOA = [ ['Timestamp','Mensaje'] ];
      for (const l of logs) {
        const m = /^\[(.*?)\]\s*(.*)$/.exec(l) || [];
        logsAOA.push([ m[1] || '', m[2] || l ]);
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logsAOA), 'Logs');
    } catch {}

    return wb;
  }

  async function guardarConFSAPI(wb, suggestedName = 'registro-actividad-criminal.xlsx') {
    const handle = await showSaveFilePicker({
      suggestedName,
      types: [{ description: 'Excel Workbook', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }]
    });
    const writable = await handle.createWritable();
    const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' });
    await writable.write(blob);
    await writable.close();
  }

  async function exportarDatosExcel() {
    // Asegurar que los snapshots estén actualizados justo antes de exportar
    try { snapshotEncabezadoToStorage(); } catch {}
    try { snapshotCasosToStorage(); } catch {}
    const datos = getDatosParaExportar();
    const wb = armarWorkbook(datos);
    const filename = 'registro-actividad-criminal.xlsx';
    try {
      if (window.FORZAR_DESCARGA_EXCEL === true) {
        // Siempre usar descarga directa
        XLSX.writeFile(wb, filename);
      } else if (hasFS) {
        try {
          await guardarConFSAPI(wb, filename);
        } catch (e) {
          console.warn('FS Access API falló, usando descarga tradicional:', e?.message || e);
          // Fallback a descarga inmediata
          XLSX.writeFile(wb, filename);
        }
      } else {
        XLSX.writeFile(wb, filename);
      }
      noti('Datos exportados correctamente.');
    } catch (e) {
      console.error('Error exportando Excel', e);
      alert('No se pudo exportar el Excel: ' + (e?.message || e));
    }
  }

  function noti(msg) {
    if (typeof window.mostrarNotificacion === 'function') window.mostrarNotificacion(msg, 'success');
  }

  // Reconstrucción desde Excel
  function setIf(arr, fn) { try { return fn(arr); } catch { return; } }

  function aplicarCasosAlDOM(casos) {
    if (!Array.isArray(casos)) return;
    const tbody = document.querySelector('#tablaCasosDelictivos tbody');
    if (!tbody) return;
    // preservar fila total
    const totalRow = tbody.querySelector('tr.total-row');
    const placeholder = tbody.querySelector('#placeholder-casos');
    // borrar filas actuales excepto total y placeholder
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      if (tr.classList.contains('total-row') || tr.id === 'placeholder-casos') return;
      tr.remove();
    });
    // insertar antes de total-row
    const insertBeforeNode = totalRow || null;
    for (const c of casos) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="tipificacion-container"><span class="tipificacion-texto">${(c.tipificacion||'')}</span><input type="hidden" name="tipificacion[]" value="${(c.tipificacion||'')}" class="tipificacion-input" required></div></td>
        <td><input type="text" name="fecha[]" class="form-control fecha-input input-fecha-delito" placeholder="DD/MM/AAAA" inputmode="numeric" value="${(c.fecha||'')}"></td>
        <td><input type="number" min="0" name="cantidad[]" class="form-control cantidad-input" value="${(c.cantidad||'')}"></td>
        <td><input type="number" min="0" step="0.01" name="cuantia[]" class="form-control cuantia-input" value="${(c.cuantia||'')}"></td>
        <td><input type="number" min="0" name="denuncias[]" class="form-control denuncias-input" value="${(c.denuncias||'')}"></td>
        <td><input type="text" name="producto[]" class="form-control producto-input" value="${(c.producto||'')}"></td>
        <td><input type="text" name="tipoProducto[]" class="form-control tipo-producto-input" value="${(c.tipoProducto||c['Tipo de producto']||'')}"></td>
        <td><input type="text" name="observaciones[]" class="form-control" value="${(c.observaciones||'')}"></td>
        <td style="text-align:center;"><div style="display:flex;justify-content:center;gap:5px;"><button type="button" class="btn btn-success btn-sm" onclick="agregarFilaProductoSoloVisual()">+</button><button type="button" class="btn btn-danger btn-sm" onclick="eliminarFila(this)">X</button></div></td>`;
      tbody.insertBefore(tr, insertBeforeNode);
    }
    if (placeholder) placeholder.style.display = casos.length ? 'none' : '';
    if (typeof window.recalcularTotalesCasos === 'function') window.recalcularTotalesCasos();
  }

  function aplicarProductos(productos) {
    try {
      const arr = Array.isArray(productos) ? productos : [];
      // Consolidar por nombre normalizado (sumar cantidades)
      const norm = (s) => (s||'').toString().trim().toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g,' ');
      const toNum = (v) => {
        const n = parseFloat(String(v||0).toString().replace(/[,]/g,'').trim());
        return isNaN(n) ? 0 : n;
      };
      const mapa = new Map();
      for (const p of arr) {
        const legNombre = p.nombre || p.producto || '';
        const key = norm(legNombre);
        if (!key) continue;
        const prev = mapa.get(key) || { nombre: legNombre, tipo: p.tipo || '', cantidad: 0 };
        prev.cantidad = (prev.cantidad || 0) + toNum(p.cantidad);
        if (!prev.tipo && p.tipo) prev.tipo = p.tipo;
        if (!prev.nombre && legNombre) prev.nombre = legNombre; // mantener legible
        mapa.set(key, prev);
      }
      const consol = Array.from(mapa.values());
      // Persistir fuente de verdad
      localStorage.setItem('productosRobados', JSON.stringify(consol));
      window.productosRobados = consol;
      // Si existe consolidación avanzada, úsala para aplicar reglas adicionales (prefijos) y refrescar UI
      if (typeof window.consolidarProductosSimilares === 'function') {
        window.consolidarProductosSimilares();
      } else if (typeof window.actualizarTablaProductos === 'function') {
        window.actualizarTablaProductos();
      }
    } catch {}
  }

  function aplicarDelincuentes(arr) {
    try {
      localStorage.setItem('delincuentes', JSON.stringify(Array.isArray(arr) ? arr : []));
      window.delincuentes = Array.isArray(arr) ? arr : [];
      if (typeof window.renderizarTablaHistorialDelincuentes === 'function') window.renderizarTablaHistorialDelincuentes();
    } catch {}
  }

  function aplicarDelincuentesHist(arr) {
    try {
      localStorage.setItem('delincuentesPersistentes', JSON.stringify(Array.isArray(arr) ? arr : []));
      if (typeof window.renderizarTablaHistorialDelincuentes === 'function') window.renderizarTablaHistorialDelincuentes();
    } catch {}
  }

  function aplicarPerdidas(arr) {
    // Por ahora solo persistimos los datos; reconstrucción UI específica si se requiere
    try {
      localStorage.setItem('perdidasTrimestrales', JSON.stringify(Array.isArray(arr) ? arr : []));
    } catch {}
  }

  async function importarDesdeExcel(file) {
    try {
      let data;
      if (!file) {
        // usar input file si existe
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        const prom = new Promise(res => input.onchange = () => res(input.files[0]));
        input.click();
        file = await prom;
      }
      if (!file) return;
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });

      const getSheet = name => wb.Sheets[name] || wb.Sheets[wb.SheetNames.find(n => n.toLowerCase() === name.toLowerCase())];
      const casos = XLSX.utils.sheet_to_json(getSheet('Casos') || {}, { defval: '' });
      const delincuentes = XLSX.utils.sheet_to_json(getSheet('Delincuentes') || {}, { defval: '' });
      const delincuentesHist = XLSX.utils.sheet_to_json(getSheet('DelincuentesHist') || {}, { defval: '' });
      const productos = XLSX.utils.sheet_to_json(getSheet('Productos') || {}, { defval: '' });
      const perdidas = XLSX.utils.sheet_to_json(getSheet('Perdidas') || {}, { defval: '' });
      const encabezado = XLSX.utils.sheet_to_json(getSheet('Encabezado') || {}, { defval: '' });

      // Restaurar encabezado si existe
      if (Array.isArray(encabezado) && encabezado.length) {
        const e = encabezado[0];
        if (document.getElementById('empresa')) document.getElementById('empresa').value = e['Empresa'] || '';
        if (document.getElementById('fecha')) document.getElementById('fecha').value = e['Fecha'] || '';
        if (document.getElementById('responsable')) document.getElementById('responsable').value = e['Responsable'] || '';
        if (document.getElementById('trimestre')) document.getElementById('trimestre').value = e['Trimestre'] || '';
        if (document.getElementById('cedula')) document.getElementById('cedula').value = e['Cédula'] || '';
      }

      if (casos.length) aplicarCasosAlDOM(casos);
      // Persistir snapshot importado
      try { localStorage.setItem('casosDelictivos', JSON.stringify(casos)); } catch {}
      // Normalización de estructuras a lo que espera la UI
      const mapDel = (arr) => (arr||[]).map(d => ({
        nombreCompleto: d['Nombre y Apellido'] || d['Nombre'] || d['nombreCompleto'] || d['nombre'] || '',
        nombre: d['Nombre y Apellido'] || d['Nombre'] || d['nombre'] || d['nombreCompleto'] || '',
        cedula: d['Cédula'] || d['Cedula'] || d['cedula'] || '',
        edad: d['Edad'] || d['edad'] || '',
        direccion: d['Dirección'] || d['Direccion'] || d['direccion'] || '',
        vehiculo: d['Vehículo'] || d['Vehiculo'] || d['vehiculo'] || '',
        placa: d['Placa'] || d['placa'] || '',
        color: d['Color'] || d['color'] || d['Color vehículo'] || d['Color Vehículo'] || '',
        fechaCaptura: d['Fecha Captura'] || d['Fecha'] || d['fecha'] || d['fechaCaptura'] || '',
        delito: d['Delito'] || d['delito'] || '',
        productos: d['Productos'] || d['Mercancias'] || d['Producto/Mercancía'] || d['Producto'] || d['producto'] || '',
        cuantia: d['Cuantía (B/.)'] || d['Cuantia (B/.)'] || d['Cuantia'] || d['monto'] || d['cuantia'] || '',
        denuncia: d['N° Denuncia'] || d['N Denuncia'] || d['denuncia'] || ''
      }));
      const mapProd = (arr) => (arr||[]).map(p => ({
        nombre: p['Producto/Mercancía'] || p['Producto'] || p['Nombre'] || p['nombre'] || '',
        tipo: p['Tipo de producto'] || p['tipo'] || '',
        cantidad: p['Cantidad Total'] || p['Cantidad'] || p['Total'] || p['cantidad'] || 0
      }));

      const delHistNorm = mapDel(delincuentesHist);
      const delNorm = mapDel(delincuentes);
      const prodNorm = mapProd(productos);

      // Priorizar Historial. Si no viene 'DelincuentesHist' pero sí 'Delincuentes',
      // también persistirlos como historial para que se reflejen en la UI.
      if (delHistNorm.length) {
        aplicarDelincuentesHist(delHistNorm);
      } else if (delNorm.length) {
        aplicarDelincuentes(delNorm);
        aplicarDelincuentesHist(delNorm);
      }
      if (prodNorm.length) aplicarProductos(prodNorm);
      if (perdidas.length) aplicarPerdidas(perdidas);

      noti('Datos importados correctamente. Revise las tablas.');
    } catch (e) {
      console.error('Error importando Excel', e);
      alert('No se pudo importar el Excel: ' + e.message);
    }
  }

  async function seleccionarYExportarExcel() {
    await exportarDatosExcel();
  }

  // Exponer en window
  window.exportarDatosExcel = exportarDatosExcel;
  window.importarDesdeExcel = importarDesdeExcel;
  window.seleccionarYExportarExcel = seleccionarYExportarExcel;

  // ==============================
  // Actualizar Excel existente
  // ==============================
  function _normTxt(s) {
    return (s||'').toString().trim().toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g,' ');
  }
  function _toNumber(val) {
    if (val == null) return 0;
    const s = String(val).replace(/B\/.\s*/gi, '').replace(/[,]/g,'').trim();
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  async function actualizarExcelExistente() {
    try {
      log('Inicio actualización de Excel maestro');
      // 1) Seleccionar archivo maestro existente
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      const file = await new Promise(res => { input.onchange = () => res(input.files[0]); input.click(); });
      if (!file) return;

      const buf = await file.arrayBuffer();
      const wbOld = XLSX.read(buf, { type: 'array' });
      const getSheet = name => wbOld.Sheets[name] || wbOld.Sheets[wbOld.SheetNames.find(n => n.toLowerCase() === name.toLowerCase())];

      // 2) Datos nuevos desde la app
      const datos = getDatosParaExportar();
      const { encabezado = {}, casos = [], delincuentes = [], delincuentesPersistentes = [], productosRobados = [], perdidas = [] } = datos || {};
      log(`Datos nuevos: encabezado OK, casos=${casos.length}, delTemp=${delincuentes.length}, delHist=${delincuentesPersistentes.length}, productos=${productosRobados.length}`);

      // 3) Reconstruir arrays desde el maestro existente
      const encOld = XLSX.utils.sheet_to_json(getSheet('Encabezado') || {}, { defval: '' });
      const casosOld = XLSX.utils.sheet_to_json(getSheet('Casos') || {}, { defval: '' });
      const delOld = XLSX.utils.sheet_to_json(getSheet('Delincuentes') || {}, { defval: '' });
      const prodOld = XLSX.utils.sheet_to_json(getSheet('Productos') || {}, { defval: '' });
      const perdOld = XLSX.utils.sheet_to_json(getSheet('Perdidas') || {}, { defval: '' });
      log(`Maestro: encabezados=${encOld.length}, casos=${casosOld.length}, delincuentes=${delOld.length}, productos=${prodOld.length}, perdidas=${perdOld.length}`);

      // 4) Fusionar: Encabezado -> mantener históricos y agregar uno nuevo (no sobrescribir)
      const encAOA = [[ 'Empresa','Fecha','Responsable','Trimestre','Cédula' ]];
      for (const e of (encOld || [])) {
        encAOA.push([ e['Empresa']||'', e['Fecha']||'', e['Responsable']||'', e['Trimestre']||'', e['Cédula']||e['Cedula']||'' ]);
      }
      encAOA.push([ encabezado.Empresa||'', encabezado.Fecha||'', encabezado.Responsable||'', encabezado.Trimestre||'', encabezado.Cedula||'' ]);

      // 5) Casos -> consolidar por (Tipificación + Fecha + Producto)
      const casosAOA = [ ['Tipificación','Fecha','Cantidad','Cuantía (B/.)','Denuncias','Producto/Mercancía','Observaciones'] ];
      const keyCasos = (t, f, p) => `${_normTxt(t)}|${(f||'').toString().trim()}|${_normTxt(p)}`;
      const mapaCasos = new Map();
      const addCaso = (tipi, fecha, cant, cuantia, denuncias, producto, obs) => {
        const k = keyCasos(tipi, fecha, producto);
        const prev = mapaCasos.get(k) || { tipificacion: tipi||'', fecha: fecha||'', cantidad: 0, cuantia: 0, denuncias: 0, producto: producto||'', observaciones: '' };
        prev.cantidad = (prev.cantidad||0) + _toNumber(cant);
        prev.cuantia = (prev.cuantia||0) + _toNumber(cuantia);
        prev.denuncias = (prev.denuncias||0) + _toNumber(denuncias);
        // conservar primer texto de observaciones y producto legible
        if (!prev.observaciones && obs) prev.observaciones = obs;
        if (!prev.producto && producto) prev.producto = producto;
        if (!prev.tipificacion && tipi) prev.tipificacion = tipi;
        if (!prev.fecha && fecha) prev.fecha = fecha;
        mapaCasos.set(k, prev);
      };
      let consolOld = 0, consolNew = 0;
      for (const c of (casosOld || [])) {
        addCaso(
          c['Tipificación']||c['Tipificacion']||'',
          c['Fecha']||'',
          c['Cantidad']||0,
          c['Cuantía (B/.)']||c['Cuantia (B/.)']||c['Cuantia']||0,
          c['Denuncias']||0,
          c['Producto/Mercancía']||c['Producto']||'',
          c['Observaciones']||''
        );
        consolOld++;
      }
      for (const c of (casos || [])) {
        addCaso(c.tipificacion||'', c.fecha||'', c.cantidad||0, c.cuantia||0, c.denuncias||0, c.producto||'', c.observaciones||'');
        consolNew++;
      }
      for (const v of mapaCasos.values()) {
        casosAOA.push([ v.tipificacion||'', v.fecha||'', v.cantidad||0, v.cuantia||0, v.denuncias||0, v.producto||'', v.observaciones||'' ]);
      }
      log(`Casos consolidados: origen=${consolOld} + nuevos=${consolNew} -> salida=${mapaCasos.size}`);

      // 6) Delincuentes -> append (priorizar historial si existe)
      const delFuenteNew = Array.isArray(delincuentesPersistentes) && delincuentesPersistentes.length ? delincuentesPersistentes : delincuentes;
      const delAOA = [ ['Nombre y Apellido','Cédula','Edad','Dirección','Vehículo','Placa','Color','Fecha Captura','Delito','Productos','Cuantía (B/.)','N° Denuncia'] ];
      for (const d of (delOld || [])) {
        delAOA.push([
          d['Nombre y Apellido']||'', d['Cédula']||d['Cedula']||'', d['Edad']||'', d['Dirección']||d['Direccion']||'', d['Vehículo']||d['Vehiculo']||'',
          d['Placa']||'', d['Color']||'', d['Fecha Captura']||d['Fecha']||'', d['Delito']||'', d['Productos']||d['Mercancias']||'', d['Cuantía (B/.)']||d['Cuantia']||'', d['N° Denuncia']||d['N Denuncia']||''
        ]);
      }
      for (const d of (delFuenteNew || [])) {
        const cuantia = (d.cuantia != null ? d.cuantia : d.monto != null ? d.monto : '');
        delAOA.push([ d.nombreCompleto||d.nombre||'', d.cedula||'', d.edad||'', d.direccion||'', d.vehiculo||'', d.placa||'', d.color||d.colorVehiculo||'', d.fecha||d.fechaCaptura||'', d.delito||'', d.productos||d.mercancias||'', cuantia||'', d.denuncia||'' ]);
      }

      // 7) Productos -> sumar por nombre
      const mapaProd = new Map();
      const addProd = (nombre, cant) => {
        const k = _normTxt(nombre);
        if (!k) return;
        const prev = mapaProd.get(k) || { nombre: nombre, cantidad: 0 };
        prev.cantidad = (prev.cantidad || 0) + _toNumber(cant);
        // conservar nombre legible
        if (!prev.nombre && nombre) prev.nombre = nombre;
        mapaProd.set(k, prev);
      };
      for (const p of (prodOld || [])) addProd(p['Producto/Mercancía']||p['Producto']||p['Nombre']||'', p['Cantidad Total']||p['Cantidad']||p['Total']||0);
      for (const p of (productosRobados || [])) addProd(p.nombre||p.producto||'', p.cantidad||0);
      const prodAOA = [ ['Producto/Mercancía','Cantidad Total'] ];
      for (const v of mapaProd.values()) prodAOA.push([ v.nombre||'', v.cantidad||0 ]);
      log(`Productos consolidados: salida=${mapaProd.size}`);

      // 8) Perdidas -> sumar por mes
      const mapaMes = new Map();
      const addPerd = (mes, casos, monto, rango) => {
        const k = _normTxt(mes);
        if (!k) return;
        const prev = mapaMes.get(k) || { mes, casos: 0, monto: 0, rango: '' };
        prev.casos = (prev.casos || 0) + _toNumber(casos);
        prev.monto = (prev.monto || 0) + _toNumber(monto);
        // mantener el último rango no vacío
        if (rango && String(rango).trim()) prev.rango = rango;
        if (!prev.mes && mes) prev.mes = mes; // mantener el nombre legible
        mapaMes.set(k, prev);
      };
      for (const r of (perdOld || [])) addPerd(r['Mes']||'', r['Casos']||0, r['Pérdidas (B/.)']||r['Perdidas (B/.)']||r['Perdidas']||0, r['Rango de Fechas']||r['Rango']||'');
      for (const r of (perdidas || [])) addPerd(r.mes||'', r.casos||0, r.monto||0, r.rango||'');
      // salida ordenada por meses calendario - SIEMPRE los 12 meses
      const mesesOrden = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const perdAOA = [ ['Mes','Casos','Pérdidas (B/.)','Rango de Fechas'] ];
      for (const mes of mesesOrden) {
        const v = mapaMes.get(_normTxt(mes)) || { casos: 0, monto: 0, rango: '' };
        perdAOA.push([ mes, v.casos || 0, v.monto || 0, v.rango || '' ]);
      }

      // 9) Construir nuevo libro y descargar
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(encAOA), 'Encabezado');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(casosAOA), 'Casos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(delAOA), 'Delincuentes');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodAOA), 'Productos');
      // (Eliminado) No generar 'DelincuentesHist' en actualización
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perdAOA), 'Perdidas');

      // Logs -> fusionar existente + nuevos
      try {
        const logsOldSheet = getSheet('Logs');
        let logsOld = [];
        if (logsOldSheet) {
          const raw = XLSX.utils.sheet_to_json(logsOldSheet, { header: 1 });
          // omitir encabezado si detectado
          if (Array.isArray(raw)) {
            const start = (raw[0] && raw[0].length && /timestamp/i.test(String(raw[0][0]||''))) ? 1 : 0;
            for (let i = start; i < raw.length; i++) {
              const row = raw[i] || [];
              if (row.length === 0 || (!String(row[0]||'').trim() && !String(row[1]||'').trim())) continue;
              logsOld.push([ String(row[0]||''), String(row[1]||'') ]);
            }
          }
        }
        const logsNew = (getLogs() || []).map(l => {
          const m = /^\[(.*?)\]\s*(.*)$/.exec(l) || [];
          return [ m[1] || '', m[2] || l ];
        });
        const logsAOA = [ ['Timestamp','Mensaje'], ...logsOld, ...logsNew ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logsAOA), 'Logs');
        log(`Logs fusionados: maestro=${logsOld.length}, nuevos=${logsNew.length}`);
      } catch (e) {
        console.warn('No se pudieron fusionar logs:', e);
      }

      const nombre = (file.name || 'registro-actividad-criminal.xlsx').replace(/(.xlsx)?$/i,'_actualizado.xlsx');
      XLSX.writeFile(wb, nombre);
      noti('Excel maestro actualizado y descargado.');
      log('Actualización completada y archivo descargado');
    } catch (e) {
      console.error('Error al actualizar Excel existente', e);
      alert('No se pudo actualizar el Excel existente: ' + (e?.message || e));
    }
  }

  // Versión que además abre el modal de logs
  window.actualizarExcelExistenteConLogs = async function() {
    try {
      clearLogs();
      log('Preparando actualización con logs visibles...');
      await actualizarExcelExistente();
    } finally {
      try {
        if (typeof window.abrirModalLogs === 'function') {
          window.abrirModalLogs(getLogs().join('\n'));
        } else {
          // Fallback: modal dinámico minimalista
          let wrap = document.getElementById('modalLogs');
          if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'modalLogs';
            wrap.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);z-index:2000;';
            wrap.innerHTML = '<div style="background:#fff;max-width:90vw;width:800px;max-height:80vh;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;">\
              <div style="padding:10px 14px;background:#0d6efd;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:8px;">\
                <strong>Logs de actualización</strong>\
                <div style="display:flex;gap:8px;align-items:center;">\
                  <button id="borrarLogsBtn" class="btn btn-light btn-sm" style="background:#fff;color:#0d6efd;border:1px solid #fff;border-radius:4px;cursor:pointer;">Borrar logs</button>\
                  <button id="cerrarLogsBtn" style="background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>\
                </div>\
              </div>\
              <pre id="logsContenido" style="margin:0;padding:12px;white-space:pre-wrap;overflow:auto;flex:1;background:#f8f9fa;"></pre>\
            </div>';
            document.body.appendChild(wrap);
            wrap.querySelector('#cerrarLogsBtn').onclick = () => wrap.style.display='none';
            const borrarBtn = wrap.querySelector('#borrarLogsBtn');
            if (borrarBtn) borrarBtn.onclick = () => { try { window.borrarLogsAuditoria(); } catch(e) { console.error(e); } };
          }
          const pre = document.getElementById('logsContenido');
          if (pre) pre.textContent = getLogs().join('\n');
          wrap.style.display = 'flex';
        }
      } catch {}
    }
  };

  window.actualizarExcelExistente = actualizarExcelExistente;

  // --- Importar datos desde un Excel para poblar Top 20 e Historial ---
  window.importarDatosDesdeExcelConLogs = async function() {
    try {
      clearLogs();
      log('Iniciando importación de datos desde Excel');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      const file = await new Promise(res => { input.onchange = () => res(input.files[0]); input.click(); });
      if (!file) { log('Importación cancelada por el usuario'); return; }

      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const getSheet = name => wb.Sheets[name] || wb.Sheets[wb.SheetNames.find(n => n.toLowerCase() === name.toLowerCase())];
      log(`Hojas detectadas: ${wb.SheetNames.join(', ')}`);

      // 1) Importar Productos
      const shProd = getSheet('Productos');
      let productos = [];
      if (shProd) {
        const rows = XLSX.utils.sheet_to_json(shProd, { defval: '' });
        const mapa = new Map();
        let omitidos = 0;
        for (const r of rows) {
          // Buscar nombre y cantidad por clave normalizada
          const claves = Object.keys(r || {});
          const norm = (s) => _normTxt(String(s || ''));
          const keyNombre = claves.find(k => {
            const nk = norm(k);
            return (nk.includes('producto') || nk.includes('mercanc')) && !nk.includes('cantidad') && !nk.includes('total');
          });
          const keyCantidad = claves.find(k => {
            const nk = norm(k);
            return nk.includes('cantidad');
          }) || claves.find(k => norm(k).includes('total'));
          const nombre = (keyNombre ? String(r[keyNombre]) : '').trim();
          const cant = _toNumber(keyCantidad ? r[keyCantidad] : 0);
          if (!nombre) { omitidos++; continue; }
          const k = _normTxt(nombre);
          const prev = mapa.get(k) || { nombre: nombre, cantidad: 0, valor: 0 };
          prev.cantidad += cant;
          if (!prev.nombre) prev.nombre = nombre;
          mapa.set(k, prev);
        }
        productos = Array.from(mapa.values());
        log(`Productos importados: ${productos.length}. Filas omitidas (sin nombre): ${omitidos}`);
      } else {
        log('Hoja Productos no encontrada, se omitirá');
      }

      // 2) Importar Delincuentes (historial) desde múltiples posibles hojas
      const hojasDelincuentesCandidatas = ['Delincuentes','Delincuente Capturado','Delincuentes Capturados','Historial Delincuentes','Historial'];
      const hojasEncontradas = hojasDelincuentesCandidatas
        .map(n => ({ n, sh: getSheet(n) }))
        .filter(x => !!x.sh);
      let delincuentesPersistentes = [];
      if (hojasEncontradas.length) {
        const mapa = new Map(); // clave: cédula
        let procesadas = 0, omitidas = 0;
        for (const { n, sh } of hojasEncontradas) {
          const rows = XLSX.utils.sheet_to_json(sh, { defval: '' });
          log(`Leyendo hoja de historial: ${n} (filas: ${rows.length})`);
          for (const r of rows) {
            const nombreCampo = (r['Nombre y Apellido'] ?? r['Nombre'] ?? r['Delincuente'] ?? r['Delincuente Capturado'] ?? '').toString();
            const ced = (r['Cédula'] ?? r['Cedula'] ?? r['ID'] ?? '').toString().trim();
            // Si no tiene cédula ni nombre, omitir
            if (!ced && !nombreCampo.trim()) { omitidas++; continue; }
            const obj = {
              nombreCompleto: nombreCampo.trim(),
              nombre: nombreCampo.trim(),
              cedula: ced,
              edad: r['Edad'] ?? '',
              direccion: r['Dirección'] ?? r['Direccion'] ?? '',
              vehiculo: r['Vehículo'] ?? r['Vehiculo'] ?? '',
              placa: r['Placa'] ?? '',
              color: r['Color'] ?? '',
              fechaCaptura: r['Fecha Captura'] ?? r['Fecha'] ?? '',
              delito: r['Delito'] ?? r['Delito/Observación'] ?? '',
              productos: r['Productos'] ?? r['Mercancias'] ?? r['Producto'] ?? '',
              cuantia: r['Cuantía (B/.)'] ?? r['Cuantia'] ?? r['Monto'] ?? r['Cuantía'] ?? '',
              denuncia: r['N° Denuncia'] ?? r['N Denuncia'] ?? r['Denuncia'] ?? r['No Denuncia'] ?? ''
            };
            // Clave de fusión: preferir cédula, si no hay usar nombre normalizado
            const clave = ced || _normTxt(obj.nombre || '');
            if (!clave) { omitidas++; continue; }
            const prev = mapa.get(clave) || {};
            const claves = ['nombreCompleto','nombre','cedula','edad','direccion','vehiculo','placa','color','fechaCaptura','delito','productos','cuantia','denuncia'];
            const res = { ...prev };
            claves.forEach(k => {
              const nuevo = obj[k];
              const anterior = prev[k];
              res[k] = (nuevo !== undefined && String(nuevo).trim() !== '') ? nuevo : (anterior !== undefined ? anterior : '');
            });
            mapa.set(clave, res);
            procesadas++;
          }
        }
        delincuentesPersistentes = Array.from(mapa.values());
        log(`Delincuentes importados (historial): ${delincuentesPersistentes.length}. Filas procesadas: ${procesadas}, omitidas: ${omitidas}`);
      } else {
        log('No se encontró ninguna hoja de historial de delincuentes (Intentado: ' + hojasDelincuentesCandidatas.join(', ') + ')');
      }

      // 3) Persistir en localStorage y refrescar UI
      try {
        if (productos && Array.isArray(productos)) {
          localStorage.setItem('productosRobados', JSON.stringify(productos));
          window.productosRobados = productos;
          if (typeof consolidarProductosSimilares === 'function') try { consolidarProductosSimilares(); } catch {}
          if (typeof actualizarTablaProductos === 'function') actualizarTablaProductos();
          document.dispatchEvent(new Event('productosActualizados'));
        }
        if (delincuentesPersistentes && Array.isArray(delincuentesPersistentes)) {
          localStorage.setItem('delincuentesPersistentes', JSON.stringify(delincuentesPersistentes));
          if (typeof renderizarTablaHistorialDelincuentes === 'function') renderizarTablaHistorialDelincuentes();
          if (typeof window.actualizarTablaHistorialDesdeTabla === 'function') window.actualizarTablaHistorialDesdeTabla();
        }
      } catch (e) {
        log('Error guardando en localStorage: ' + (e?.message || e));
      }

      noti('Importación finalizada. Datos cargados en Top 20 e Historial.');
      log('Importación completada y UI actualizada.');
    } catch (e) {
      console.error('Error en importación', e);
      alert('Error al importar: ' + (e?.message || e));
    } finally {
      try { if (typeof window.abrirModalLogs === 'function') window.abrirModalLogs(getLogs().join('\n')); } catch {}
    }
  };

  // Utilidad para abrir modal de logs sin acción
  window.abrirSoloLogs = function(){
    try { if (typeof window.abrirModalLogs === 'function') window.abrirModalLogs(getLogs().join('\n')); } catch(e) { console.error(e); }
  };

  // Inicialización: listeners para auto-snapshot
  function initPersistenciaListeners() {
    const ids = ['empresa','fecha','responsable','trimestre','cedula'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', snapshotEncabezadoToStorage);
      if (el) el.addEventListener('change', snapshotEncabezadoToStorage);
    });
    const tabla = document.getElementById('tablaCasosDelictivos');
    if (tabla) {
      tabla.addEventListener('input', (e) => {
        if (e.target && (e.target.matches('.fecha-input, .cantidad-input, .cuantia-input, .denuncias-input, .producto-input') || e.target.name?.endsWith('[]'))) {
          snapshotCasosToStorage();
        }
      });
      tabla.addEventListener('change', () => snapshotCasosToStorage());
    }
    // Snapshot inicial
    snapshotEncabezadoToStorage();
    snapshotCasosToStorage();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersistenciaListeners);
  } else {
    initPersistenciaListeners();
  }
  // Utilidad pública opcional
  window.guardarSnapshotDatos = function() { snapshotEncabezadoToStorage(); snapshotCasosToStorage(); };

  // =====================
  // Auto-respaldo a PDF
  // =====================
  let _autoRespaldoTimer = null;
  let _pdfRespaldoHandle = null; // FileSystemFileHandle

  async function seleccionarArchivoPDFRespaldo(sugerido = 'Respaldo_Registro.pdf') {
    if (!window.showSaveFilePicker) return false; // No soportado
    try {
      _pdfRespaldoHandle = await window.showSaveFilePicker({
        suggestedName: sugerido,
        types: [
          { description: 'Archivo PDF', accept: { 'application/pdf': ['.pdf'] } }
        ]
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async function guardarPDFEnHandle(doc) {
    try {
      if (!_pdfRespaldoHandle) return false;
      const writable = await _pdfRespaldoHandle.createWritable();
      const blob = doc.output('blob');
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e) {
      console.warn('Fallo al escribir PDF con FS API:', e);
      return false;
    }
  }

  function descargarPDFFallback(doc) {
    try {
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0,19);
      const nombre = `Respaldo_Registro_${ts}.pdf`;
      doc.save(nombre);
    } catch (e) { console.warn('Fallo descarga PDF fallback', e); }
  }

  async function realizarRespaldoPDF() {
    if (typeof window.generarPDFSilencioso !== 'function') return;
    const doc = await window.generarPDFSilencioso();
    if (!doc) return;
    if (window.showSaveFilePicker && _pdfRespaldoHandle) {
      const ok = await guardarPDFEnHandle(doc);
      if (!ok) descargarPDFFallback(doc);
    } else {
      descargarPDFFallback(doc);
    }
  }

  async function iniciarAutoRespaldoPDF(intervaloMin = 5) {
    // intervalo en minutos
    if (_autoRespaldoTimer) clearInterval(_autoRespaldoTimer);
    if (window.showSaveFilePicker) {
      if (!_pdfRespaldoHandle) {
        const ok = await seleccionarArchivoPDFRespaldo();
        if (!ok) console.warn('Usuario canceló selección de archivo. Se usará descarga automática como respaldo.');
      }
    }
    // Ejecutar un respaldo inmediato y programar siguiente
    realizarRespaldoPDF();
    _autoRespaldoTimer = setInterval(realizarRespaldoPDF, Math.max(1, intervaloMin) * 60 * 1000);
  }

  function detenerAutoRespaldoPDF() {
    if (_autoRespaldoTimer) clearInterval(_autoRespaldoTimer);
    _autoRespaldoTimer = null;
  }

  // Exponer APIs públicas
  window.iniciarAutoRespaldoPDF = iniciarAutoRespaldoPDF;
  window.detenerAutoRespaldoPDF = detenerAutoRespaldoPDF;
  window.seleccionarArchivoPDFRespaldo = seleccionarArchivoPDFRespaldo;
})();
