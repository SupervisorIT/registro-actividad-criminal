// Script para manejar el Top 20 de Productos y Mercancías Robadas de forma persistente
// Este script almacena los datos en localStorage para mantenerlos incluso al recargar la página o cambiar de usuario

// Estructura global para almacenar los productos
let productosRobados = [];
let ultimosValores = {}; // Para rastrear cambios reales

// Función para cargar los productos desde localStorage
function cargarProductosRobados() {
    try {
        const productosGuardados = localStorage.getItem('productosRobados');
        if (productosGuardados) {
            productosRobados = JSON.parse(productosGuardados);
            console.log(`Cargados ${productosRobados.length} productos del almacenamiento local`);
        } else {
            console.log('No hay productos guardados en el almacenamiento local');
            productosRobados = [];
        }
    } catch (error) {
        console.error('Error al cargar productos del almacenamiento local:', error);
        productosRobados = [];
    }
}

// Función para guardar los productos en localStorage
function guardarProductosRobados() {
    try {
        localStorage.setItem('productosRobados', JSON.stringify(productosRobados));
        console.log(`Guardados ${productosRobados.length} productos en el almacenamiento local`);
    } catch (error) {
        console.error('Error al guardar productos en el almacenamiento local:', error);
    }
}

// Función para agregar o actualizar un producto en la lista
function agregarProductoRobado(nombre, cantidad, valor) {
    // Validar que tengamos un nombre de producto válido
    if (!nombre || nombre.trim() === '') {
        console.error('Error: Nombre de producto vacío');
        return;
    }
    
    // Convertir a números y validar
    cantidad = parseInt(cantidad) || 0;
    valor = parseFloat(valor) || 0;
    
    // Si la cantidad es 0, no agregar
    if (cantidad === 0) {
        console.error('Error: Cantidad es 0, no se agregará el producto');
        return;
    }
    
    // Normalizar el nombre del producto (quitar espacios extras)
    const nombreNormalizado = nombre.trim();
    
    console.log(`Agregando producto: "${nombreNormalizado}", cantidad: ${cantidad}, valor: ${valor}`);
    
    // Buscar si el producto ya existe
    let productoExistente = null;
    
    // Buscar por nombre exacto primero
    for (const producto of productosRobados) {
        if (producto.nombre === nombreNormalizado) {
            productoExistente = producto;
            break;
        }
    }
    
    // Si no se encontró, buscar ignorando mayúsculas/minúsculas
    if (!productoExistente) {
        const nombreLower = nombreNormalizado.toLowerCase();
        for (const producto of productosRobados) {
            if (producto.nombre.toLowerCase() === nombreLower) {
                productoExistente = producto;
                break;
            }
        }
    }
    
    if (productoExistente) {
        // Actualizar producto existente
        productoExistente.cantidad += cantidad;
        console.log(`Producto existente actualizado: ${productoExistente.nombre}, nueva cantidad total: ${productoExistente.cantidad}`);
    } else {
        // Agregar nuevo producto
        productosRobados.push({
            nombre: nombreNormalizado,
            cantidad: cantidad,
            valor: valor
        });
        console.log(`Nuevo producto agregado: ${nombreNormalizado}, cantidad: ${cantidad}`);
    }
    
    // Guardar los cambios
    guardarProductosRobados();
    
    // Actualizar la tabla
    actualizarTablaProductos();
}

// Función para limpiar todos los productos y reiniciar
function limpiarProductos() {
    console.log('Limpiando todos los productos...');
    productosRobados = [];
    localStorage.removeItem('productosRobados');
    actualizarTablaProductos();
    console.log('Productos limpiados correctamente');
}

// Cargar productos al inicio
cargarProductosRobados();

// Actualizar la tabla de productos
actualizarTablaProductos();

// Función para consolidar productos similares
function consolidarProductosSimilares() {
    if (productosRobados.length <= 1) return; // No hay nada que consolidar
    
    console.log('Iniciando consolidación de productos similares...');
    let cambiosRealizados = false;
    
    // Crear una copia del array para iterar
    const productos = [...productosRobados];
    
    // Recorrer cada producto
    for (let i = 0; i < productos.length; i++) {
        const producto1 = productos[i];
        const nombre1 = producto1.nombre.toLowerCase().trim();
        
        // Comparar con los demás productos
        for (let j = i + 1; j < productos.length; j++) {
            const producto2 = productos[j];
            const nombre2 = producto2.nombre.toLowerCase().trim();
            
            // Verificar si son similares (uno es prefijo del otro o viceversa)
            if (nombre1.startsWith(nombre2) || nombre2.startsWith(nombre1)) {
                console.log(`Productos similares encontrados: "${producto1.nombre}" y "${producto2.nombre}"`);
                
                // Determinar cuál nombre conservar (el más largo generalmente es el más completo)
                const nombreFinal = nombre1.length >= nombre2.length ? producto1.nombre : producto2.nombre;
                
                // Sumar cantidades y valores
                const cantidadTotal = producto1.cantidad + producto2.cantidad;
                const valorTotal = producto1.valor + producto2.valor;
                
                console.log(`Consolidando en "${nombreFinal}" con cantidad: ${cantidadTotal}, valor: ${valorTotal}`);
                
                // Eliminar ambos productos del array original
                productosRobados = productosRobados.filter(p => 
                    p.nombre !== producto1.nombre && p.nombre !== producto2.nombre);
                
                // Agregar el producto consolidado
                productosRobados.push({
                    nombre: nombreFinal,
                    cantidad: cantidadTotal,
                    valor: valorTotal
                });
                
                cambiosRealizados = true;
                
                // Como hemos modificado el array, debemos reiniciar la consolidación
                break;
            }
        }
        
        // Si se realizaron cambios, reiniciar el proceso de consolidación
        if (cambiosRealizados) {
            return consolidarProductosSimilares(); // Llamada recursiva
        }
    }
    
    if (cambiosRealizados) {
        console.log('Consolidación completada. Guardando cambios...');
        guardarProductosRobados();
        actualizarTablaProductos();
    } else {
        console.log('No se encontraron productos similares para consolidar');
    }
}

// Función para eliminar o reducir un producto del Top 20
function eliminarProductoRobado(nombre, cantidad, valor) {
    if (!nombre || nombre.trim() === '') return;
    
    // Convertir a números
    cantidad = parseInt(cantidad) || 0;
    valor = parseFloat(valor) || 0;
    
    // Si la cantidad es 0, no hacer nada
    if (cantidad === 0) return;
    
    console.log(`Eliminando producto: ${nombre}, cantidad: ${cantidad}, valor: ${valor}`);
    
    // Normalizar el nombre del producto
    const nombreNormalizado = nombre.trim().toLowerCase();
    
    // Buscar el producto en la lista
    let productoExistente = productosRobados.find(p => p.nombre.toLowerCase() === nombreNormalizado);
    
    // Si no encontramos coincidencia exacta, buscar por prefijo
    if (!productoExistente) {
        productoExistente = productosRobados.find(p => {
            const pNombre = p.nombre.toLowerCase();
            return pNombre.startsWith(nombreNormalizado) || nombreNormalizado.startsWith(pNombre);
        });
    }
    
    if (productoExistente) {
        // Reducir cantidad y valor
        productoExistente.cantidad -= cantidad;
        productoExistente.valor -= valor;
        
        // Si la cantidad llega a 0 o menos, eliminar el producto
        if (productoExistente.cantidad <= 0) {
            productosRobados = productosRobados.filter(p => p !== productoExistente);
            console.log(`Producto eliminado completamente: ${productoExistente.nombre}`);
        } else {
            console.log(`Producto reducido: ${productoExistente.nombre}, nueva cantidad: ${productoExistente.cantidad}, nuevo valor: ${productoExistente.valor}`);
        }
        
        // Guardar cambios
        guardarProductosRobados();
        
        // Actualizar la tabla
        actualizarTablaProductos();
    }
}

// Función para eliminar una fila de caso delictivo
function eliminarFilaCasoDelictivo(boton) {
    // Encontrar la fila que contiene el botón
    const fila = boton.closest('tr');
    if (!fila) return;
    
    // Obtener los datos del producto antes de eliminar la fila
    const cantidadInput = fila.querySelector('input[name="cantidad[]"]');
    const cuantiaInput = fila.querySelector('input[name="cuantia[]"]');
    const productoInput = fila.querySelector('input[name="producto[]"]');
    
    if (productoInput && cantidadInput && cuantiaInput) {
        const producto = productoInput.value.trim();
        const cantidad = parseInt(cantidadInput.value) || 0;
        const cuantia = parseFloat(cuantiaInput.value.replace(/[^\d.-]/g, '')) || 0;
        
        // Eliminar o reducir el producto del Top 20
        eliminarProductoRobado(producto, cantidad, cuantia);
    }
    
    // Eliminar la fila
    fila.remove();
    
    // Recalcular totales
    if (typeof calcularTotalCasosDelictivos === 'function') {
        calcularTotalCasosDelictivos();
    }
}

// Función para actualizar la tabla de productos
function actualizarTablaProductos() {
    console.log('Actualizando tabla de productos...', productosRobados);
    
    // Ordenar productos por cantidad (de mayor a menor)
    const productosOrdenados = [...productosRobados].sort((a, b) => b.cantidad - a.cantidad);
    
    // Limitar a los 20 primeros
    const top20 = productosOrdenados.slice(0, 20);
    console.log('Top 20 productos ordenados:', top20);
    
    // Calcular totales de los productos mostrados en el Top 20
    let totalCantidad = 0;
    
    // Sumar directamente las cantidades de los productos en el Top 20
    top20.forEach(producto => {
        // Asegurar que los valores sean números válidos
        const cantidad = parseInt(producto.cantidad) || 0;
        totalCantidad += cantidad;
    });
    
    // Limpiar todas las filas primero
    for (let i = 1; i <= 20; i++) {
        const nombreProducto = document.getElementById(`nombre-${i}`);
        const cantidadProducto = document.getElementById(`cantidad-${i}`);
        
        if (nombreProducto) nombreProducto.textContent = '';
        if (cantidadProducto) cantidadProducto.textContent = '';
    }
    
    // Actualizar solo las filas que tienen productos
    for (let i = 0; i < top20.length; i++) {
        const producto = top20[i];
        const filaIndex = i + 1; // Las filas empiezan en 1
        
        const nombreProducto = document.getElementById(`nombre-${filaIndex}`);
        const cantidadProducto = document.getElementById(`cantidad-${filaIndex}`);
        
        if (nombreProducto) nombreProducto.textContent = producto.nombre || '';
        if (cantidadProducto) cantidadProducto.textContent = producto.cantidad || '';
    }
    
    // Actualizar total
    const totalElement = document.getElementById('totalCantidadProductos');
    if (totalElement) {
        totalElement.textContent = totalCantidad;
    }
}

// Función para procesar un nuevo caso delictivo
function procesarNuevoCasoDelictivo(fila) {
    try {
        if (!fila) {
            console.error('Error: No se proporcionó una fila válida');
            return false;
        }
        
        // Verificar si la fila ya fue procesada recientemente
        if (fila.dataset.procesado === 'true') {
            const tiempoTranscurrido = Date.now() - parseInt(fila.dataset.tiempoProcesado || 0);
            if (tiempoTranscurrido < 1000) { // Si fue procesada hace menos de 1 segundo
                console.log('Fila ya procesada recientemente, ignorando para evitar duplicación');
                return false;
            }
        }
        
        const celdas = fila.querySelectorAll('td');
        // Verificar si hay suficientes celdas, pero no mostrar error si no las hay
        // ya que podría ser una fila vacía o de otro tipo
        if (celdas.length < 6) {
            return false; // Simplemente salimos sin procesar esta fila
        }
        
        // Basado en la estructura de la tabla:
        // 0: Tipificación, 1: Fecha, 2: Cantidad, 3: Cuantía, 4: Denuncias, 5: Producto/Mercancía
        const cantidadInput = celdas[2].querySelector('input');
        const cuantiaInput = celdas[3].querySelector('input');
        const productoInput = celdas[5].querySelector('input');
        
        if (!cantidadInput || !cuantiaInput || !productoInput) {
            console.error('Error: No se encontraron todos los inputs necesarios');
            return false;
        }
        
        // Obtener los valores directamente de los inputs
        const cantidadValor = cantidadInput.value.trim();
        const cuantiaValor = cuantiaInput.value.trim();
        const productoValor = productoInput.value.trim();
        
        // Validar que tengamos datos válidos
        if (!productoValor) {
            console.error('Error: Nombre de producto vacío');
            return false;
        }
        
        // Convertir a números
        const cantidad = parseInt(cantidadValor) || 0;
        
        // Validar cantidad
        if (cantidad <= 0) {
            console.error('Error: Cantidad debe ser mayor a 0');
            return false;
        }
        
        // Procesar cuantía
        let cuantia = 0;
        if (cuantiaValor) {
            // Limpiar el valor de cuantía (puede tener formato de moneda)
            const cuantiaLimpia = cuantiaValor.replace(/[^\d.-]/g, '');
            cuantia = parseFloat(cuantiaLimpia) || 0;
        }
        
        console.log(`Procesando nuevo caso: Producto=${productoValor}, Cantidad=${cantidad}, Cuantía=${cuantia}`);
        
        // Marcar la fila como procesada con timestamp
        fila.dataset.procesado = 'true';
        fila.dataset.tiempoProcesado = Date.now().toString();
        
        // Agregar producto a la lista
        agregarProductoRobado(productoValor, cantidad, cuantia);
        
        // Actualizar la tabla de productos
        actualizarTablaProductos();
        
        return true;
    } catch (error) {
        console.error('Error al procesar caso delictivo:', error);
        return false;
    }
}

// Función auxiliar para formatear números con comas
function formatearNumeroConComas(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Función para limpiar todos los productos
function limpiarProductos() {
    if (confirm('¿Está seguro de que desea limpiar el Top 20 de Productos y Mercancías Robadas?')) {
        productosRobados = [];
        guardarProductosRobados();
        actualizarTablaProductos();
        console.log('Todos los productos han sido eliminados');
        alert('El Top 20 de Productos y Mercancías Robadas ha sido limpiado completamente');
    }
}

// Función para limpiar productos sin confirmación (para uso interno)
function limpiarProductosSinConfirmacion() {
    productosRobados = [];
    guardarProductosRobados();
    actualizarTablaProductos();
    console.log('Todos los productos han sido eliminados (sin confirmación)');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema de productos robados persistentes');
    
    // Cargar productos guardados
    cargarProductosRobados();
    
    // Consolidar productos similares al iniciar
    consolidarProductosSimilares();
    
    // Actualizar la tabla
    actualizarTablaProductos();
    
    // Agregar listener para los botones de agregar caso (botón verde +)
    document.addEventListener('click', function(e) {
        // Verificar si es un botón de agregar (clase btn-success)
        if (e.target && e.target.classList.contains('btn-success')) {
            console.log('Botón de agregar caso detectado');
            
            // Encontrar la fila padre
            let fila = e.target.closest('tr');
            if (fila) {
                // Procesar el caso delictivo
                procesarNuevoCasoDelictivo(fila);
            }
        }
        
        // Verificar si es un botón de eliminar (clase btn-danger)
        if (e.target && e.target.classList.contains('btn-danger')) {
            console.log('Botón de eliminar caso detectado');
            
            // Eliminar la fila
            eliminarFilaCasoDelictivo(e.target);
        }
    });
    
    // Eliminamos el listener para los inputs que procesaba automáticamente
    // para evitar duplicaciones y solo procesar cuando se presiona el botón +
    
    // Agregar botones para actualizar y limpiar
    const actionsContainer = document.querySelector('.actions-container');
    // Se han eliminado los botones de Actualizar Top 20, Consolidar Productos Similares y Limpiar Top 20
    // La actualización del Top 20 ahora se realiza automáticamente al agregar o modificar casos
});
