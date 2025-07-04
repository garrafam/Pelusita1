// public/js/historial_facturas.js

// Corregimos la línea de importación: quitamos el ';;' y añadimos 'mostrarModalMensaje'
import { fetchAPI, initUtils, mostrarModalMensaje, mostrarModalConfirmacion, cerrarGenericModal } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
   // initUtils(); // Inicializamos las utilidades del modal genérico
    // --- ELEMENTOS DEL DOM ---
    const contenedor = document.getElementById('contenedor-historial-facturas');
    const paginacionDiv = document.getElementById('paginacion-historial-facturas');
    const mensajeDiv = document.getElementById('mensaje-historial-facturas');
    const btnFiltros = document.getElementById('btn-aplicar-filtros');
    const modalDetalle = document.getElementById('modal-ver-factura');
    const contenidoModalDetalle = document.getElementById('detalle-factura-contenido');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-detalle');
    const btnImprimir = document.getElementById('btn-imprimir-factura');

    const FACTURA_API_URL = `${API_URL}/api/facturas`;
    let paginaActual = 1;

    // --- FUNCIONES ---

    async function cargarHistorialFacturas(pagina = 1) {
        mensajeDiv.textContent = 'Cargando facturas...';
        contenedor.innerHTML = '';
        paginaActual = pagina;

        const cliente = document.getElementById('filtro-cliente').value;
        const url = new URL(FACTURA_API_URL);
        url.searchParams.append('pagina', pagina);
        url.searchParams.append('limite', 10);
        if (cliente) url.searchParams.append('cliente', cliente);

        try {
            const data = await fetchAPI(url.toString());
            if (data.facturas && data.facturas.length > 0) {
                renderizarListaFacturas(data.facturas);
                mensajeDiv.textContent = '';
            } else {
                mensajeDiv.textContent = 'No se encontraron facturas.';
                paginacionDiv.innerHTML = '';
            }
        } catch (error) {
            mensajeDiv.textContent = `Error al cargar facturas: ${error.message}`;
        }
    }

    function renderizarListaFacturas(facturas) {
        facturas.forEach(factura => {
            const card = document.createElement('div');
            card.className = 'historial-factura-card bg-white p-4 rounded-lg shadow flex justify-between items-center';
            const fecha = new Date(factura.fecha).toLocaleDateString('es-AR');
            
            card.innerHTML = `
                <div>
                    <p class="font-bold text-sky-700">${factura.tipoComprobante || 'Factura'} N° ${String(factura.id).padStart(8, '0')}</p>
                    <p class="text-sm text-gray-600">Fecha: ${fecha}</p>
                    <p class="text-sm">Cliente: <span class="font-medium">${factura.clienteNombre}</span></p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-bold">$${parseFloat(factura.totalConIVA || 0).toFixed(2)}</p>
                    <button data-factura-id="${factura.id}" class="ver-detalle-btn text-sm text-blue-500 hover:underline">Ver Detalle</button>
                </div>
            `;
            contenedor.appendChild(card);
        });
    }

    async function abrirModalDetalle(facturaId) {
        if (!modalDetalle || !contenidoModalDetalle) {
            console.error("No se encontraron los elementos del modal de detalle.");
            return;
        }
        modalDetalle.classList.remove('hidden');
        contenidoModalDetalle.innerHTML = '<p class="text-center text-gray-500">Cargando detalle...</p>';
        try {
            const factura = await fetchAPI(`${FACTURA_API_URL}/${facturaId}`);
            renderizarDetalleEnModal(factura);
        } catch (error) {
            contenidoModalDetalle.innerHTML = `<p class="text-center text-red-500">Error al cargar el detalle: ${error.message}</p>`;
        }
    }

    function renderizarDetalleEnModal(factura) {
        const fecha = new Date(factura.fecha).toLocaleDateString('es-AR');
        let itemsHtml = '';

        // Verificamos que 'factura.items' exista y sea un array
        if (factura.items && Array.isArray(factura.items)) {
            factura.items.forEach(item => {
                // Hacemos el código más robusto: si 'item.Producto' no existe, mostramos un texto alternativo.
                const nombreProducto = item.Producto ? item.Producto.nombre : 'Producto no disponible';
                const precioUnitario = item.precioUnitario || 0;
                const cantidad = item.cantidad || 0;
                const subtotalItem = cantidad * precioUnitario;

                itemsHtml += `
                    <tr class="border-b">
                        <td class="py-2 px-4">${nombreProducto}</td>
                        <td class="py-2 px-4 text-center">${cantidad}</td>
                        <td class="py-2 px-4 text-right">$${parseFloat(precioUnitario).toFixed(2)}</td>
                        <td class="py-2 px-4 text-right font-medium">$${subtotalItem.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        contenidoModalDetalle.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${factura.tipoComprobante || 'Factura'}</h2>
                    <p class="text-red-600 font-semibold">N° ${String(factura.id || 0).padStart(8, '0')}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold">Fecha: ${fecha}</p>
                </div>
            </div>
            <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 class="font-semibold text-gray-700">Cliente</h3>
                <p>${factura.clienteNombre || 'N/A'}</p>
                <p class="text-sm text-gray-500">CUIT: ${factura.clienteCUIT || 'No especificado'}</p>
            </div>
            <table class="w-full text-sm">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="py-2 px-4 text-left font-semibold text-gray-600">Descripción</th>
                        <th class="py-2 px-4 text-center font-semibold text-gray-600">Cant.</th>
                        <th class="py-2 px-4 text-right font-semibold text-gray-600">P. Unit.</th>
                        <th class="py-2 px-4 text-right font-semibold text-gray-600">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="mt-6 pt-4 border-t-2 text-right space-y-1">
                 <p><span class="font-medium text-gray-600">Subtotal:</span> $${parseFloat(factura.subtotalSinIVA || 0).toFixed(2)}</p>
                 <p><span class="font-medium text-gray-600">IVA (21%):</span> $${parseFloat(factura.totalIVA || 0).toFixed(2)}</p>
                 <p class="text-xl font-bold"><span class="text-gray-800">TOTAL:</span> $${parseFloat(factura.totalConIVA || 0).toFixed(2)}</p>
            </div>
        `;
    }
    
    function cerrarModalDetalle() {
        if (modalDetalle) {
            modalDetalle.classList.add('hidden');
        }
    }

    // --- EVENT LISTENERS ---
    if (btnFiltros) {
        btnFiltros.addEventListener('click', () => cargarHistorialFacturas(1));
    }
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModalDetalle);
    }
    if (btnImprimir) {
        btnImprimir.addEventListener('click', () => window.print());
    }

    if (contenedor) {
        contenedor.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('ver-detalle-btn')) {
                const id = e.target.dataset.facturaId;
                abrirModalDetalle(id);
            }
        });
    }
    
    // Carga inicial
    cargarHistorialFacturas();
});
