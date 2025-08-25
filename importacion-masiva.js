(function(){
  function qs(id){ return document.getElementById(id); }
  function showMsg(text, type){
    const el = qs('msgImport');
    if(!el) return;
    el.style.display = 'block';
    el.textContent = text;
    el.style.padding = '8px';
    el.style.borderRadius = '6px';
    el.style.border = '1px solid ' + (type==='error'?'#f5c2c7':'#b6f0d1');
    el.style.background = (type==='error'?'#f8d7da':'#e6fff1');
    el.style.color = (type==='error'?'#842029':'#1b8f4b');
  }

  function descargarPlantilla(){
    try{
      const wb = XLSX.utils.book_new();
      // Delincuentes
      const delAOA = [[
        'Nombre y Apellido','Cédula','Edad','Dirección','Vehículo','Placa','Color','Fecha Captura','Delito','Productos','Cuantía (B/.)','N° Denuncia'
      ], [
        'Juan Pérez','8-123-456','28','Ciudad...','Auto','ABC123','Rojo','01/01/2024','Hurto','Celulares','350','DEN-001'
      ]];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(delAOA), 'Delincuentes');
      // Productos
      const prodAOA = [[ 'Producto/Mercancía','Tipo de producto','Cantidad Total' ], [ 'Celulares','Electrónicos', '25' ]];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodAOA), 'Productos');
      // Nota de uso
      const notaAOA = [[
        'Instrucciones',
      ],[
        'Rellene las hojas Delincuentes y Productos. No cambie los títulos de las columnas ni los nombres de las hojas.'
      ],[
        'Las celdas numéricas (Edad, Cantidad Total, Cuantía) pueden estar en texto, el sistema las normaliza.'
      ]];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(notaAOA), 'LeerAntes');
      XLSX.writeFile(wb, 'plantilla-importacion-masiva.xlsx');
      showMsg('Plantilla descargada.', 'ok');
    }catch(e){
      console.error(e);
      showMsg('No se pudo generar la plantilla: '+(e?.message||e),'error');
    }
  }

  // Si no hay historial, pero sí existen 'delincuentes', copiar a 'delincuentesPersistentes'
  function syncHistorialSiVacio(){
    try {
      const histRaw = localStorage.getItem('delincuentesPersistentes');
      const delRaw = localStorage.getItem('delincuentes');
      const hist = histRaw ? JSON.parse(histRaw) : [];
      const del = delRaw ? JSON.parse(delRaw) : [];
      if ((!hist || hist.length === 0) && Array.isArray(del) && del.length > 0) {
        localStorage.setItem('delincuentesPersistentes', JSON.stringify(del));
        if (typeof window.renderizarTablaHistorialDelincuentes === 'function') window.renderizarTablaHistorialDelincuentes();
        showMsg('Se sincronizó el historial desde los delincuentes existentes.', 'ok');
      }
    } catch (e) { /* noop */ }
  }

  async function importar(){
    try{
      if (typeof window.importarDesdeExcel !== 'function') {
        showMsg('Función de importación no disponible. Verifique que persistencia-archivos.js esté cargado.','error');
        return;
      }
      await window.importarDesdeExcel();
      // Refrescar tablas si las funciones existen
      if (typeof window.renderizarTablaHistorialDelincuentes === 'function') window.renderizarTablaHistorialDelincuentes();
      if (typeof window.actualizarTablaProductos === 'function') window.actualizarTablaProductos();
      showMsg('Importación completada. Se actualizó el historial y el Top 20.','ok');
    }catch(e){
      console.error(e);
      showMsg('Error al importar: '+(e?.message||e),'error');
    }
  }

  function init(){
    const b1 = qs('btnDescargarPlantilla');
    const b2 = qs('btnImportarExcel');
    if (b1) b1.addEventListener('click', descargarPlantilla);
    if (b2) b2.addEventListener('click', importar);
    // Sincronizar historial si está vacío
    syncHistorialSiVacio();
    // Render inicial desde localStorage
    try { if (typeof window.renderizarTablaHistorialDelincuentes === 'function') window.renderizarTablaHistorialDelincuentes(); } catch{}
    try { if (typeof window.actualizarTablaProductos === 'function') window.actualizarTablaProductos(); } catch{}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
