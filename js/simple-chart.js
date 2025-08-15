/**
 * simple-chart.js
 * Una versión simplificada de Chart.js para el Formulario de Actividad Criminal
 */

// Crear un objeto global Chart
window.Chart = class Chart {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = config.data;
        this.options = config.options || {};
        
        // Inicializar el gráfico
        this.render();
        
        // Guardar referencia para poder destruirlo después
        this._chartInstance = this;
        
        return this;
    }
    
    // Método para renderizar el gráfico como una tabla HTML
    render() {
        if (!this.ctx || !this.ctx.parentNode) return;
        
        // Crear una tabla en lugar de un gráfico
        const container = this.ctx.parentNode;
        
        // Eliminar el canvas
        this.ctx.remove();
        
        // Crear tabla
        const table = document.createElement('table');
        table.className = 'table table-bordered table-striped';
        table.style.width = '100%';
        table.style.marginTop = '20px';
        
        // Crear encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Añadir encabezado para las categorías
        const thCategory = document.createElement('th');
        thCategory.textContent = 'Tipo de Delito';
        headerRow.appendChild(thCategory);
        
        // Añadir encabezados para cada dataset
        this.data.datasets.forEach(dataset => {
            const th = document.createElement('th');
            th.textContent = dataset.label;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        // Añadir filas para cada etiqueta
        this.data.labels.forEach((label, i) => {
            const row = document.createElement('tr');
            
            // Añadir celda para la categoría
            const tdCategory = document.createElement('td');
            tdCategory.textContent = label;
            row.appendChild(tdCategory);
            
            // Añadir celdas para cada dataset
            this.data.datasets.forEach(dataset => {
                const td = document.createElement('td');
                const value = dataset.data[i];
                
                // Formatear valor si es monetario
                if (dataset.label.includes('Cuantía')) {
                    td.textContent = formatearMoneda ? formatearMoneda(value) : `B/. ${value.toFixed(2)}`;
                } else {
                    td.textContent = value;
                }
                
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        
        // Añadir título si está configurado
        if (this.options.plugins && this.options.plugins.title && this.options.plugins.title.display) {
            const title = document.createElement('h4');
            title.textContent = this.options.plugins.title.text;
            title.style.textAlign = 'center';
            title.style.marginBottom = '15px';
            container.appendChild(title);
        }
        
        // Añadir la tabla al contenedor
        container.appendChild(table);
    }
    
    // Método para actualizar el gráfico
    update() {
        // En esta versión simplificada, volvemos a renderizar la tabla
        const container = this.ctx.parentNode;
        if (container) {
            // Limpiar el contenedor
            container.innerHTML = '';
            
            // Recrear el canvas
            this.ctx = document.createElement('canvas');
            container.appendChild(this.ctx);
            
            // Volver a renderizar
            this.render();
        }
    }
    
    // Método para destruir el gráfico
    destroy() {
        // Simplemente eliminar referencias
        this._chartInstance = null;
    }
};
