// Tabla de delincuentes en memoria (sin persistencia)
let delincuentesMemoria = [];

function renderizarTablaDelincuentesMemoria() {
    const tbody = document.getElementById('tbodyDelincuentesMemoria');
    tbody.innerHTML = '';
    if (delincuentesMemoria.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="text-align:center;">No hay delincuentes registrados</td>';
        tbody.appendChild(tr);
        return;
    }
    delincuentesMemoria.forEach((d, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${d.nombre}</td>
            <td>${d.cedula}</td>
            <td>${d.edad}</td>
            <td>${d.delito}</td>
            <td>${d.denuncia}</td>
            <td><button class="btn btn-danger btn-sm" onclick="eliminarDelincuenteMemoria(${i})">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalNuevoDelincuenteMemoria() {
    document.getElementById('modalNuevoDelincuenteMemoria').style.display = 'block';
    document.getElementById('formNuevoDelincuenteMemoria').reset();
}

function cerrarModalNuevoDelincuenteMemoria() {
    document.getElementById('modalNuevoDelincuenteMemoria').style.display = 'none';
}

function guardarNuevoDelincuenteMemoria() {
    const form = document.getElementById('formNuevoDelincuenteMemoria');
    const nuevo = {
        nombre: form.nombre.value.trim(),
        cedula: form.cedula.value.trim(),
        edad: form.edad.value.trim(),
        delito: form.delito.value.trim(),
        cuantia: form.cuantia ? form.cuantia.value.trim() : '',
        denuncia: form.denuncia.value.trim()
    };
    delincuentesMemoria.push(nuevo);
    cerrarModalNuevoDelincuenteMemoria();
    renderizarTablaDelincuentesMemoria();

    // También registrar en el historial persistente usando la lógica centralizada
    if (typeof window.agregarAlHistorial === 'function') {
        // El historial espera los nombres exactos del formulario principal
        const delincuenteHistorial = {
            nombreCompleto: nuevo.nombre,
            cedula: nuevo.cedula,
            edad: nuevo.edad,
            delito: nuevo.delito,
            monto: nuevo.cuantia,
            denuncia: nuevo.denuncia
        };
        window.agregarAlHistorial(delincuenteHistorial);
    }

}

function eliminarDelincuenteMemoria(idx) {
    delincuentesMemoria.splice(idx, 1);
    renderizarTablaDelincuentesMemoria();
}

function limpiarDelincuentesMemoria() {
    delincuentesMemoria = [];
    renderizarTablaDelincuentesMemoria();
}

document.addEventListener('DOMContentLoaded', renderizarTablaDelincuentesMemoria);
