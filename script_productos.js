// Función para actualizar las opciones de mercancías robadas
function actualizarMercanciasRobadas(select) {
    // Guardar la opción seleccionada actual
    const valorSeleccionado = select.value;
    
    // Limpiar las opciones actuales
    select.innerHTML = '<option value="">Seleccione...</option>';
    
    // Agregar las opciones de productos robados
    window.productosRobados.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.nombre;
        option.textContent = producto.nombre;
        select.appendChild(option);
    });
    
    // Restaurar la opción seleccionada si existe
    if (valorSeleccionado) {
        select.value = valorSeleccionado;
    }
}

// Actualizar los selectores cuando se cargue la página o se modifique la lista de productos
document.addEventListener('DOMContentLoaded', function() {
    const selectores = document.getElementsByName('mercancias[]');
    selectores.forEach(select => actualizarMercanciasRobadas(select));
    
    // Agregar listener para actualizar selectores cuando cambie la lista de productos
    document.addEventListener('productosActualizados', function() {
        selectores.forEach(select => actualizarMercanciasRobadas(select));
    });
});

function guardarProductosRobados() {
    localStorage.setItem('productosRobados', JSON.stringify(window.productosRobados));
    // Disparar evento personalizado
    document.dispatchEvent(new Event('productosActualizados'));
}

// Definir las categorías y sus productos comunes
const categoriaProductos = {
    'Electrónicos': ['Celular', 'Tablet', 'Laptop', 'Audífonos', 'Cargador', 'Otro'],
    'Alimentos': ['Enlatados', 'Bebidas', 'Snacks', 'Carnes', 'Lácteos', 'Otro'],
    'Ropa': ['Camisas', 'Pantalones', 'Zapatos', 'Accesorios', 'Otro'],
    'Hogar': ['Electrodomésticos', 'Muebles', 'Decoración', 'Otro'],
    'Herramientas': ['Manuales', 'Eléctricas', 'Construcción', 'Otro'],
    'Otro': ['Especificar']
};

function actualizarSubcategorias(select) {
    const categoria = select.value;
    const subcategoriaSelect = select.parentElement.nextElementSibling.querySelector('select');
    
    // Limpiar opciones actuales
    subcategoriaSelect.innerHTML = '';
    
    // Si no hay categoría seleccionada, deshabilitar subcategoría
    if (!categoria) {
        subcategoriaSelect.disabled = true;
        subcategoriaSelect.innerHTML = '<option value="">Seleccione primero una categoría</option>';
        return;
    }
    
    // Habilitar subcategoría y agregar opciones
    subcategoriaSelect.disabled = false;
    
    // Obtener productos para la categoría seleccionada
    const productos = categoriaProductos[categoria] || [];
    
    // Agregar opciones
    productos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto;
        option.textContent = producto;
        subcategoriaSelect.appendChild(option);
    });
    
    // Seleccionar la primera opción
    if (productos.length > 0) {
        subcategoriaSelect.value = productos[0];
    }
}

// Solo crear fila vacía al dar al +, no agregar ni sumar en el Top 20
function agregarFilaProductoSoloVisual() {
    // Encuentra la tabla de casos delictivos
    const tabla = document.getElementById('tablaCasosDelictivos');
    if (!tabla) return;
    const tbody = tabla.querySelector('tbody');
    if (!tbody) return;
    // Encuentra la primera fila editable (sin clase ni id especial, solo la estructura base)
    const filas = tbody.querySelectorAll('tr');
    let filaReferencia = null;
    for (let i = 0; i < filas.length; i++) {
        // Busca la fila que tiene inputs (editable)
        if (filas[i].querySelector('input')) {
            filaReferencia = filas[i];
            break;
        }
    }
    if (!filaReferencia) return;
    // Clona la fila editable
    const nuevaFila = filaReferencia.cloneNode(true);
    // Limpia los valores y defaultValue de los inputs
    const inputs = nuevaFila.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.type === 'text' || input.type === 'number') {
            input.value = '';
            input.defaultValue = '';
        }
        // Si es observaciones, eliminar cualquier valor y evitar disparar onchange
        if (input.name === 'observaciones[]') {
            input.value = '';
            input.defaultValue = '';
        }
    });
    // Inserta la nueva fila antes de la fila de totales si existe
    const filaTotal = tbody.querySelector('.total-row');
    if (filaTotal) {
        tbody.insertBefore(nuevaFila, filaTotal);
    } else {
        tbody.appendChild(nuevaFila);
    }
}


function actualizarProductosRobados(input) {
    // Obtener el valor del input
    const valor = input.value.trim();
    
    // Si está vacío, no hacer nada
    if (!valor) return;
    
    // Verificar si el producto ya existe
    const productoExistente = window.productosRobados.find(p => p.nombre.toLowerCase() === valor.toLowerCase());
    
    if (!productoExistente) {
        // Agregar el nuevo producto
        window.productosRobados.push({
            nombre: valor,
            cantidad: 1,
            valor: 'B/. 0.00'
        });
        
        // Mostrar notificación
        mostrarNotificacion(`Se agregó ${valor} a la lista`, 'success');
    } else {
        // Incrementar la cantidad del producto existente
        const cantidadActual = parseInt(productoExistente.cantidad) || 0;
        productoExistente.cantidad = cantidadActual + 1;
        
        // Mostrar notificación
        mostrarNotificacion(`Se agregó 1 unidad más de ${valor}. Total: ${productoExistente.cantidad}`, 'success');
    }
    
    // Ordenar la lista por cantidad (de mayor a menor)
    window.productosRobados.sort((a, b) => {
        const cantidadA = parseInt(a.cantidad) || 0;
        const cantidadB = parseInt(b.cantidad) || 0;
        return cantidadB - cantidadA;
    });
    
    // Guardar y actualizar la lista
    guardarProductosRobados();
    actualizarListaProductos();
    
    // Limpiar el input
    input.value = '';
}

// Función para formatear números con separadores de miles y decimales
function formatearNumero(numero) {
    if (!numero) return '0';
    const num = parseFloat(numero);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-PA');
}

// Función para formatear el campo de monto
function formatearMontoInput(input) {
    // Obtener el valor actual y limpiarlo
    let valor = input.value.replace(/[^\d.-]/g, '');
    
    // Si está vacío, establecer a cero
    if (!valor) {
        input.value = 'B/. 0.00';
        return;
    }
    
    // Convertir a número
    const numero = parseFloat(valor);
    
    // Si no es un número válido, establecer a cero
    if (isNaN(numero)) {
        input.value = 'B/. 0.00';
        return;
    }
    
    // Formatear con separadores de miles y símbolo de moneda
    input.value = formatearMoneda(numero);
    
    // Disparar evento de cambio para actualizar cálculos
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
}

// Agregar event listeners para formateo automático
document.addEventListener('DOMContentLoaded', function() {
    const montoInputs = document.getElementsByClassName('monto-input');
    for (let input of montoInputs) {
        // Al enfocar, mostrar solo el número
        input.addEventListener('focus', function() {
            this.value = this.value.replace(/[^\d.-]/g, '');
        });
        
        // Al perder el foco, formatear
        input.addEventListener('blur', function() {
            formatearMontoInput(this);
        });
    }
});

// Función para agregar automáticamente al Top 20 al llenar Observaciones
function onObservacionCambio(input) {
    console.log('[LOG] onObservacionCambio llamado', input, 'valor:', input.value);
    // Buscar la fila correspondiente
    const fila = input.closest('tr');
    if (!fila) return;
    
    // Obtener valores
    const productoInput = fila.querySelector('input[name="producto[]"]');
    const cantidadInput = fila.querySelector('input[name="cantidad[]"]');
    const cuantiaInput = fila.querySelector('input[name="cuantia[]"]');
    const observacion = input.value.trim();
    
    if (!observacion) return; // No hacer nada si está vacío
    if (!productoInput) return;
    
    const producto = productoInput.value.trim();
    const cantidad = cantidadInput ? (parseInt(cantidadInput.value) || 0) : 1;
    const cuantia = cuantiaInput ? (parseFloat(cuantiaInput.value.replace(/[^\d.-]/g, '')) || 0) : 0;
    
    // Siempre agregar el producto al Top 20 cuando se ingresa una observación
    if (producto && cantidad > 0) {
        console.log('[LOG] Agregando producto al Top 20:', producto, 'Cantidad:', cantidad, 'Cuantía:', cuantia);
        if (typeof window.agregarProductoRobado === 'function') {
            window.agregarProductoRobado(producto, cantidad, cuantia);
        } else {
            mostrarNotificacion('No se pudo agregar el producto al Top 20. Función no encontrada.', 'error');
        }
    }
}


// Función para actualizar la lista de productos
// Modificada: ya no agrega productos al Top 20 ni localStorage al dar al +
function actualizarListaProductos() {
    const listaProductos = document.getElementById('listaProductos');
    listaProductos.innerHTML = '';
    
    if (window.productosRobados.length === 0) {
        // Si no hay productos, mostrar una fila vacía
        const row = document.createElement('div');
        row.className = 'producto-row';
        
        row.innerHTML = `
            <input type="text" class="form-control producto-input" placeholder="Producto">
            <input type="text" class="form-control producto-input" placeholder="Cantidad">
            <input type="text" class="form-control producto-input monto-input" placeholder="Valor"
                   onfocus="this.value = this.value.replace(/[^\\d.]/g, '')"
                   onblur="formatearMontoInput(this)">
            <button type="button" class="btn btn-danger btn-sm" style="visibility: hidden;">X</button>
        `;
        
        listaProductos.appendChild(row);
        return;
    }
    
    window.productosRobados.forEach((producto, index) => {
        const row = document.createElement('div');
        row.className = 'producto-row';
        
        row.innerHTML = `
            <input type="text" class="form-control producto-input" value="${producto.nombre || ''}" 
                   onchange="actualizarProducto(${index}, 'nombre', this.value)">
            <input type="text" class="form-control producto-input" value="${producto.cantidad || ''}" 
                   onchange="actualizarProducto(${index}, 'cantidad', this.value)">
            <input type="text" class="form-control producto-input monto-input" value="${producto.valor || ''}" 
                   onchange="actualizarProducto(${index}, 'valor', this.value)"
                   onfocus="this.value = this.value.replace(/[^\\d.]/g, '')"
                   onblur="formatearMontoInput(this)">
            <button type="button" class="btn btn-danger btn-sm" onclick="eliminarProducto(${index})" style="padding: 2px 6px; font-size: 12px;">X</button>
        `;
        
        listaProductos.appendChild(row);
    });
    
    actualizarBotonAgregar();
}
