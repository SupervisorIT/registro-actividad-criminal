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
      if (tds.length < 8) continue;
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
      const observaciones = tr.querySelector("input[name='observaciones[]']")?.value
                          || tds[6].querySelector('input')?.value
                          || tds[6].innerText.trim();
      // evitar fila vacía completamente
      if ([tipificacion, fecha, cantidad, cuantia, denuncias, producto, observaciones].some(v => (v ?? '').toString().trim() !== '')) {
        casos.push({ tipificacion, fecha, cantidad, cuantia, denuncias, producto, observaciones });
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
    const casosAOA = [ ['Tipificación','Fecha','Cantidad','Cuantía (B/.)','Denuncias','Producto/Mercancía','Observaciones'] ];
    for (const c of casos) {
      casosAOA.push([
        c.tipificacion ?? '', c.fecha ?? '', c.cantidad ?? '', c.cuantia ?? '', c.denuncias ?? '', c.producto ?? '', c.observaciones ?? ''
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

    // Productos robados
    const prodAOA = [ ['Producto/Mercancía','Cantidad Total'] ];
    for (const p of (productosRobados || [])) {
      prodAOA.push([ p.nombre || p.producto || '', p.cantidad || 0 ]);
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
        <td><input type="text" name="observaciones[]" class="form-control" value="${(c.observaciones||'')}"></td>
        <td style="text-align:center;"><div style="display:flex;justify-content:center;gap:5px;"><button type="button" class="btn btn-success btn-sm" onclick="agregarFilaProductoSoloVisual()">+</button><button type="button" class="btn btn-danger btn-sm" onclick="eliminarFila(this)">X</button></div></td>`;
      tbody.insertBefore(tr, insertBeforeNode);
    }
    if (placeholder) placeholder.style.display = casos.length ? 'none' : '';
    if (typeof window.recalcularTotalesCasos === 'function') window.recalcularTotalesCasos();
  }

  function aplicarProductos(productos) {
    try {
      localStorage.setItem('productosRobados', JSON.stringify(Array.isArray(productos) ? productos : []));
      window.productosRobados = Array.isArray(productos) ? productos : [];
      if (typeof window.actualizarTablaProductos === 'function') window.actualizarTablaProductos();
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
      // Priorizar Historial
      if (delincuentesHist.length) aplicarDelincuentesHist(delincuentesHist);
      else if (delincuentes.length) aplicarDelincuentes(delincuentes);
      if (productos.length) aplicarProductos(productos);
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

      // 3) Reconstruir arrays desde el maestro existente
      const encOld = XLSX.utils.sheet_to_json(getSheet('Encabezado') || {}, { defval: '' });
      const casosOld = XLSX.utils.sheet_to_json(getSheet('Casos') || {}, { defval: '' });
      const delOld = XLSX.utils.sheet_to_json(getSheet('Delincuentes') || {}, { defval: '' });
      const prodOld = XLSX.utils.sheet_to_json(getSheet('Productos') || {}, { defval: '' });
      const perdOld = XLSX.utils.sheet_to_json(getSheet('Perdidas') || {}, { defval: '' });

      // 4) Fusionar: Encabezado -> mantener históricos y agregar uno nuevo (no sobrescribir)
      const encAOA = [[ 'Empresa','Fecha','Responsable','Trimestre','Cédula' ]];
      for (const e of (encOld || [])) {
        encAOA.push([ e['Empresa']||'', e['Fecha']||'', e['Responsable']||'', e['Trimestre']||'', e['Cédula']||e['Cedula']||'' ]);
      }
      encAOA.push([ encabezado.Empresa||'', encabezado.Fecha||'', encabezado.Responsable||'', encabezado.Trimestre||'', encabezado.Cedula||'' ]);

      // 5) Casos -> append
      const casosAOA = [ ['Tipificación','Fecha','Cantidad','Cuantía (B/.)','Denuncias','Producto/Mercancía','Observaciones'] ];
      for (const c of (casosOld || [])) {
        casosAOA.push([
          c['Tipificación']||c['Tipificacion']||'', c['Fecha']||'', c['Cantidad']||'', c['Cuantía (B/.)']||c['Cuantia (B/.)']||c['Cuantia']||'',
          c['Denuncias']||'', c['Producto/Mercancía']||c['Producto']||'', c['Observaciones']||''
        ]);
      }
      for (const c of (casos || [])) {
        casosAOA.push([ c.tipificacion||'', c.fecha||'', c.cantidad||'', c.cuantia||'', c.denuncias||'', c.producto||'', c.observaciones||'' ]);
      }

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
      // salida ordenada por meses calendario
      const mesesOrden = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const perdAOA = [ ['Mes','Casos','Pérdidas (B/.)','Rango de Fechas'] ];
      for (const mes of mesesOrden) {
        const v = mapaMes.get(_normTxt(mes));
        if (v) perdAOA.push([ mes, v.casos, v.monto, v.rango || '' ]);
      }

      // 9) Construir nuevo libro y descargar
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(encAOA), 'Encabezado');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(casosAOA), 'Casos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(delAOA), 'Delincuentes');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodAOA), 'Productos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perdAOA), 'Perdidas');

      const nombre = (file.name || 'registro-actividad-criminal.xlsx').replace(/(.xlsx)?$/i,'_actualizado.xlsx');
      XLSX.writeFile(wb, nombre);
      noti('Excel maestro actualizado y descargado.');
    } catch (e) {
      console.error('Error al actualizar Excel existente', e);
      alert('No se pudo actualizar el Excel existente: ' + (e?.message || e));
    }
  }

  window.actualizarExcelExistente = actualizarExcelExistente;

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
