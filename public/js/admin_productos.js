// public/js/admin_productos.js
// Este script controla la página de administración de productos (agregar_productos.html)

import { fetchAPI,initUtils, mostrarModalConfirmacion, mostrarModalMensaje, cerrarGenericModal } from './utils.js';

// --- Constantes y Variables Globales ---
const BASE_URL = 'http://localhost:3001/api/productos'; 
const UMBRAL_BAJO_STOCK = 5;

let productosCargados = []; 
let paginaActualProductos = 1;
const limitePorPaginaProductos = 8;
let timeoutIdBusquedaGeneral;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, asignamos los listeners y cargamos la lista de productos
    setupEventListeners();
    cargarProductos();
    initUtils(); // Inicializamos los utils para manejar el modal genérico
});

// --- LÓGICA DEL FORMULARIO DE AGREGAR/EDITAR ---
async function handleFormSubmit(event) {
    event.preventDefault();
    const formulario = event.target;
    
    const datosProducto = {
        nombre: formulario.querySelector('#nombre').value.trim(),
        precio: parseFloat(formulario.querySelector('#precio').value),
        categoria: formulario.querySelector('#categoria').value.trim() || 'General',
        stock: parseInt(formulario.querySelector('#stock').value, 10),
        codigoDeBarras: formulario.querySelector('#codigoDeBarras').value.trim() || null
    };

    if (!datosProducto.nombre || isNaN(datosProducto.precio) || isNaN(datosProducto.stock)) {
        mostrarModalMensaje('Error de Validación', 'Nombre, precio y stock son obligatorios y deben ser valores válidos.', 'error');
        return;
    }

    const idExistente = formulario.querySelector('#producto-existente-id').value;
    let url = BASE_URL;
    let method = 'POST';
    let mensajeExito = 'agregado';

    if (idExistente) {
        url += `/${idExistente}`;
        method = 'PUT';
        mensajeExito = 'actualizado';
    }

    try {
        mostrarModalMensaje("Procesando...", "Guardando producto...", 'info', false);
        const resultado = await fetchAPI(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosProducto)
        });
        
        mostrarModalMensaje("Éxito", `Producto "${resultado.nombre}" ${mensajeExito} con éxito.`, 'exito');
        limpiarFormulario();
        cargarProductos(1); // Recargamos la lista para ver el nuevo producto
    } catch (error) {
        mostrarModalMensaje("Error", `No se pudo guardar: ${error.message}`, 'error');
    } finally {
        cerrarGenericModal();
    }
}

function limpiarFormulario() {
    const formulario = document.getElementById('formulario-agregar-producto');
    if (formulario) {
        formulario.reset();
        document.getElementById('producto-existente-id').value = '';
        document.getElementById('btn-submit-agregar').textContent = 'Agregar Nuevo Producto';
        document.getElementById('nombre').focus();
    }
}

// --- LÓGICA DE PRODUCTOS (LISTA, PAGINACIÓN, EDICIÓN, ELIMINACIÓN) ---

async function cargarProductos(pagina = 1) {
    const contenedorProductos = document.getElementById('contenedor-productos');
    if (!contenedorProductos) return;

    paginaActualProductos = pagina;
    
    const terminoBusqueda = document.getElementById('input-busqueda-general')?.value.trim() || "";
    const ordenarPor = document.getElementById('select-ordenar-productos-por')?.value || "nombre";
    const ordenDireccion = document.getElementById('select-orden-productos-direccion')?.value || "ASC";
    
    const url = new URL(BASE_URL);
    url.searchParams.set('pagina', pagina);
    url.searchParams.set('limite', limitePorPaginaProductos);
    if(terminoBusqueda) url.searchParams.set('q', terminoBusqueda);
    url.searchParams.set('ordenarPor', ordenarPor);
    url.searchParams.set('ordenDireccion', ordenDireccion);

    try {
        const data = await fetchAPI(url.toString());
        productosCargados = data.productos || data.rows || [];
        renderizarListaProductos(productosCargados);
        renderizarControlesPaginacion(data.totalPaginas, data.paginaActual);
    } catch (error) {
        mostrarModalMensaje("Error", `Error al cargar productos: ${error.message}`, "error");
    }
}

function renderizarListaProductos(productos) {
    const contenedorProductos = document.getElementById('contenedor-productos');
    const mensajeLista = document.getElementById('mensaje-lista');
    contenedorProductos.innerHTML = '';

    if (productos.length === 0) {
        if (mensajeLista) mensajeLista.textContent = 'No se encontraron productos.';
        return;
    }
    if (mensajeLista) mensajeLista.textContent = '';

    productos.forEach(producto => {
        contenedorProductos.appendChild(crearElementoProducto(producto));
    });
}

// Versión SIMPLIFICADA de la tarjeta, sin lógica de remitos
function crearElementoProducto(producto) {
    const div = document.createElement('div');
    div.className = `producto-item bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col`;
    div.dataset.productoId = producto.id;

    let stockStatusHTML = '';
    if (producto.stock === 0) {
        div.classList.add('border-2', 'border-red-400', 'bg-red-50');
        stockStatusHTML = `<p class="text-xs font-semibold text-red-600 mt-1">AGOTADO</p>`;
    } else if (producto.stock > 0 && producto.stock <= UMBRAL_BAJO_STOCK) {
        div.classList.add('border-2', 'border-yellow-400', 'bg-yellow-50');
        stockStatusHTML = `<p class="text-xs font-semibold text-yellow-600 mt-1">BAJO STOCK (${producto.stock} u.)</p>`;
    }

    div.innerHTML = `
        <div class="flex-grow">
            <h3 class="text-xl font-semibold text-sky-700 truncate" title="${producto.nombre}">${producto.nombre}</h3>
            <p class="text-gray-600 text-sm mb-1"><span class="font-medium">Cód. Barras:</span> ${producto.codigoDeBarras || 'N/A'}</p>
            <p class="text-gray-600 text-sm mb-1"><span class="font-medium">Categoría:</span> ${producto.categoria || 'N/A'}</p>
            <p class="text-gray-800 font-bold text-lg mb-1">Precio: $${parseFloat(producto.precio).toFixed(2)}</p>
            <p class="text-gray-600 text-sm mb-1">Stock: <span class="stock-disponible">${producto.stock}</span></p>
            ${stockStatusHTML}
        </div>
        <div class="mt-4 pt-4 border-t flex justify-end space-x-2 no-print">
            <button class="btn-editar bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg text-sm" data-id="${producto.id}">Editar</button>
            <button class="btn-eliminar bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm" data-id="${producto.id}">Eliminar</button>
        </div>
    `;
    return div;
}

// --- FUNCIÓN DE PAGINACIÓN COMPLETA ---
function renderizarControlesPaginacion(totalPaginas, pagActual) {
    const paginacionDiv = document.getElementById('paginacion-productos');
    if (!paginacionDiv) return;
    paginacionDiv.innerHTML = '';
    if (!totalPaginas || totalPaginas <= 1) return;

    const createButton = (text, page, isDisabled) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `px-4 py-2 border rounded-md text-sm ${isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`;
        button.disabled = isDisabled;
        if (!isDisabled) {
            button.addEventListener('click', () => cargarProductos(page));
        }
        return button;
    };
    
    paginacionDiv.appendChild(createButton('Anterior', pagActual - 1, pagActual === 1));
    const pageInfo = document.createElement('span');
    pageInfo.className = 'px-4 py-2 text-sm';
    pageInfo.textContent = `Página ${pagActual} de ${totalPaginas}`;
    paginacionDiv.appendChild(pageInfo);
    paginacionDiv.appendChild(createButton('Siguiente', pagActual + 1, pagActual >= totalPaginas));
}

function poblarFormularioParaEditar(producto) {
    document.getElementById('producto-existente-id').value = producto.id;
    document.getElementById('nombre').value = producto.nombre;
    document.getElementById('precio').value = producto.precio;
    document.getElementById('categoria').value = producto.categoria || '';
    document.getElementById('stock').value = producto.stock;
    document.getElementById('codigoDeBarras').value = producto.codigoDeBarras || '';
    document.getElementById('btn-submit-agregar').textContent = 'Actualizar Producto';
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Llevamos al usuario arriba para editar
}

function confirmarEliminacion(id, nombre) {
    mostrarModalConfirmacion("Confirmar Eliminación", `¿Seguro que quieres eliminar "${nombre}"?`, () => eliminarProducto(id));
}

async function eliminarProducto(id) {
    try {
        await fetchAPI(`${BASE_URL}/${id}`, { method: 'DELETE' });
        mostrarModalMensaje("Éxito", "Producto eliminado con éxito.", "exito");
        cargarProductos(paginaActualProductos);
    } catch (error) {
        mostrarModalMensaje("Error", `No se pudo eliminar: ${error.message}`, "error");
    }
}

// --- ASIGNACIÓN DE EVENT LISTENERS ---
function setupEventListeners() {
    const formulario = document.getElementById('formulario-agregar-producto');
    if (formulario) formulario.addEventListener('submit', handleFormSubmit);

    const btnLimpiar = document.getElementById('btn-limpiar-formulario');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFormulario);

    const inputBusqueda = document.getElementById('input-busqueda-general');
    if (inputBusqueda) inputBusqueda.addEventListener('input', () => { 
        clearTimeout(timeoutIdBusquedaGeneral); 
        timeoutIdBusquedaGeneral = setTimeout(() => cargarProductos(1), 500); 
    });
    
    const contenedorProductos = document.getElementById('contenedor-productos');
    if (contenedorProductos) {
        contenedorProductos.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-editar')) {
                const id = e.target.dataset.id;
                const producto = productosCargados.find(p => p.id == id);
                if (producto) poblarFormularioParaEditar(producto);
            }
            if (e.target.classList.contains('btn-eliminar')) {
                const id = e.target.dataset.id;
                const producto = productosCargados.find(p => p.id == id);
                if (producto) confirmarEliminacion(id, producto.nombre);
            }
        });
    }
}
