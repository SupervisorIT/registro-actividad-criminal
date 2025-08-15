// Limpieza directa de delincuentes persistentes
window.limpiarDelincuentesPersistentes = function() {
  if (confirm('¿Está seguro que desea borrar todo el historial de delincuentes? Esta acción no se puede deshacer.')) {
    localStorage.removeItem('delincuentesPersistentes');
    // Limpieza visual
    var tabla = document.getElementById('tablaDelincuentesPersistentes');
    if (tabla) {
      var tbody = tabla.querySelector('tbody');
      if (tbody) tbody.innerHTML = '';
    }
    if (typeof renderizarTablaHistorialDelincuentes === 'function') {
      renderizarTablaHistorialDelincuentes();
    }
    if (typeof mostrarNotificacion === 'function') {
      mostrarNotificacion('Historial de delincuentes eliminado correctamente.', 'success');
    } else {
      alert('Historial de delincuentes eliminado correctamente.');
    }
  }
};

// Limpieza directa de productos robados
window.limpiarProductosRobados = function() {
  if (confirm('¿Está seguro que desea borrar el Top 20 de productos robados? Esta acción no se puede deshacer.')) {
    // Limpiar almacenamiento y variables globales
    localStorage.removeItem('productosRobados');
    window.productosRobados = [];
    // Si existe, guardar el arreglo vacío en storage
    if (typeof guardarProductosRobados === 'function') {
      guardarProductosRobados();
    }
    var tabla = document.getElementById('tablaProductos');
    if (tabla) {
      var tbody = tabla.querySelector('tbody');
      if (tbody) tbody.innerHTML = '';
      var total = tabla.querySelector('#totalCantidadProductos');
      if (total) total.textContent = '0';
    }
    if (typeof actualizarTablaProductos === 'function') {
      actualizarTablaProductos();
    }
    if (typeof mostrarNotificacion === 'function') {
      mostrarNotificacion('Top 20 de productos robados eliminado correctamente.', 'success');
    } else {
      alert('Top 20 de productos robados eliminado correctamente.');
    }
  }
};

window.abrirModalAuthLimpiar = function(tipo) {
  var modal = document.getElementById('modalAuthLimpiar');
  modal.style.display = 'flex';
  modal.style.setProperty('display', 'flex', 'important');
  document.getElementById('authUser').value = '';
  document.getElementById('authPass').value = '';
  document.getElementById('authMsg').style.display = 'none';
  document.getElementById('tipoLimpieza').value = tipo;
  // Cambia el título del modal según el tipo
  var titulo = 'Autenticación de administrador';
  if (tipo === 'delincuentes') titulo = 'Autenticación para limpiar delincuentes';
  if (tipo === 'productos') titulo = 'Autenticación para limpiar productos robados';
  document.getElementById('modalAuthLimpiarTitulo').textContent = titulo;
  setTimeout(function() {
    document.getElementById('authUser').focus();
  }, 100);
};

window.cerrarModalAuthLimpiar = function() {
  document.getElementById('modalAuthLimpiar').style.display = 'none';
};

window.autenticarYLimpiar = function() {
  var usuario = document.getElementById('authUser').value.trim();
  var password = document.getElementById('authPass').value;
  var tipo = document.getElementById('tipoLimpieza').value;
  var adminUser = 'admin';
  var adminPass = 'admin123';
  var msg = document.getElementById('authMsg');
  if (usuario === adminUser && password === adminPass) {
    if (tipo === 'delincuentes') {
      if (confirm('¿Está seguro que desea borrar todo el historial de delincuentes? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('delincuentes');
        localStorage.removeItem('delincuentesPersistentes');
        if (typeof renderizarTablaHistorialDelincuentes === 'function') {
          renderizarTablaHistorialDelincuentes();
        }
        if (typeof mostrarNotificacion === 'function') {
          mostrarNotificacion('Historial de delincuentes eliminado correctamente.', 'success');
        } else {
          alert('Historial de delincuentes eliminado correctamente.');
        }
        cerrarModalAuthLimpiar();
      }
    } else if (tipo === 'productos') {
      if (confirm('¿Está seguro que desea borrar el Top 20 de productos robados? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('productosRobados');
        // Limpiar visualmente la tabla de productos robados
        if (typeof actualizarTablaProductos === 'function') {
          actualizarTablaProductos();
        } else {
          // Limpieza forzada si la función no existe
          var tabla = document.getElementById('tablaProductos');
          if (tabla) {
            var tbody = tabla.querySelector('tbody');
            if (tbody) tbody.innerHTML = '';
            // Actualizar el total en el pie de tabla, si existe
            var total = tabla.querySelector('#totalCantidadProductos');
            if (total) total.textContent = '0';
          }
        }
        if (typeof mostrarNotificacion === 'function') {
          mostrarNotificacion('Top 20 de productos robados eliminado correctamente.', 'success');
        } else {
          alert('Top 20 de productos robados eliminado correctamente.');
        }
        cerrarModalAuthLimpiar();
      }
    }
  } else {
    msg.textContent = 'Usuario o contraseña incorrectos.';
    msg.style.display = 'block';
    setTimeout(function() {
        if (!password) return;
        var adminUser = 'admin';
        var adminPass = 'admin123';
        if (usuario === adminUser && password === adminPass) {
            if (confirm('¿Está seguro que desea borrar todo el historial de delincuentes? Esta acción no se puede deshacer.')) {
                localStorage.removeItem('delincuentesPersistentes');
                if (typeof renderizarTablaHistorialDelincuentes === 'function') {
                    renderizarTablaHistorialDelincuentes();
                }
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion('Historial de delincuentes eliminado correctamente.', 'success');
                } else {
                    alert('Historial de delincuentes eliminado correctamente.');
                }
            }
        } else {
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('Usuario o contraseña incorrectos.', 'error');
            } else {
                alert('Usuario o contraseña incorrectos.');
            }
        }
    }, 1000);
  };
};
