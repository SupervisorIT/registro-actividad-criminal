// Formateo tolerante de cédula de Panamá
// - Inserta guiones si el usuario no los escribe
// - Soporta prefijos de letras (p. ej., E, N, PE)
// - Aplica heurísticas comunes de agrupación de dígitos
(function(){
  'use strict';

  function limpiar(str){
    return (str || '').toString().trim().replace(/\s+/g, ' ');
  }

  function yaFormateadaValida(s){
    // Acepta patrones comunes: XXX-XXXX-XXXX con posibles prefijos de 1-2 letras
    const re = /^(?:[A-Z]{1,2}-)?\d{1,2}-\d{3,4}-\d{3,6}$/i;
    return re.test(s);
  }

  function extraerPrefijoYDigitos(s){
    const upper = s.toUpperCase();
    const match = upper.match(/^([A-Z]{1,2})?(.*)$/);
    const prefix = (match && match[1]) ? match[1] : '';
    const digits = (match ? match[2] : upper).replace(/[^\d]/g, '');
    return { prefix, digits };
  }

  function agruparDigitos(d){
    // Heurísticas frecuentes en Panamá (3 bloques):
    // 7 => 1-3-3
    // 8 => 1-4-3
    // 9 => 1-4-4
    // 10 => 2-4-4
    const len = d.length;
    if (len === 7) return [d.slice(0,1), d.slice(1,4), d.slice(4)];
    if (len === 8) return [d.slice(0,1), d.slice(1,5), d.slice(5)];
    if (len === 9) return [d.slice(0,1), d.slice(1,5), d.slice(5)];
    if (len === 10) return [d.slice(0,2), d.slice(2,6), d.slice(6)];
    // Fallback genérico: intenta 1-4-rest si hay suficiente
    if (len > 4) return [d.slice(0,1), d.slice(1,5), d.slice(5)];
    return [d];
  }

  function formatearCedulaPanama(valor){
    const s = limpiar(valor).toUpperCase();
    if (!s) return s;

    // Si ya está formateada (con guiones) y coincide patrón, respetar
    if (s.includes('-') && yaFormateadaValida(s)) return s;

    const { prefix, digits } = extraerPrefijoYDigitos(s.replace(/-/g, ''));
    if (!digits) return s; // no hay dígitos, devolver original

    const grupos = agruparDigitos(digits);
    // Si no se pudo agrupar razonablemente, devolver original
    if (!grupos || grupos.length < 1) return s;

    const partes = prefix ? [prefix, ...grupos] : grupos;
    return partes.join('-');
  }

  function onBlurFormat(e){
    const t = e.target;
    if (!(t && t.classList && t.classList.contains('cedula-input'))) return;
    const previo = t.value;
    const nuevo = formatearCedulaPanama(previo);
    if (nuevo && nuevo !== previo) {
      t.value = nuevo;
      // Disparar change si el valor cambió para que la lógica existente detecte actualización
      const ev = new Event('change', { bubbles: true });
      t.dispatchEvent(ev);
    }
  }

  // Delegación para cubrir inputs dinámicos
  document.addEventListener('blur', onBlurFormat, true);

  // Formateo inmediato al cargar si existen valores prellenados
  window.addEventListener('DOMContentLoaded', function(){
    try {
      document.querySelectorAll('.cedula-input').forEach(function(el){
        if (el && el.value) {
          const nuevo = formatearCedulaPanama(el.value);
          if (nuevo && nuevo !== el.value) el.value = nuevo;
        }
      });
    } catch(e) { /* noop */ }
  });

  // Exponer para posibles pruebas manuales desde consola
  window.formatearCedulaPanama = formatearCedulaPanama;
})();
