// public/js/facturacion.js (Versión Corregida y Mejorada)

// Se importa 'mostrarModalMensaje' para una UI consistente.
import { fetchAPI, initUtils, mostrarModalMensaje } from './utils.js';
import { API_URL } from './config.js';
document.addEventListener('DOMContentLoaded', () => {
    // Se inicializan las utilidades de los modales genéricos una sola vez.
    initUtils(); 
    
    // --- Constantes y Variables ---
    const FACTURA_API_URL =`${API_URL}/api/facturas `; // Reemplazar con la URL real de la API
    const PRODUCTO_API_URL = `${API_URL}/api/productos`;
    const TASA_IVA = 0.21;
    let productosDisponibles = [];
    let facturaActualItems = [];

    // --- Referencias al DOM ---
    const listaProductosDiv = document.getElementById('lista-productos-disponibles');
    const tablaFacturaBody = document.getElementById('tabla-factura-items');
    const filtroInput = document.getElementById('filtro-productos');
    const clienteNombreInput = document.getElementById('factura-cliente-nombre');
    const clienteCUITInput = document.getElementById('factura-cliente-cuit');
    const subtotalSinIvaSpan = document.getElementById('factura-subtotal-sin-iva'); // Asumiendo que existe
    const totalIvaSpan = document.getElementById('factura-total-iva'); // Asumiendo que existe
    const totalConIvaSpan = document.getElementById('factura-total-con-iva');
    const btnGenerarFactura = document.getElementById('btn-generar-factura');

    // --- Funciones ---

    async function cargarProductos() {
        try {
            // Se usa un límite alto para traer todos los productos. Para sistemas grandes, se recomienda paginación.
            const data = await fetchAPI(`${PRODUCTO_API_URL}?limite=9999`);
            productosDisponibles = data.productos || data.rows || [];
            renderizarListaProductos();
        } catch (error) {
            console.error("Error al cargar productos:", error);
            if(listaProductosDiv) listaProductosDiv.innerHTML = '<p class="p-4 text-red-500">Error al cargar productos.</p>';
        }
    }

    function renderizarListaProductos(filtro = '') {
        if (!listaProductosDiv) return;
        listaProductosDiv.innerHTML = '';
        const terminoFiltro = filtro.toLowerCase();
        const productosFiltrados = productosDisponibles.filter(p => p.nombre.toLowerCase().includes(terminoFiltro));
        
        productosFiltrados.forEach(producto => {
            const estaAgotado = producto.stock <= 0;
            const productoDiv = document.createElement('div');
            productoDiv.className = `flex justify-between items-center p-3 border-b ${estaAgotado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
            productoDiv.innerHTML = `
                <div>
                    <p class="font-medium">${producto.nombre}</p>
                    <p class="text-sm text-gray-500">Stock: ${producto.stock} | Precio (c/IVA): $${parseFloat(producto.precio).toFixed(2)}</p>
                </div>
                <button data-id="${producto.id}" class="agregar-btn bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded-lg text-sm" ${estaAgotado ? 'disabled' : ''}>Agregar</button>
            `;
            listaProductosDiv.appendChild(productoDiv);
        });
    }

    function agregarProductoAFactura(productoId) {
        const itemExistente = facturaActualItems.find(item => item.productoId === productoId);
        const productoOriginal = productosDisponibles.find(p => p.id === productoId);

        if (!productoOriginal) return;

        if (itemExistente) {
            if (itemExistente.cantidad < productoOriginal.stock) {
                itemExistente.cantidad++;
            } else {
                mostrarModalMensaje("Stock Insuficiente", `No hay más stock disponible para "${itemExistente.nombre}".`, 'advertencia');
            }
        } else {
            facturaActualItems.push({
                productoId: productoOriginal.id,
                nombre: productoOriginal.nombre,
                precioUnitario: productoOriginal.precio, // Este es el precio final con IVA
                cantidad: 1,
                stockDisponible: productoOriginal.stock
            });
        }
        renderizarItemsFactura();
    }

    function renderizarItemsFactura() {
        if (!tablaFacturaBody) return;
        tablaFacturaBody.innerHTML = '';
        if (facturaActualItems.length === 0) {
            tablaFacturaBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-4">Agregue productos desde la lista...</td></tr>';
            actualizarTotales();
            return;
        }
        facturaActualItems.forEach((item, index) => {
            const subtotal = item.cantidad * item.precioUnitario;
            const fila = document.createElement('tr');
            fila.className = 'border-b';
            fila.innerHTML = `
                <td class="px-4 py-3">${item.nombre}</td>
                <td class="px-4 py-3 text-center">
                    <input type="number" value="${item.cantidad}" min="1" max="${item.stockDisponible}" data-index="${index}" class="cantidad-input w-20 text-center border rounded p-1">
                </td>
                <td class="px-4 py-3 text-right">$${parseFloat(item.precioUnitario).toFixed(2)}</td>
                <td class="px-4 py-3 text-right font-medium">$${subtotal.toFixed(2)}</td>
                <td class="px-4 py-3 text-center">
                    <button data-index="${index}" class="quitar-btn text-red-500 hover:text-red-700 font-bold">X</button>
                </td>
            `;
            tablaFacturaBody.appendChild(fila);
        });
        actualizarTotales();
    }

    function actualizarTotales() {
        const totalConIVA = facturaActualItems.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
        const subtotalSinIVA = totalConIVA / (1 + TASA_IVA);
        const totalIVA = totalConIVA - subtotalSinIVA;

        if(totalConIvaSpan) totalConIvaSpan.textContent = `$${totalConIVA.toFixed(2)}`;
        // Opcional: mostrar los otros totales si los elementos existen en el HTML
        if(subtotalSinIvaSpan) subtotalSinIvaSpan.textContent = `$${subtotalSinIVA.toFixed(2)}`;
        if(totalIvaSpan) totalIvaSpan.textContent = `$${totalIVA.toFixed(2)}`;
    }

    async function generarFactura() {
        const clienteNombre = clienteNombreInput.value.trim();
        if (!clienteNombre || facturaActualItems.length === 0) {
            mostrarModalMensaje('Datos Incompletos', 'Debe ingresar un nombre de cliente y agregar al menos un producto a la factura.', 'advertencia');
            return;
        }
        
        // Deshabilitar botón para evitar doble click
        btnGenerarFactura.disabled = true;
        mostrarModalMensaje("Procesando...", 'Generando factura, por favor espere.', 'info', false);

        // Se calculan los totales desde el estado, no desde el DOM.
        const totalConIVA = facturaActualItems.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
        const subtotalSinIVA = totalConIVA / (1 + TASA_IVA);
        const totalIVA = totalConIVA - subtotalSinIVA;

        const datosFactura = {
            encabezado: {
                clienteNombre,
                clienteCUIT: clienteCUITInput.value.trim() || null,
                tipoComprobante: 'Factura B',
                totalConIVA, subtotalSinIVA, totalIVA,
            },
            items: facturaActualItems.map(item => ({
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario // Precio final con IVA
            }))
        };
        
        try {
            const facturaCreada = await fetchAPI(FACTURA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosFactura)
            });
            
            // --- INICIO: LÓGICA CRÍTICA DE ACTUALIZACIÓN DE STOCK ---
            mostrarModalMensaje("Actualizando Stock...", `Factura N° ${facturaCreada.id} creada. Actualizando inventario...`, 'info', false);
            
            const promesasDeActualizacion = facturaActualItems.map(item => {
                const nuevoStock = item.stockDisponible - item.cantidad;
                return fetchAPI(`${PRODUCTO_API_URL}/${item.productoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock: nuevoStock })
                });
            });

            // Esperamos que todas las actualizaciones terminen
            await Promise.all(promesasDeActualizacion);
            
            mostrarModalMensaje("Éxito", `Factura N° ${facturaCreada.id} creada y stock actualizado correctamente. Redirigiendo...`, 'exito');

            // --- FIN: LÓGICA DE ACTUALIZACIÓN DE STOCK ---

            setTimeout(() => {
                // Redirigir al historial o a donde sea necesario
                window.location.href = 'historial_factura.html';
            }, 2000);

        } catch (error) {
            mostrarModalMensaje("Error Crítico", `Error al generar la factura o actualizar el stock: ${error.message}`, 'error');
            btnGenerarFactura.disabled = false; // Rehabilitar el botón si hay error
        }
    }

    // --- Asignación de Eventos ---

    if (filtroInput) filtroInput.addEventListener('input', (e) => renderizarListaProductos(e.target.value));
    
    if (listaProductosDiv) {
        listaProductosDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('agregar-btn')) {
                agregarProductoAFactura(parseInt(e.target.dataset.id));
            }
        });
    }

    if (tablaFacturaBody) {
        // Evento 'input' para una respuesta inmediata al cambiar la cantidad
        tablaFacturaBody.addEventListener('input', (e) => {
            if (e.target.classList.contains('cantidad-input')) {
                const index = parseInt(e.target.dataset.index, 10);
                let nuevaCantidad = parseInt(e.target.value, 10);
                const item = facturaActualItems[index];

                if (!item) return;

                if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
                    nuevaCantidad = 1;
                }
                if (nuevaCantidad > item.stockDisponible) {
                    nuevaCantidad = item.stockDisponible;
                    mostrarModalMensaje("Stock Insuficiente", `La cantidad no puede superar el stock disponible (${item.stockDisponible})`, 'advertencia');
                }
                
                e.target.value = nuevaCantidad;
                item.cantidad = nuevaCantidad;
                
                // Se renderiza todo de nuevo para actualizar subtotales y totales generales.
                renderizarItemsFactura();
            }
        });

        tablaFacturaBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('quitar-btn')) {
                const index = parseInt(e.target.dataset.index, 10);
                facturaActualItems.splice(index, 1);
                renderizarItemsFactura();
            }
        });
    }

    if(btnGenerarFactura) btnGenerarFactura.addEventListener('click', generarFactura);

    // --- Carga Inicial ---
    cargarProductos();
});