// script.js (Principal)
import { fetchAPI,initUtils, mostrarModalConfirmacion, mostrarModalMensaje, cerrarGenericModal } from './utils.js';
const BASE_URL = 'http://localhost:3001/api/productos'; 
const REMITO_API_URL = 'http://localhost:3001/api/remitos';
const TASA_IVA = 0.21; 
const UMBRAL_BAJO_STOCK = 5; 
document.addEventListener('DOMContentLoaded', () => { initUtils();})
// --- Declaraciones de Elementos del DOM ---
let inputCodigoDeBarras, inputNombre, inputPrecio, inputCategoria, inputStock,
    inputProductoExistenteId, btnSubmitAgregar, btnLimpiarFormulario,
    mensajeBusquedaCodigo, mensajeFormulario, contenedorProductos, mensajeLista,
    inputBusquedaGeneral, 
    selectOrdenarProductosPor, selectOrdenProductosDireccion, 
    paginacionProductosDiv, 
    modalEditar, 
    btnPrepararRemito, seccionRemito, remitoVisualizacion, mensajeRemito,
    btnCancelarRemito, btnConfirmarGuardarRemito, btnImprimirRemito,
    btnEnviarRemitoCorreo, remitoNumeroDisplay, remitoFechaDisplay,
    inputRemitoClienteNombre, inputRemitoClienteCUIT,
    genericModal, genericModalTitulo, genericModalMensaje, genericModalBotones,
    genericModalBtnCerrarX;


let timeoutIdBusquedaGeneral; 
let itemsSeleccionadosParaRemito = []; 
let productosCargados = []; 
let proximoNumeroRemito = 1; 

let paginaActualProductos = 1;
const limitePorPaginaProductos = 8; 

// --- Carga de Productos ---
async function cargarProductos(pagina = 1) { 
    if (!mensajeLista || !contenedorProductos || !paginacionProductosDiv) { 
        return;
    }
    mostrarModalMensaje("Cargando...", "Cargando productos...", 'info', false); 

    const terminoBusqueda = inputBusquedaGeneral ? inputBusquedaGeneral.value.trim() : "";
    const ordenarPor = selectOrdenarProductosPor ? selectOrdenarProductosPor.value : "nombre";
    const ordenDireccion = selectOrdenProductosDireccion ? selectOrdenProductosDireccion.value : "ASC";

    let url = new URL(BASE_URL);
    if (terminoBusqueda) url.searchParams.append('q', terminoBusqueda);
    if (ordenarPor) url.searchParams.append('ordenarPor', ordenarPor);
    if (ordenDireccion) url.searchParams.append('ordenDireccion', ordenDireccion);
    url.searchParams.append('pagina', pagina);
    url.searchParams.append('limite', limitePorPaginaProductos);
    
    try {
        const data = await fetchAPI(url.toString());
        
        if (data && typeof data === 'object' && Array.isArray(data.productos)) {
            productosCargados = data.productos; 
            renderizarListaProductos(productosCargados); 
            renderizarControlesPaginacionProductos(data.totalPaginas, data.paginaActual);
        } else {
            productosCargados = [];
            renderizarListaProductos([]);
            renderizarControlesPaginacionProductos(0,1);
        }
        
        if (productosCargados.length === 0 && mensajeLista) {
            mensajeLista.textContent = terminoBusqueda ? `No se encontraron productos para "${terminoBusqueda}".` : 'No hay productos. ¡Agrega algunos!';
            mensajeLista.className = 'mt-6 text-sm text-center text-gray-500';
        } else if (mensajeLista) {
            mensajeLista.textContent = ''; 
        }
        cerrarGenericModal(); 
    } catch (error) {
        cerrarGenericModal(); 
        mostrarModalMensaje("Error", `Error al cargar productos: ${error.message}`, "error");
        renderizarControlesPaginacionProductos(0,1);
    }
}
function renderizarListaProductos(productosARenderizar) { 
    if (!contenedorProductos) return;
    contenedorProductos.innerHTML = ''; 
    if (!productosARenderizar || productosARenderizar.length === 0) return;

    productosARenderizar.forEach(producto => {
        const elementoProducto = crearElementoProducto(producto);
        contenedorProductos.appendChild(elementoProducto);
    });
}
function crearElementoProducto(producto) { 
    const div = document.createElement('div');
    div.className = `producto-item bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col`;
    div.dataset.productoId = producto.id;

    let stockStatusHTML = '';
    if (producto.stock === 0) {
        div.classList.add('border-2', 'border-red-400', 'bg-red-50');
        stockStatusHTML = `<p class="text-xs font-semibold text-red-600 mt-1">AGOTADO</p>`;
    } else if (producto.stock > 0 && producto.stock <= UMBRAL_BAJO_STOCK) {
        div.classList.add('border-2', 'border-yellow-400', 'bg-yellow-50');
        stockStatusHTML = `<p class="text-xs font-semibold text-yellow-600 mt-1">BAJO STOCK (${producto.stock} u.)</p>`;
    }

    const itemSeleccionadoExistente = itemsSeleccionadosParaRemito.find(item => item.productoId === producto.id);
    const estaSeleccionado = !!itemSeleccionadoExistente;
    const cantidadSeleccionada = estaSeleccionado ? itemSeleccionadoExistente.cantidadRemito : 1;

    div.innerHTML = `
        <div class="flex-grow">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-semibold text-sky-700 truncate" title="${producto.nombre}">${producto.nombre}</h3>
                <input type="checkbox" class="form-checkbox h-5 w-5 text-sky-600 rounded border-gray-300 focus:ring-sky-500 producto-checkbox no-print" 
                       data-id="${producto.id}" ${estaSeleccionado ? 'checked' : ''}>
            </div>
            <p class="text-gray-600 text-sm mb-1"><span class="font-medium">Cód. Barras:</span> ${producto.codigoDeBarras || 'N/A'}</p>
            <p class="text-gray-600 text-sm mb-1"><span class="font-medium">Categoría:</span> ${producto.categoria || 'N/A'}</p>
            <p class="text-gray-800 font-bold text-lg mb-1"><span class="font-medium">Precio (IVA Incl.):</span> $${parseFloat(producto.precio).toFixed(2)}</p>
            <p class="text-gray-600 text-sm mb-1"><span class="font-medium">Stock:</span> <span class="stock-disponible">${producto.stock !== null ? producto.stock : 'N/A'}</span></p>
            ${stockStatusHTML} 
            <div class="mt-2 div-cantidad-remito ${estaSeleccionado ? '' : 'hidden'} no-print">
                <label for="cantidad-${producto.id}" class="text-sm font-medium text-gray-700">Cantidad p/ Remito:</label>
                <input type="number" id="cantidad-${producto.id}" name="cantidad-remito" value="${cantidadSeleccionada}" 
                       min="1" max="${producto.stock}" 
                       class="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-sky-500 focus:border-sky-500"
                       ${estaSeleccionado ? '' : 'disabled'}>
            </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2 no-print">
            <button class="btn-editar bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-md hover:shadow-lg transition-all" data-id="${producto.id}">Editar</button>
            <button class="btn-eliminar bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-md hover:shadow-lg transition-all" data-id="${producto.id}">Eliminar</button>
        </div>
    `;
    
    const checkbox = div.querySelector('.producto-checkbox');
    const divCantidad = div.querySelector('.div-cantidad-remito');
    const inputCantidadElem = div.querySelector(`input[name="cantidad-remito"]`);

    checkbox.addEventListener('change', (e) => {
        const productoOriginal = producto; 
        if (!productoOriginal) return;
        const productoId = productoOriginal.id;
        const itemIndex = itemsSeleccionadosParaRemito.findIndex(item => item.productoId === productoId);
        if (e.target.checked) {
            divCantidad.classList.remove('hidden');
            inputCantidadElem.disabled = false;
            inputCantidadElem.max = productoOriginal.stock; 
            if (itemIndex === -1) { 
                const cantidadActualInput = parseInt(inputCantidadElem.value, 10) || 1;
                itemsSeleccionadosParaRemito.push({ productoId: productoId, cantidadRemito: cantidadActualInput, productoOriginal: { ...productoOriginal } });
            } else { 
                itemsSeleccionadosParaRemito[itemIndex].cantidadRemito = parseInt(inputCantidadElem.value, 10) || 1;
            }
        } else {
            divCantidad.classList.add('hidden');
            inputCantidadElem.disabled = true;
            if (itemIndex > -1) { 
                itemsSeleccionadosParaRemito.splice(itemIndex, 1);
            }
        }
    });

    inputCantidadElem.addEventListener('input', () => {
        const productoOriginal = producto; 
        if (!productoOriginal) return;
        let cantidad = parseInt(inputCantidadElem.value, 10);
        if (isNaN(cantidad)) cantidad = 1; 
        if (cantidad > productoOriginal.stock) cantidad = productoOriginal.stock;
        if (cantidad < 1 && productoOriginal.stock > 0) cantidad = 1;
        else if (cantidad < 0) cantidad = 0;
        inputCantidadElem.value = cantidad; 
        const itemIndex = itemsSeleccionadosParaRemito.findIndex(item => item.productoId === producto.id);
        if (itemIndex > -1) {
            itemsSeleccionadosParaRemito[itemIndex].cantidadRemito = cantidad;
        } else if (checkbox.checked) { 
            itemsSeleccionadosParaRemito.push({ productoId: producto.id, cantidadRemito: cantidad, productoOriginal: { ...productoOriginal } });
        }
    });
    
    const btnEliminar = div.querySelector('.btn-eliminar');
    if (btnEliminar) { 
        btnEliminar.addEventListener('click', (event) => {
            console.log(`[DEBUG ELIMINAR] Botón Eliminar CLICKEADO para producto ID: ${producto.id}, Nombre: ${producto.nombre}`); 
            event.stopPropagation(); 
            confirmarEliminacion(producto.id, producto.nombre);
        });
    }
    
    const btnEditarProducto = div.querySelector('.btn-editar');
    if (btnEditarProducto) {
        btnEditarProducto.addEventListener('click', () => {
            console.log(`[DEBUG EDITAR PRODUCTO] Botón Editar CLICKEADO para producto ID: ${producto.id}, Nombre: ${producto.nombre}`); 
            abrirModalEditar(producto); 
        });
    }
    return div;
}

// --- Lógica Formulario Agregar / Buscar ---
async function buscarProductoPorCodigo() { /* ... (código sin cambios) ... */ }
function limpiarCamposFormularioAgregar(limpiarCodigoBarras = true) { /* ... (código sin cambios) ... */ }

/*// --- Funciones CRUD (Eliminar) ---
function confirmarEliminacion(id, nombre) { 
    console.log(`[DEBUG ELIMINAR] Función confirmarEliminacion llamada para ID: ${id}, Nombre: ${nombre}`); 
    mostrarModalConfirmacion(
        "Confirmar Eliminación",
        `¿Estás seguro de que deseas eliminar el producto "${nombre}" (ID: ${id})? Esta acción no se puede deshacer.`,
        () => { 
            console.log(`[DEBUG ELIMINAR] Confirmación aceptada para ID: ${id}. Llamando a eliminarProducto.`); 
            eliminarProducto(id);
        },
        () => {
            console.log(`[DEBUG ELIMINAR] Confirmación CANCELADA para ID: ${id}.`); 
        }
    );
}
async function eliminarProducto(id) { 
    console.log(`[DEBUG ELIMINAR] Función eliminarProducto llamada para ID: ${id}`); 
    mostrarModalMensaje("Eliminando...", `Eliminando producto ID: ${id}...`, 'info', false);
    try {
        console.log(`[DEBUG ELIMINAR] Intentando fetchAPI DELETE para ID: ${id}`); 
        await fetchAPI(`${BASE_URL}/${id}`, { method: 'DELETE' });
        console.log(`[DEBUG ELIMINAR] fetchAPI DELETE completado para ID: ${id}`); 
        
        const itemIndex = itemsSeleccionadosParaRemito.findIndex(item => item.productoId === id);
        if (itemIndex > -1) {
            itemsSeleccionadosParaRemito.splice(itemIndex, 1);
        }
        cerrarGenericModal();
        mostrarModalMensaje("Éxito", `Producto ID: ${id} eliminado con éxito.`, 'exito');
        cargarProductos(paginaActualProductos); 
    } catch (error) {
        cerrarGenericModal();
        console.error(`[DEBUG ELIMINAR] Error en eliminarProducto para ID: ${id}:`, error); 
        mostrarModalMensaje("Error", `Error al eliminar producto ID ${id}: ${error.message}`, 'error');
    }
}

// --- Funciones Modal Edición ---
function abrirModalEditar(productoRecibido) { 
    console.log("[DEBUG EDITAR PRODUCTO] Función abrirModalEditar - INICIO. Producto ID:", productoRecibido ? productoRecibido.id : "Producto es undefined/null"); 
    
    if (!modalEditar) { 
        console.error("[DEBUG EDITAR PRODUCTO] Error: Elemento modalEditar (el div principal del modal) no encontrado en el DOM.");
        return;
    }
    console.log("[DEBUG EDITAR PRODUCTO] modalEditar encontrado:", modalEditar);

    const editIdField = document.getElementById('edit-producto-id');
    const editCodigoBarrasField = document.getElementById('edit-codigoDeBarras');
    const editNombreField = document.getElementById('edit-nombre');
    const editPrecioField = document.getElementById('edit-precio');
    const editCategoriaField = document.getElementById('edit-categoria');
    const editStockField = document.getElementById('edit-stock');
    const mensajeModalEdicion = document.getElementById('mensaje-modal'); 

    if (!editIdField || !editCodigoBarrasField || !editNombreField || !editPrecioField || !editCategoriaField || !editStockField) { 
        console.error("[DEBUG EDITAR PRODUCTO] Error: No se encontraron UNO O MÁS campos del formulario de edición en el DOM.");
        return;
    }
    console.log("[DEBUG EDITAR PRODUCTO] Todos los campos del modal de edición encontrados."); 

    try {
        if (!productoRecibido) {
            console.error("[DEBUG EDITAR PRODUCTO] ERROR: productoRecibido es undefined o null al intentar poblar campos.");
            return;
        }
        editIdField.value = productoRecibido.id;
        editCodigoBarrasField.value = productoRecibido.codigoDeBarras || '';
        editNombreField.value = productoRecibido.nombre;
        editPrecioField.value = productoRecibido.precio;
        editCategoriaField.value = productoRecibido.categoria || '';
        editStockField.value = productoRecibido.stock;
        console.log("[DEBUG EDITAR PRODUCTO] Campos del modal poblados con datos del producto."); 
    } catch (e) {
        console.error("[DEBUG EDITAR PRODUCTO] ERROR al intentar poblar los campos del modal:", e);
        return; 
    }
    
    modalEditar.classList.remove('hidden'); 
    modalEditar.classList.add('flex');
    console.log("[DEBUG EDITAR PRODUCTO] Modal de edición mostrado (clases hidden/flex)."); 
    
    setTimeout(() => {
        const modalContent = modalEditar.querySelector('.modal-content'); 
        if(modalContent) {
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
        } 
    }, 10);
    if(mensajeModalEdicion) mensajeModalEdicion.textContent = ''; 
}
*/function cerrarModalEditar() { 
    console.log("[DEBUG EDITAR PRODUCTO] Función cerrarModalEditar llamada."); 
    if (!modalEditar) return;
    
    const modalContent = modalEditar.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
    }
    setTimeout(() => {
        modalEditar.classList.add('hidden');
        modalEditar.classList.remove('flex');
        console.log("[DEBUG EDITAR PRODUCTO] Modal de edición ocultado (clases hidden/flex)."); 
    }, 200); 
}
/*
// --- Lógica de Remito ---
*/async function obtenerYMostrarProximoNumeroRemito() { 
    console.log("[DEBUG PREPARAR REMITO] obtenerYMostrarProximoNumeroRemito - INICIO");
    try {
        const data = await fetchAPI(`${REMITO_API_URL}/ultimoNumero`);
        proximoNumeroRemito = (data.ultimoNumero || 0) + 1;
        if (remitoNumeroDisplay) {
            remitoNumeroDisplay.textContent = proximoNumeroRemito.toString().padStart(6, '0');
            console.log("[DEBUG PREPARAR REMITO] Próximo número de remito:", proximoNumeroRemito);
        }
    } catch (error) {
        console.error("[DEBUG PREPARAR REMITO] Error al obtener último número de remito:", error);
        if (remitoNumeroDisplay) remitoNumeroDisplay.textContent = "Error";
        if (mensajeRemito) mostrarModalMensaje("Error", `Error al obtener N° de remito: ${error.message}`, 'error', true, mensajeRemito);
    }
}
function mostrarSeccionRemito() { 
    console.log("[DEBUG PREPARAR REMITO] mostrarSeccionRemito - INICIO");
    if(seccionRemito) {
        seccionRemito.classList.remove('hidden');
        console.log("[DEBUG PREPARAR REMITO] Clase 'hidden' eliminada de seccionRemito.");
        seccionRemito.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.error("[DEBUG PREPARAR REMITO] Elemento seccionRemito no encontrado.");
    }
}
function ocultarSeccionRemito() { 
    if(seccionRemito) seccionRemito.classList.add('hidden');
    if(remitoVisualizacion) remitoVisualizacion.innerHTML = '';
    itemsSeleccionadosParaRemito = []; 
    if(inputRemitoClienteNombre) inputRemitoClienteNombre.value = '';
    if(inputRemitoClienteCUIT) inputRemitoClienteCUIT.value = '';
    if(remitoNumeroDisplay) remitoNumeroDisplay.textContent = 'Cargando...';
    if(remitoFechaDisplay) remitoFechaDisplay.textContent = '';
    renderizarListaProductos(productosCargados); 
}
function renderizarRemitoConIVA() { 
    console.log("[DEBUG PREPARAR REMITO] renderizarRemitoConIVA - INICIO. itemsSeleccionadosParaRemito:", JSON.stringify(itemsSeleccionadosParaRemito.map(i=>({id: i.productoId, cant: i.cantidadRemito, nombre: i.productoOriginal ? i.productoOriginal.nombre : 'SIN NOMBRE'}))));
    if(!remitoVisualizacion) {
        console.error("[DEBUG PREPARAR REMITO] Elemento remitoVisualizacion no encontrado en renderizarRemitoConIVA.");
        return;
    }
    remitoVisualizacion.innerHTML = ''; 
    if (itemsSeleccionadosParaRemito.length === 0) {
        remitoVisualizacion.innerHTML = '<p class="text-gray-500">No hay productos seleccionados para el remito.</p>'; 
        console.log("[DEBUG PREPARAR REMITO] No hay items para renderizar en remito.");
        return;
    }
    let subtotalGeneralSinIVA = 0, totalIVAGeneral = 0, totalGeneralConIVA = 0;
    const tabla = document.createElement('table');
    tabla.className = 'w-full text-sm text-left text-gray-700 mb-4';
    tabla.innerHTML = `<caption class="text-lg font-semibold text-sky-700 p-2 mb-2 bg-gray-100 rounded-t-lg">Detalle de Productos</caption><thead class="text-xs text-gray-700 uppercase bg-gray-200"><tr><th scope="col" class="px-4 py-3">Producto</th><th scope="col" class="px-4 py-3 text-center">Cant.</th><th scope="col" class="px-4 py-3 text-right">P. Base Unit.</th><th scope="col" class="px-4 py-3 text-right">IVA (21%) Unit.</th><th scope="col" class="px-4 py-3 text-right">P. Final Unit.</th><th scope="col" class="px-4 py-3 text-right">Subtotal c/IVA</th></tr></thead><tbody></tbody>`;
    const tbody = tabla.querySelector('tbody');
    itemsSeleccionadosParaRemito.forEach((seleccion) => {
        const item = seleccion.productoOriginal; 
        const cantidad = seleccion.cantidadRemito;
        if (!item || typeof item.precio === 'undefined' || item.precio === null) { 
            tbody.insertRow().innerHTML = `<td colspan="6" class="text-red-500 text-center py-2">Error: Datos incompletos para un producto.</td>`;
            return; 
        }
        const precioFinalUnitario = parseFloat(item.precio);
        const precioBaseUnitario = precioFinalUnitario / (1 + TASA_IVA);
        const ivaUnitario = precioFinalUnitario - precioBaseUnitario;
        const subtotalConIVA = cantidad * precioFinalUnitario;
        const subtotalSinIVA = cantidad * precioBaseUnitario;
        const ivaTotalProducto = cantidad * ivaUnitario;
        subtotalGeneralSinIVA += subtotalSinIVA;
        totalIVAGeneral += ivaTotalProducto;
        totalGeneralConIVA += subtotalConIVA;
        const fila = tbody.insertRow();
        fila.className = 'remito-item-tabla';
        fila.innerHTML = `<td class="px-4 py-2 font-medium">${item.nombre}</td><td class="px-4 py-2 text-center">${cantidad}</td><td class="px-4 py-2 text-right">$${precioBaseUnitario.toFixed(2)}</td><td class="px-4 py-2 text-right">$${ivaUnitario.toFixed(2)}</td><td class="px-4 py-2 text-right font-semibold">$${precioFinalUnitario.toFixed(2)}</td><td class="px-4 py-2 text-right font-semibold">$${subtotalConIVA.toFixed(2)}</td>`;
    });
    remitoVisualizacion.appendChild(tabla);
    const totalesDiv = document.createElement('div');
    totalesDiv.className = 'mt-6 pt-4 border-t-2 border-gray-300 text-right space-y-1';
    totalesDiv.innerHTML = `<p class="text-md"><span class="font-semibold">Subtotal sin IVA:</span> $${subtotalGeneralSinIVA.toFixed(2)}</p><p class="text-md"><span class="font-semibold">IVA (21%):</span> $${totalIVAGeneral.toFixed(2)}</p><p class="text-xl font-bold text-sky-700"><span class="font-semibold">TOTAL GENERAL:</span> $${totalGeneralConIVA.toFixed(2)}</p>`;
    remitoVisualizacion.appendChild(totalesDiv);
    console.log("[DEBUG PREPARAR REMITO] renderizarRemitoConIVA - FIN."); 
}

// --- Paginación de PRODUCTOS ---
function renderizarControlesPaginacionProductos(totalPaginas, paginaActualParam) {
    console.log(`[DEBUG PAGINACION PRODUCTOS] Renderizando controles - Total Páginas: ${totalPaginas}, Página Actual: ${paginaActualParam}`); 
    if (!paginacionProductosDiv) {
        console.warn("[DEBUG PAGINACION PRODUCTOS] Elemento paginacionProductosDiv no encontrado."); 
        return;
    }
    paginacionProductosDiv.innerHTML = ''; 

    if (!totalPaginas || totalPaginas <= 1) {
        console.log("[DEBUG PAGINACION PRODUCTOS] No se renderizan controles, totalPaginas <= 1."); 
        return;
    }

    const contenedorFlex = document.createElement('div');
    contenedorFlex.className = 'flex items-center justify-center space-x-3';

    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = 'Anterior';
    btnAnterior.className = 'px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50';
    if (paginaActualParam === 1) {
        btnAnterior.disabled = true;
        btnAnterior.classList.add('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
    }
    btnAnterior.addEventListener('click', () => {
        if (paginaActualParam > 1) {
            paginaActualProductos = paginaActualParam - 1;
            console.log(`[DEBUG PAGINACION PRODUCTOS] Clic Anterior. Nueva página: ${paginaActualProductos}`); 
            cargarProductos(paginaActualProductos);
        }
    });
    contenedorFlex.appendChild(btnAnterior);

    const indicadorPagina = document.createElement('span');
    indicadorPagina.className = 'text-sm text-gray-700';
    indicadorPagina.textContent = `Página ${paginaActualParam} de ${totalPaginas}`;
    contenedorFlex.appendChild(indicadorPagina);

    const btnSiguiente = document.createElement('button');
    btnSiguiente.textContent = 'Siguiente';
    btnSiguiente.className = 'px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50';
    if (paginaActualParam === totalPaginas) {
        btnSiguiente.disabled = true;
        btnSiguiente.classList.add('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
    }
    btnSiguiente.addEventListener('click', () => {
        if (paginaActualParam < totalPaginas) {
            paginaActualProductos = paginaActualParam + 1;
            console.log(`[DEBUG PAGINACION PRODUCTOS] Clic Siguiente. Nueva página: ${paginaActualProductos}`); 
            cargarProductos(paginaActualProductos);
        }
    });
    contenedorFlex.appendChild(btnSiguiente);

    paginacionProductosDiv.appendChild(contenedorFlex);
    console.log("[DEBUG PAGINACION PRODUCTOS] Controles de paginación renderizados."); 
}


//Inicialización y Asignación de Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG DOM] DOMContentLoaded - INICIO. Asignando variables y listeners...");
    try { 
        // Inicializar variables globales de elementos del DOM
        inputCodigoDeBarras = document.getElementById('codigoDeBarras');
        inputNombre = document.getElementById('nombre');
        inputPrecio = document.getElementById('precio');
        inputCategoria = document.getElementById('categoria');
        inputStock = document.getElementById('stock');
        inputProductoExistenteId = document.getElementById('producto-existente-id');
        btnSubmitAgregar = document.getElementById('btn-submit-agregar');
        btnLimpiarFormulario = document.getElementById('btn-limpiar-formulario');
        mensajeBusquedaCodigo = document.getElementById('mensaje-busqueda-codigo');
        mensajeFormulario = document.getElementById('mensaje-formulario');
        // console.log("[DEBUG DOM] Bloque 1 (Formulario Agregar) inicializado.");

        contenedorProductos = document.getElementById('contenedor-productos');
        mensajeLista = document.getElementById('mensaje-lista'); 
        inputBusquedaGeneral = document.getElementById('input-busqueda-general');
        selectOrdenarProductosPor = document.getElementById('select-ordenar-productos-por'); 
        selectOrdenProductosDireccion = document.getElementById('select-orden-productos-direccion'); 
        paginacionProductosDiv = document.getElementById('paginacion-productos'); 
        // console.log("[DEBUG DOM] Bloque 2 (Lista Productos) inicializado.");
        
        modalEditar = document.getElementById('modal-editar'); 
        const formularioAgregarLocalRef = document.getElementById('formulario-agregar-producto'); 
        const formularioEditarProductoLocalRef = document.getElementById('formulario-editar-producto'); 
        const btnCerrarModalLocalRef = document.getElementById('btn-cerrar-modal'); 
        const btnCancelarEdicionLocalRef = document.getElementById('btn-cancelar-edicion'); 
        // console.log("[DEBUG DOM] Bloque 3 (Modal Editar) inicializado. modalEditar:", !!modalEditar);


        btnPrepararRemito = document.getElementById('btn-preparar-remito');
        seccionRemito = document.getElementById('remito-seccion');
        remitoVisualizacion = document.getElementById('remito-visualizacion');
        mensajeRemito = document.getElementById('mensaje-remito'); 
        btnCancelarRemito = document.getElementById('btn-cancelar-remito');
        btnConfirmarGuardarRemito = document.getElementById('btn-confirmar-guardar-remito');
        btnImprimirRemito = document.getElementById('btn-imprimir-remito');
        btnEnviarRemitoCorreo = document.getElementById('btn-enviar-remito-correo');
        remitoNumeroDisplay = document.getElementById('remito-numero-display');
        remitoFechaDisplay = document.getElementById('remito-fecha-display');
        inputRemitoClienteNombre = document.getElementById('remito-cliente-nombre');
        inputRemitoClienteCUIT = document.getElementById('remito-cliente-cuit');
         console.log("[DEBUG DOM] Bloque 4 (Remito) inicializado. btnPrepararRemito:", !!btnPrepararRemito);

        genericModal = document.getElementById('generic-modal');
        genericModalTitulo = document.getElementById('generic-modal-titulo');
        genericModalMensaje = document.getElementById('generic-modal-mensaje');
        genericModalBotones = document.getElementById('generic-modal-botones');
        genericModalBtnCerrarX = document.getElementById('generic-modal-btn-cerrar-x');
        console.log("[DEBUG DOM] Bloque 5 (Modal Genérico) inicializado. genericModal:", !!genericModal, "genericModalBtnCerrarX:", !!genericModalBtnCerrarX); 

        console.log("[DEBUG DOM] DOMContentLoaded - Variables de elementos DOM inicializadas. Llamando a cargarProductos...");
        cargarProductos(paginaActualProductos); 
        
        if (formularioAgregarLocalRef) {
            formularioAgregarLocalRef.addEventListener('submit', async (event) => { 
                event.preventDefault();
                const idExistente = inputProductoExistenteId.value;
                const datosProducto = {
                    nombre: inputNombre.value.trim(),
                    precio: parseFloat(inputPrecio.value),
                    categoria: inputCategoria.value.trim() || 'General',
                    stock: parseInt(inputStock.value, 10),
                    codigoDeBarras: inputCodigoDeBarras.value.trim() || null
                };
                if (!datosProducto.nombre || isNaN(datosProducto.precio) || datosProducto.precio < 0 || isNaN(datosProducto.stock) || datosProducto.stock < 0) {
                    mostrarModalMensaje('Error de Validación', 'Por favor, complete nombre, precio y stock con valores válidos.', 'error');
                    return;
                }
                if (datosProducto.codigoDeBarras === "") datosProducto.codigoDeBarras = null;
                let url = BASE_URL;
                let method = 'POST';
                let mensajeAccion = 'Agregando';
                let mensajeExito = 'agregado';
                if (idExistente) {
                    url += `/${idExistente}`;
                    method = 'PUT';
                    mensajeAccion = 'Actualizando';
                    mensajeExito = 'actualizado';
                }
                mostrarModalMensaje("Procesando...", `${mensajeAccion} producto...`, 'info', false);
                try {
                    const resultado = await fetchAPI(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosProducto) });
                    cerrarGenericModal(); 
                    mostrarModalMensaje("Éxito", `Producto "${resultado.nombre}" ${mensajeExito} con éxito.`, 'exito');
                    limpiarCamposFormularioAgregar(true); 
                    cargarProductos(1); 
                } catch (error) {
                    cerrarGenericModal();
                    mostrarModalMensaje("Error", `Error al ${mensajeAccion.toLowerCase()} producto: ${error.message}`, 'error');
                }
            });
        } 

        if(btnLimpiarFormulario) {
            btnLimpiarFormulario.addEventListener('click', () => limpiarCamposFormularioAgregar(true));
        } 

        if (inputCodigoDeBarras) {
            inputCodigoDeBarras.addEventListener('keypress', async (event) => { 
                if (event.key === 'Enter') {
                    event.preventDefault(); 
                    buscarProductoPorCodigo();
                }
            });
            inputCodigoDeBarras.addEventListener('blur', buscarProductoPorCodigo);
        }

        if (formularioEditarProductoLocalRef) {
            formularioEditarProductoLocalRef.addEventListener('submit', async (event) => { 
                console.log("[DEBUG EDITAR PRODUCTO] Submit del formulario de edición detectado."); 
                event.preventDefault();
                const id = document.getElementById('edit-producto-id').value; 
                const mensajeModalEdicion = document.getElementById('mensaje-modal'); 
                const datosActualizados = {
                    nombre: document.getElementById('edit-nombre').value.trim(),
                    precio: parseFloat(document.getElementById('edit-precio').value),
                    categoria: document.getElementById('edit-categoria').value.trim() || 'General',
                    stock: parseInt(document.getElementById('edit-stock').value, 10),
                    codigoDeBarras: document.getElementById('edit-codigoDeBarras').value.trim() || null
                };
                if (datosActualizados.codigoDeBarras === "") datosActualizados.codigoDeBarras = null;

                if (!datosActualizados.nombre || isNaN(datosActualizados.precio) || datosActualizados.precio < 0 || isNaN(datosActualizados.stock) || datosActualizados.stock < 0) {
                    mostrarModalMensaje('Error de Validación', 'Por favor, complete todos los campos con valores válidos.', 'error', true, mensajeModalEdicion);
                    return;
                }
                mostrarModalMensaje("Guardando...", 'Guardando cambios...', 'info', false, mensajeModalEdicion);
                try {
                    const resultado = await fetchAPI(`${BASE_URL}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosActualizados) });
                    if(mensajeModalEdicion) mensajeModalEdicion.textContent = ''; 
                    mostrarModalMensaje("Éxito", `Producto "${resultado.nombre}" actualizado.`, 'exito', true, mensajeModalEdicion);
                    setTimeout(() => {
                        cerrarModalEditar();
                        cargarProductos(paginaActualProductos); 
                    }, 1500);
                } catch (error) {
                    if(mensajeModalEdicion) mensajeModalEdicion.textContent = '';
                    mostrarModalMensaje("Error", `Error al actualizar: ${error.message}`, 'error', true, mensajeModalEdicion);
                }
            });
        } 

        if (btnCerrarModalLocalRef) btnCerrarModalLocalRef.addEventListener('click', cerrarModalEditar);
        if (btnCancelarEdicionLocalRef) btnCancelarEdicionLocalRef.addEventListener('click', cerrarModalEditar);
        if (modalEditar) modalEditar.addEventListener('click', (event) => { if (event.target === modalEditar) cerrarModalEditar(); });

        if(btnPrepararRemito) { 
            btnPrepararRemito.addEventListener('click', async () => { 
                console.log("[DEBUG PREPARAR REMITO] Botón 'Preparar Remito' clickeado."); 
                console.log("[DEBUG PREPARAR REMITO] itemsSeleccionadosParaRemito ANTES de validación:", JSON.stringify(itemsSeleccionadosParaRemito.map(i=>({id: i.productoId, cant: i.cantidadRemito, nombre: i.productoOriginal ? i.productoOriginal.nombre : 'SIN NOMBRE'})))); 

                if (itemsSeleccionadosParaRemito.length === 0) {
                    mostrarModalMensaje("Atención", 'Seleccione al menos un producto y especifique la cantidad para el remito.', 'advertencia'); 
                    console.log("[DEBUG PREPARAR REMITO] No hay items seleccionados."); 
                    return;
                }
                
                let errorEnCantidades = false;
                for (const selItem of itemsSeleccionadosParaRemito) {
                    if (!selItem.productoOriginal) {
                        mostrarModalMensaje("Error Interno", `No se encontraron datos completos para el producto ID: ${selItem.productoId}. Recargue la lista de productos.`, 'error');
                        errorEnCantidades = true; break;
                    }
                    if (selItem.cantidadRemito > selItem.productoOriginal.stock) {
                        mostrarModalMensaje("Error de Stock", `Cantidad para "${selItem.productoOriginal.nombre}" (${selItem.cantidadRemito}) excede stock (${selItem.productoOriginal.stock}). Ajuste la cantidad.`, 'error');
                        errorEnCantidades = true; break;
                    }
                    if (selItem.cantidadRemito < 1) {
                        mostrarModalMensaje("Error de Cantidad", `Cantidad para "${selItem.productoOriginal.nombre}" debe ser al menos 1.`, 'error');
                        errorEnCantidades = true; break;
                    }
                }
                if (errorEnCantidades) {
                    console.log("[DEBUG PREPARAR REMITO] Error en cantidades detectado."); 
                    return;
                }

                console.log("[DEBUG PREPARAR REMITO] Pasó validación de cantidades. Mostrando sección remito."); 
                await obtenerYMostrarProximoNumeroRemito(); 
                if(remitoFechaDisplay) remitoFechaDisplay.textContent = new Date().toLocaleDateString('es-AR');
                if(inputRemitoClienteNombre) inputRemitoClienteNombre.value = ''; 
                if(inputRemitoClienteCUIT) inputRemitoClienteCUIT.value = '';
                
                mostrarSeccionRemito();
                renderizarRemitoConIVA(); 
                if(mensajeLista) mensajeLista.textContent = '';
            });
        } else {
            console.warn("[DEBUG DOM] Botón 'Preparar Remito' (btnPrepararRemito) no encontrado.");
        }

        if(btnCancelarRemito) btnCancelarRemito.addEventListener('click', ocultarSeccionRemito);
        if(btnConfirmarGuardarRemito) btnConfirmarGuardarRemito.addEventListener('click', async () => {
            const clienteNombre = inputRemitoClienteNombre.value.trim();
            const clienteCUIT = inputRemitoClienteCUIT.value.trim();
            if (!clienteNombre) {
                mostrarModalMensaje("Datos Incompletos", 'Por favor, ingrese el nombre del cliente.', 'advertencia', true, mensajeRemito);
                inputRemitoClienteNombre.focus(); return;
            }
            if (itemsSeleccionadosParaRemito.length === 0) {
                mostrarModalMensaje("Sin Items", 'No hay productos en el remito para guardar.', 'advertencia', true, mensajeRemito); return;
            }
            let subtotalSinIVAEnc = 0, totalIVAEnc = 0, totalConIVAEnc = 0;
            const itemsParaGuardarBackend = itemsSeleccionadosParaRemito.map(selItem => {
                const item = selItem.productoOriginal;
                const cantidad = selItem.cantidadRemito;
                const precioFinalUnitario = parseFloat(item.precio);
                const precioBaseUnitario = precioFinalUnitario / (1 + TASA_IVA);
                const ivaUnitario = precioFinalUnitario - precioBaseUnitario;
                const subtotalItemConIVA = cantidad * precioFinalUnitario;
                subtotalSinIVAEnc += cantidad * precioBaseUnitario;
                totalIVAEnc += cantidad * ivaUnitario;
                totalConIVAEnc += subtotalItemConIVA;
                return {
                    productoId: item.id, nombreProducto: item.nombre, codigoDeBarrasProducto: item.codigoDeBarras || null,
                    cantidad: cantidad, precioBaseUnitario: parseFloat(precioBaseUnitario.toFixed(2)),
                    ivaUnitario: parseFloat(ivaUnitario.toFixed(2)), precioFinalUnitario: parseFloat(precioFinalUnitario.toFixed(2)),
                    subtotalItemConIVA: parseFloat(subtotalItemConIVA.toFixed(2))
                };
            });
            const datosRemito = {
                encabezado: {
                    clienteNombre: clienteNombre, clienteCUIT: clienteCUIT || null,
                    subtotalSinIVA: parseFloat(subtotalSinIVAEnc.toFixed(2)),
                    totalIVA: parseFloat(totalIVAEnc.toFixed(2)),
                    totalConIVA: parseFloat(totalConIVAEnc.toFixed(2))
                },
                items: itemsParaGuardarBackend
            };
            mostrarModalMensaje("Procesando...", 'Guardando remito y actualizando stock...', 'info', false, mensajeRemito);
            btnConfirmarGuardarRemito.disabled = true; btnCancelarRemito.disabled = true; btnImprimirRemito.disabled = true; btnEnviarRemitoCorreo.disabled = true;
            try {
                const remitoGuardado = await fetchAPI(REMITO_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosRemito) });
                cerrarGenericModal(); 
                mostrarModalMensaje("Éxito", `Remito N° ${remitoGuardado.id.toString().padStart(6, '0')} guardado. Actualizando stock...`, 'info', false, mensajeRemito);
                let todasLasActualizacionesExitosas = true; const erroresDeActualizacion = [];
                for (const selItem of itemsSeleccionadosParaRemito) { 
                    const itemOriginal = selItem.productoOriginal;
                    const cantidadSalida = selItem.cantidadRemito;
                    const nuevoStock = itemOriginal.stock - cantidadSalida;
                    try {
                        await fetchAPI(`${BASE_URL}/${itemOriginal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: nuevoStock }) });
                    } catch (error) {
                        todasLasActualizacionesExitosas = false; erroresDeActualizacion.push(`Error al actualizar stock para ${itemOriginal.nombre}: ${error.message}`);
                    }
                }
                cerrarGenericModal(); 
                if (todasLasActualizacionesExitosas) {
                    mostrarModalMensaje("Completado", `Remito N° ${remitoGuardado.id.toString().padStart(6, '0')} guardado y stock actualizado exitosamente.`, 'exito', true, mensajeRemito);
                    setTimeout(() => {
                        ocultarSeccionRemito(); 
                        cargarProductos(paginaActualProductos); 
                        if(typeof cargarHistorialRemitos === 'function') cargarHistorialRemitos(1); 
                    }, 3000);
                } else {
                    const mensajeErrorCompleto = `Remito N° ${remitoGuardado.id.toString().padStart(6, '0')} guardado, pero algunos productos no pudieron actualizar su stock: \n` + erroresDeActualizacion.join('\n');
                    mostrarModalMensaje("Error Parcial", mensajeErrorCompleto, 'error', false, mensajeRemito); 
                    cargarProductos(paginaActualProductos);
                }
            } catch (error) {
                cerrarGenericModal();
                mostrarModalMensaje("Error", `Error al guardar remito: ${error.message}`, 'error', false, mensajeRemito);
            } finally {
                btnConfirmarGuardarRemito.disabled = false; btnCancelarRemito.disabled = false; btnImprimirRemito.disabled = false; btnEnviarRemitoCorreo.disabled = false;
            }
        });
    if(btnImprimirRemito) { 
        btnImprimirRemito.addEventListener('click', () => { 
            if (itemsSeleccionadosParaRemito.length === 0) { 
                mostrarModalMensaje("Atención", 'No hay nada que imprimir en el remito actual.', 'advertencia', true, mensajeRemito); 
                return; 
            }
            window.print(); 
        });
    }
    if(btnEnviarRemitoCorreo) { /* ... (sin cambios) ... */ }

    if(inputBusquedaGeneral) inputBusquedaGeneral.addEventListener('input', () => { 
        clearTimeout(timeoutIdBusquedaGeneral); 
        timeoutIdBusquedaGeneral = setTimeout(() => {
            paginaActualProductos = 1; 
            cargarProductos(paginaActualProductos);
        }, 500); 
    });
    if (selectOrdenarProductosPor) {
        selectOrdenarProductosPor.addEventListener('change', () => {
            paginaActualProductos = 1; 
            cargarProductos(paginaActualProductos);
        });
    }
    if (selectOrdenProductosDireccion) {
        selectOrdenProductosDireccion.addEventListener('change', () => {
            paginaActualProductos = 1; 
            cargarProductos(paginaActualProductos);
        });
    }

    // Listener para el botón X del modal genérico
    if (genericModalBtnCerrarX) {
        console.log("[DEBUG DOM] Asignando listener a genericModalBtnCerrarX"); 
        genericModalBtnCerrarX.addEventListener('click', () => {
            console.log("[DEBUG MODAL CIERRE] Botón X (superior) del modal GENÉRICO clickeado."); 
            cerrarGenericModal();
        });
    } else {
        console.warn("[DEBUG DOM] Botón genericModalBtnCerrarX no encontrado."); 
    }
    // Listener para clics fuera del modal genérico
    if (genericModal) {
        genericModal.addEventListener('click', (event) => {
            if (event.target === genericModal) {
                console.log("[DEBUG MODAL CIERRE] Clic en el fondo del modal GENÉRICO detectado."); 
                cerrarGenericModal();
            }
        });
    }
    console.log("[DEBUG DOM] DOMContentLoaded - FIN. Listeners asignados y carga inicial de productos llamada."); 
    } catch (error) {
        console.error("[DEBUG DOM] ERROR en DOMContentLoaded:", error); 
    }
}); // Fin de DOMContentLoaded
//</script>