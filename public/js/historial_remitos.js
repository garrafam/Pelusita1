// public/js/historial_remitos.js

// Asumimos que utils.js se carga en el HTML y que fetchAPI está disponible.
import { fetchAPI,initUtils, mostrarModalConfirmacion, mostrarModalMensaje, cerrarGenericModal } from './utils.js';
import { API_URL } from './config.js';
document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const contenedor = document.getElementById('contenedor-historial-remitos');
    const paginacionDiv = document.getElementById('paginacion-historial-remitos');
    const mensajeDiv = document.getElementById('mensaje-historial-remitos');
    const btnFiltros = document.getElementById('btn-aplicar-filtros');
    
    // Elementos del modal de detalle
    const modalDetalle = document.getElementById('modal-ver-remito');
    const contenidoModalDetalle = document.getElementById('detalle-remito-contenido');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-detalle');
    const btnImprimir = document.getElementById('btn-imprimir-remito-modal');

    const REMITO_API_URL = `${API_URL}/api/remitos`;

    // --- FUNCIONES ---

    async function cargarHistorialRemitos(pagina = 1) {
        mensajeDiv.textContent = 'Cargando historial...';
        contenedor.innerHTML = '';
        try {
            const url = new URL(REMITO_API_URL);
            url.searchParams.append('pagina', pagina);
            url.searchParams.append('limite', 10);
            
            const data = await fetchAPI(url.toString());
            
            if (data && data.remitos && Array.isArray(data.remitos)) {
                if (data.remitos.length > 0) {
                    renderizarListaRemitos(data.remitos);
                    mensajeDiv.textContent = '';
                } else {
                    mensajeDiv.textContent = 'No se encontraron remitos.';
                }
            } else {
                 // CORRECCIÓN para trabajar con la respuesta estándar de Sequelize
                if (data && data.rows && Array.isArray(data.rows)) {
                    if (data.rows.length > 0) {
                        renderizarListaRemitos(data.rows);
                        mensajeDiv.textContent = '';
                    } else {
                         mensajeDiv.textContent = 'No se encontraron remitos.';
                    }
                } else {
                    console.error("Estructura de datos inesperada del backend:", data);
                    mensajeDiv.textContent = 'Recibido un formato de datos inesperado.';
                }
            }
        } catch (error) {
            mensajeDiv.textContent = `Error al cargar historial: ${error.message}`;
        }
    }

    function renderizarListaRemitos(remitos) {
        contenedor.innerHTML = '';
        remitos.forEach(remito => {
            const card = document.createElement('div');
            card.className = 'historial-remito-card bg-white p-4 rounded-lg shadow flex justify-between items-center';
            const fecha = new Date(remito.fecha).toLocaleDateString('es-AR');
            card.innerHTML = `
                <div>
                    <p class="font-bold text-sky-700">Remito N° ${String(remito.id).padStart(8, '0')}</p>
                    <p class="text-sm text-gray-600">Fecha: ${fecha}</p>
                    <p class="text-sm">Cliente: <span class="font-medium">${remito.clienteNombre || 'N/A'}</span></p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-bold">$${parseFloat(remito.totalConIVA || 0).toFixed(2)}</p>
                    <button data-remito-id="${remito.id}" class="ver-detalle-btn text-sm text-blue-500 hover:underline">Ver Detalle</button>
                </div>
            `;
            contenedor.appendChild(card);
        });
    }
    

    async function abrirModalDetalle(remitoId) {
        if (!modalDetalle || !contenidoModalDetalle) {
            console.error("Elementos del modal no encontrados en el DOM.");
            return;
        }
        
        modalDetalle.classList.remove('hidden');
        contenidoModalDetalle.innerHTML = '<p class="text-center text-gray-500">Cargando detalle...</p>';
        
        try {
            const remito = await fetchAPI(`${REMITO_API_URL}/${remitoId}`);
            renderizarDetalleEnModal(remito);
        } catch (error) {
            contenidoModalDetalle.innerHTML = `<p class="text-center text-red-500">Error al cargar el detalle: ${error.message}</p>`;
        }
    }

    // --- ESTA ES LA FUNCIÓN COMPLETADA ---
    function renderizarDetalleEnModal(remito) {
        const fecha = new Date(remito.fecha).toLocaleDateString('es-AR');
        let itemsHtml = '';

        if (remito.items && remito.items.length > 0) {
            remito.items.forEach(item => {
                const nombreProducto = item.Producto ? item.Producto.nombre : 'Producto no disponible';
                const precioUnitario = item.Producto ? item.Producto.precio : 0;
                const subtotal = item.cantidad * precioUnitario;
                
                itemsHtml += `
                    <tr class="border-b">
                        <td class="py-2 px-4">${nombreProducto}</td>
                        <td class="py-2 px-4 text-center">${item.cantidad}</td>
                        <td class="py-2 px-4 text-right">$${parseFloat(precioUnitario).toFixed(2)}</td>
                        <td class="py-2 px-4 text-right font-medium">$${subtotal.toFixed(2)}</td>
                    </tr>
                `;
            });
        } else {
            itemsHtml = '<tr><td colspan="4" class="text-center py-4">Este remito no tiene productos asociados.</td></tr>';
        }

        contenidoModalDetalle.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Remito</h2>
                    <p class="text-red-600 font-semibold">N° ${String(remito.id).padStart(8, '0')}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold">Fecha: ${fecha}</p>
                </div>
            </div>
            <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 class="font-semibold text-gray-700">Cliente</h3>
                <p>${remito.clienteNombre}</p>
                <p class="text-sm text-gray-500">CUIT: ${remito.clienteCUIT || 'No especificado'}</p>
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
                 <p><span class="font-medium text-gray-600">Subtotal (sin IVA):</span> $${parseFloat(remito.subtotalSinIVA).toFixed(2)}</p>
                 <p><span class="font-medium text-gray-600">IVA (21%):</span> $${parseFloat(remito.totalIVA).toFixed(2)}</p>
                 <p class="text-xl font-bold"><span class="text-gray-800">TOTAL:</span> $${parseFloat(remito.totalConIVA).toFixed(2)}</p>
            </div>
        `;
    }
    
    function cerrarModalDetalle() {
        if (modalDetalle) modalDetalle.classList.add('hidden');
    }

    // --- EVENT LISTENERS ---
    if (btnFiltros) btnFiltros.addEventListener('click', () => cargarHistorialRemitos(1));
    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModalDetalle);
    if (btnImprimir) btnImprimir.addEventListener('click', () => window.print());

    if (contenedor) {
        contenedor.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('ver-detalle-btn')) {
                const id = e.target.dataset.remitoId;
                abrirModalDetalle(id);
            }
        });
    }
    
    // Carga inicial
    cargarHistorialRemitos();
});
