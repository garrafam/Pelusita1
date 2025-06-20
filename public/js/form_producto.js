// script.js (Principal)
import { fetchAPI,mostrarModalConfirmacion, mostrarModalMensaje, cerrarGenericModal } from './utils.js';

const BASE_URL = 'http://localhost:3001/api/productos'; 
const REMITO_API_URL = 'http://localhost:3001/api/remitos';
const TASA_IVA = 0.21; 
const UMBRAL_BAJO_STOCK = 5; 


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


// --- Funciones API ---
/*async function fetchAPI(url, options = {}) {
    const respuesta = await fetch(url, options);
    if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({ message: respuesta.statusText }));
        let errorMessage = errorData.message || `Error HTTP ${respuesta.status}`;
        if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage += ": " + errorData.errors.map(e => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ');
        }
        throw new Error(errorMessage);
    }
    if (respuesta.status === 204) return {}; 
    return respuesta.json().catch(() => ({}));
}
*/
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
function limpiarCamposFormularioAgregar(limpiarCodigoBarras = true) {  // --- INSTRUCCIONES PARA LIMPIAR ---

  // Busca el elemento con el ID 'id-del-input-nombre' y pone su valor en blanco.
  document.getElementById('nombre').value = '';
  
  document.getElementById('precio').value = '';
  document.getElementById('stock').value = '';
  document.getElementById('categoria').value = '';

  if (limpiarCodigoBarras) {
    document.getElementById('codigoDeBarras').value = '';
  }
  
  // Opcional: Esto pone el cursor de vuelta en el primer campo,
  // listo para que el usuario escriba el siguiente producto.
  document.getElementById('nombre').focus();
}

// --- Funciones CRUD (Eliminar) ---
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
function cerrarModalEditar() { 
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


// --- NUEVAS FUNCIONES PARA MODAL GENÉRICO ---
/*function mostrarModalMensaje(titulo, mensaje, tipo = 'info', autoCerrar = true, elementoMensajeAlternativo = null) */{ /* ... (código sin cambios) ... */ }
/*
function mostrarModalConfirmacion(titulo, mensaje, callbackConfirmar, callbackCancelar = null) { 
    console.log("[DEBUG MODAL CONFIRM] Entrando a mostrarModalConfirmacion. Título:", titulo); 
    if (!genericModal || !genericModalTitulo || !genericModalMensaje || !genericModalBotones) {
        console.error("[DEBUG MODAL CONFIRM] ERROR: Elementos del modal genérico NO encontrados. Usando confirm() nativo."); 
        if (confirm(mensaje)) { 
            if (callbackConfirmar) callbackConfirmar();
        } else {
            if (callbackCancelar) callbackCancelar();
        }
        return;
    }
    console.log("[DEBUG MODAL CONFIRM] Elementos del modal genérico encontrados. genericModal:", !!genericModal, "genericModalTitulo:", !!genericModalTitulo, "genericModalMensaje:", !!genericModalMensaje, "genericModalBotones:", !!genericModalBotones); 

    genericModalTitulo.textContent = titulo;
    genericModalMensaje.innerHTML = `<p>${mensaje.replace(/\n/g, '<br>')}</p>`;
    genericModalTitulo.className = 'text-xl font-semibold text-yellow-600'; 

    genericModalBotones.innerHTML = ''; 

    const btnConfirmar = document.createElement('button');
    btnConfirmar.textContent = 'Confirmar';
    btnConfirmar.className = 'px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md';
    btnConfirmar.addEventListener('click', () => {
        console.log("[DEBUG MODAL CONFIRM] Botón Confirmar clickeado."); 
        cerrarGenericModal();
        if (callbackConfirmar) callbackConfirmar();
    });

    const btnCancelarModalGen = document.createElement('button'); 
    btnCancelarModalGen.textContent = 'Cancelar';
    btnCancelarModalGen.className = 'px-5 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg';
    btnCancelarModalGen.addEventListener('click', () => {
        console.log("[DEBUG MODAL CONFIRM] Botón Cancelar clickeado."); 
        cerrarGenericModal();
        if (callbackCancelar) callbackCancelar();
    });

    genericModalBotones.appendChild(btnCancelarModalGen);
    genericModalBotones.appendChild(btnConfirmar);

    genericModal.classList.remove('hidden');
    genericModal.classList.add('flex');
    console.log("[DEBUG MODAL CONFIRM] Modal genérico debería estar visible para confirmación."); 
    setTimeout(() => {
        const content = genericModal.querySelector('.generic-modal-content');
        if (content) {
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }
    }, 10);
}
function cerrarGenericModal() {
    console.log("[DEBUG MODAL CIERRE] Función cerrarGenericModal llamada.");
    if (!genericModal) {
        console.error("[DEBUG MODAL CIERRE] Elemento genericModal no encontrado.");
        return;
    }
    console.log("[DEBUG MODAL CIERRE] Clases ANTES de cerrar:", genericModal.className);
    genericModal.classList.add('hidden');   
    genericModal.classList.remove('flex');  
    console.log("[DEBUG MODAL CIERRE] Clases DESPUÉS de cerrar:", genericModal.className);

    const content = genericModal.querySelector('.generic-modal-content');
    if (content) {
        content.classList.remove('scale-100'); 
        content.classList.add('scale-95');
    }
}
*/

// --- Inicialización y Asignación de Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
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
                    console.log("❌ ERROR CAPTURADO EN EL CATCH:", error);
  console.error(error); // Usamos console.error para que se vea más claro
                    cerrarGenericModal();
                    mostrarModalMensaje("Error", `Error al ${mensajeAccion.toLowerCase()} producto: ${error.message}`, 'error');
                }
               // Dentro de tu addEventListener...

try {
    console.log("Paso 1: Entrando al bloque 'try'. A punto de llamar a la API...");
    
    // Tu llamada a la API
    const resultado = await fetchAPI(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosProducto) });
    
    // Si llegamos aquí, la API respondió algo que fetchAPI consideró "ok"
    console.log("Paso 2: La llamada a la API terminó. Respuesta del servidor:", resultado);

    cerrarGenericModal(); 
    console.log("Paso 3: Modal genérico cerrado.");
    
    mostrarModalMensaje("Éxito", `Producto "${resultado.nombre}" ${mensajeExito} con éxito.`, 'exito');
    console.log("Paso 4: Modal de éxito mostrado.");
    
    limpiarCamposFormularioAgregar(true); 
    console.log("Paso 5: Función de limpieza del formulario llamada.");
    
    cargarProductos(1); 
    console.log("Paso 6: Función para recargar productos llamada. Proceso de éxito completado.");

} catch (error) {
    // Si algo en el 'try' falla, el código saltará directamente aquí
    console.log("❌ ¡ERROR! El código saltó al 'catch'. El error es el siguiente:");
    console.error(error); // Usamos console.error para que se vea más claro en la consola
    
    // Tus funciones para manejar el error
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
