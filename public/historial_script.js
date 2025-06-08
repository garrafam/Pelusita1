// historial_script.js

const REMITO_API_URL = 'http://localhost:3001/api/remitos';
const TASA_IVA = 0.21; 

// --- Declaraciones de Elementos del DOM para esta página ---
let contenedorHistorialRemitos, mensajeHistorialRemitos, btnRecargarHistorial,
    inputBusquedaRemitoCliente, 
    selectOrdenarPor, selectOrdenDireccion, 
    inputFechaDesde, inputFechaHasta, btnAplicarFiltrosHistorial, 
    paginacionHistorialRemitosDiv,
    resumenHistorialRemitosDiv, // NUEVO para el resumen
    modalVerRemito, btnCerrarModalVerRemito, detalleRemitoGuardadoContenido,
    btnImprimirRemitoGuardado, btnCerrarModalVerRemitoAbajo;

let timeoutIdBusquedaRemito; 
let remitosGuardados = []; 
let paginaActualHistorial = 1;
const limitePorPaginaHistorial = 5; 

// --- Funciones API ---
async function fetchAPI(url, options = {}) {
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

// --- Historial de Remitos ---
async function cargarHistorialRemitos(pagina = 1, filtroClienteNombre = "", ordenarPor = "fecha", ordenDireccion = "DESC", fechaDesde = "", fechaHasta = "") { 
    if (!mensajeHistorialRemitos || !contenedorHistorialRemitos || !resumenHistorialRemitosDiv) {
        console.warn("Elementos para historial de remitos o resumen no encontrados.");
        return;
    }
    mostrarMensaje(mensajeHistorialRemitos, "Cargando historial de remitos...", "info", false);
    resumenHistorialRemitosDiv.innerHTML = '<p class="text-center">Calculando resumen...</p>'; 

    let url = new URL(REMITO_API_URL); 
    
    if (filtroClienteNombre) url.searchParams.append('clienteNombre', filtroClienteNombre);
    if (ordenarPor) url.searchParams.append('ordenarPor', ordenarPor);
    if (ordenDireccion) url.searchParams.append('ordenDireccion', ordenDireccion);
    if (fechaDesde) url.searchParams.append('fechaDesde', fechaDesde);
    if (fechaHasta) url.searchParams.append('fechaHasta', fechaHasta);
    
    url.searchParams.append('pagina', pagina); 
    url.searchParams.append('limite', limitePorPaginaHistorial); 

    try {
        const data = await fetchAPI(url.toString()); 

        if (data && typeof data === 'object' && Array.isArray(data.remitos)) {
            remitosGuardados = data.remitos;
            renderizarHistorialRemitos(remitosGuardados);
            renderizarControlesPaginacionRemitos(data.totalPaginas, data.paginaActual); 
            renderizarResumenHistorial(data.totalItems, data.sumaTotalConIVA); // LLAMADA A LA NUEVA FUNCIÓN
        } else {
            console.error("Estructura de datos inesperada del backend para el historial:", data);
            remitosGuardados = [];
            renderizarHistorialRemitos([]);
            renderizarControlesPaginacionRemitos(0,1);
            renderizarResumenHistorial(0, 0); 
        }

        if (remitosGuardados.length === 0) {
            let msg = "No hay remitos guardados.";
            if(filtroClienteNombre || fechaDesde || fechaHasta) msg = `No se encontraron remitos con los filtros aplicados.`;
            mensajeHistorialRemitos.textContent = msg;
            mensajeHistorialRemitos.className = 'mt-4 text-sm text-center text-gray-500';
            // Si no hay remitos, el resumen también debería reflejarlo (ya lo hace renderizarResumenHistorial)
        } else {
            mensajeHistorialRemitos.textContent = '';
        }
    } catch (error) {
        console.error("Error al cargar historial de remitos:", error);
        mostrarMensaje(mensajeHistorialRemitos, `Error al cargar historial: ${error.message}`, 'error');
        renderizarControlesPaginacionRemitos(0,1); 
        renderizarResumenHistorial(0, 0); 
    }
}

function renderizarHistorialRemitos(listaDeRemitos) {
    if (!contenedorHistorialRemitos) return;
    contenedorHistorialRemitos.innerHTML = '';

    if (!listaDeRemitos || listaDeRemitos.length === 0) {
        return;
    }

    listaDeRemitos.forEach(remito => {
        const card = document.createElement('div');
        card.className = 'historial-remito-card bg-white p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer';
        card.dataset.remitoId = remito.id;

        const fechaFormateada = new Date(remito.fecha).toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold text-sky-700">Remito N°: ${remito.id.toString().padStart(6, '0')}</h4>
                <span class="text-xs text-gray-500">${fechaFormateada}</span>
            </div>
            <p class="text-sm text-gray-600 mb-1">Cliente: <span class="font-medium">${remito.clienteNombre}</span></p>
            <p class="text-sm text-gray-600 mb-1">CUIT: ${remito.clienteCUIT || 'N/A'}</p>
            <p class="text-sm text-gray-800 font-semibold mt-2">Total: $${parseFloat(remito.totalConIVA).toFixed(2)}</p>
            <div class="text-xs text-gray-500 mt-1">Items: ${remito.items ? remito.items.length : 0}</div>
        `;
        card.addEventListener('click', () => mostrarDetalleRemitoGuardado(remito.id));
        contenedorHistorialRemitos.appendChild(card);
    });
}

function renderizarControlesPaginacionRemitos(totalPaginas, paginaActualParam) { 
    if (!paginacionHistorialRemitosDiv) return;
    paginacionHistorialRemitosDiv.innerHTML = ''; 

    if (totalPaginas <= 1) return; 

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
            paginaActualHistorial = paginaActualParam - 1; 
            cargarHistorialRemitos(paginaActualHistorial);
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
            paginaActualHistorial = paginaActualParam + 1; 
            cargarHistorialRemitos(paginaActualHistorial);
        }
    });
    contenedorFlex.appendChild(btnSiguiente);

    paginacionHistorialRemitosDiv.appendChild(contenedorFlex);
}

// NUEVA FUNCIÓN para renderizar el resumen del historial
function renderizarResumenHistorial(totalItems, sumaTotalConIVA) {
    if (!resumenHistorialRemitosDiv) return;

    if (totalItems > 0) {
        resumenHistorialRemitosDiv.innerHTML = `
            <p><span class="font-semibold">Total de Remitos Encontrados:</span> ${totalItems}</p>
            <p><span class="font-semibold">Suma Total de Remitos (IVA Incl.):</span> $${parseFloat(sumaTotalConIVA).toFixed(2)}</p>
        `;
    } else {
        resumenHistorialRemitosDiv.innerHTML = '<p>No hay remitos que coincidan con los filtros para resumir.</p>';
    }
}


function mostrarDetalleRemitoGuardado(remitoId) { 
    const remito = remitosGuardados.find(r => r.id === remitoId);
    
    if (!remito || !modalVerRemito || !detalleRemitoGuardadoContenido) {
        console.error("No se pudo encontrar el remito o los elementos del modal para ver detalle.");
        return;
    }

    detalleRemitoGuardadoContenido.innerHTML = ''; 

    const encabezadoFijoDiv = document.createElement('div');
    encabezadoFijoDiv.className = 'mb-4 p-4 border-b border-gray-200';
    const htmlEncabezado = `
        <div class="flex justify-between items-center mb-2">
            <img src="https://placehold.co/150x50/0369a1/white?text=Pelusitas+Logo" alt="Logo Pelusitas" class="h-10">
            <div class="text-right">
                <p class="font-bold text-lg">Remito N°: <span class="text-red-600">${remito.id.toString().padStart(6, '0')}</span></p>
                <p class="text-sm">Fecha: ${new Date(remito.fecha).toLocaleDateString('es-AR')}</p>
            </div>
        </div>
        <div class="text-sm">
            <p><span class="font-semibold">De:</span> ${remito.empresaNombre || 'Pelusitas Productos de Limpieza'}</p>
            <p><span class="font-semibold">CUIT:</span> ${remito.empresaCUIT || '27221248274'}</p>
        </div>
    `;
    encabezadoFijoDiv.innerHTML = htmlEncabezado;
    detalleRemitoGuardadoContenido.appendChild(encabezadoFijoDiv);

    const datosClienteDiv = document.createElement('div');
    datosClienteDiv.className = 'mb-6 p-4 border-b border-gray-200';
    const htmlDatosCliente = `
        <h4 class="text-lg font-semibold text-sky-700 mb-3">Datos del Cliente</h4>
        <p class="text-sm"><span class="font-medium">Nombre:</span> ${remito.clienteNombre}</p>
        <p class="text-sm"><span class="font-medium">CUIT/CUIL:</span> ${remito.clienteCUIT || 'N/A'}</p>
    `;
    datosClienteDiv.innerHTML = htmlDatosCliente;
    detalleRemitoGuardadoContenido.appendChild(datosClienteDiv);
    
    const tabla = document.createElement('table');
    tabla.className = 'w-full text-sm text-left text-gray-700 mb-4';
    tabla.innerHTML = `
        <caption class="text-lg font-semibold text-sky-700 p-2 mb-2 bg-gray-100 rounded-t-lg">Detalle de Productos</caption>
        <thead class="text-xs text-gray-700 uppercase bg-gray-200">
            <tr>
                <th scope="col" class="px-4 py-3">Producto</th>
                <th scope="col" class="px-4 py-3 text-center">Cant.</th>
                <th scope="col" class="px-4 py-3 text-right">P. Base Unit.</th>
                <th scope="col" class="px-4 py-3 text-right">IVA (21%) Unit.</th>
                <th scope="col" class="px-4 py-3 text-right">P. Final Unit.</th>
                <th scope="col" class="px-4 py-3 text-right">Subtotal c/IVA</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = tabla.querySelector('tbody');
    if (remito.items && remito.items.length > 0) {
        remito.items.forEach(item => {
            const fila = tbody.insertRow();
            fila.className = 'remito-item-tabla';
            fila.innerHTML = `
                <td class="px-4 py-2 font-medium">${item.nombreProducto}</td>
                <td class="px-4 py-2 text-center">${item.cantidad}</td>
                <td class="px-4 py-2 text-right">$${parseFloat(item.precioBaseUnitario).toFixed(2)}</td>
                <td class="px-4 py-2 text-right">$${parseFloat(item.ivaUnitario).toFixed(2)}</td>
                <td class="px-4 py-2 text-right font-semibold">$${parseFloat(item.precioFinalUnitario).toFixed(2)}</td>
                <td class="px-4 py-2 text-right font-semibold">$${parseFloat(item.subtotalItemConIVA).toFixed(2)}</td>
            `;
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No hay items en este remito.</td></tr>';
    }
    detalleRemitoGuardadoContenido.appendChild(tabla);

    const totalesDiv = document.createElement('div');
    totalesDiv.className = 'mt-6 pt-4 text-right space-y-1';
    const htmlTotales = `
        <p class="text-md"><span class="font-semibold">Subtotal sin IVA:</span> $${parseFloat(remito.subtotalSinIVA).toFixed(2)}</p>
        <p class="text-md"><span class="font-semibold">IVA (21%):</span> $${parseFloat(remito.totalIVA).toFixed(2)}</p>
        <p class="text-xl font-bold text-sky-700"><span class="font-semibold">TOTAL GENERAL:</span> $${parseFloat(remito.totalConIVA).toFixed(2)}</p>
    `;
    totalesDiv.innerHTML = htmlTotales;
    detalleRemitoGuardadoContenido.appendChild(totalesDiv);

    modalVerRemito.classList.remove('hidden'); 
    modalVerRemito.classList.add('flex');     
    
    setTimeout(() => {
        const modalContentInner = modalVerRemito.querySelector('.modal-content-wrapper');
        if(modalContentInner) {
            modalContentInner.classList.remove('scale-95'); 
            modalContentInner.classList.add('scale-100');   
        }
        if(detalleRemitoGuardadoContenido) {
            detalleRemitoGuardadoContenido.scrollTop = 0; 
        }
    }, 10); 
}

function cerrarModalVerRemito() {
    if (!modalVerRemito) return;
    
    modalVerRemito.classList.add('hidden');   
    modalVerRemito.classList.remove('flex');  

    const modalContent = modalVerRemito.querySelector('.modal-content-wrapper');
    if (modalContent) { 
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
    }
}

// --- Mostrar Mensajes ---
function mostrarMensaje(elementoMensaje, texto, tipo, autoLimpiar = true) { 
    if (!elementoMensaje) {
        console.warn("Elemento para mostrar mensaje no encontrado:", texto, tipo);
        return;
    }
    elementoMensaje.textContent = texto;
    elementoMensaje.className = 'mt-4 text-sm mensaje-anim '; 
    switch (tipo) {
        case 'exito': elementoMensaje.classList.add('text-green-700', 'bg-green-100', 'p-3', 'rounded-lg', 'font-medium'); break;
        case 'error': elementoMensaje.classList.add('text-red-700', 'bg-red-100', 'p-3', 'rounded-lg', 'font-medium'); break;
        default: elementoMensaje.classList.add('text-sky-700', 'bg-sky-100', 'p-3', 'rounded-lg', 'font-medium'); break;
    }
    if (autoLimpiar && (tipo === 'exito' || tipo === 'error' || tipo === 'info')) { 
        setTimeout(() => {
            if (elementoMensaje.textContent === texto) { 
                 elementoMensaje.textContent = '';
                 elementoMensaje.className = 'mt-4 text-sm';
                 elementoMensaje.style.opacity = '0';
            }
        }, tipo === 'info' ? 3000 : 5000);
    }
}

// --- Inicialización y Asignación de Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar variables globales de elementos del DOM para la página de historial
    contenedorHistorialRemitos = document.getElementById('contenedor-historial-remitos');
    mensajeHistorialRemitos = document.getElementById('mensaje-historial-remitos');
    btnRecargarHistorial = document.getElementById('btn-recargar-historial');
    inputBusquedaRemitoCliente = document.getElementById('input-busqueda-remito-cliente'); 
    selectOrdenarPor = document.getElementById('select-ordenar-por'); 
    selectOrdenDireccion = document.getElementById('select-orden-direccion'); 
    inputFechaDesde = document.getElementById('input-fecha-desde'); 
    inputFechaHasta = document.getElementById('input-fecha-hasta'); 
    btnAplicarFiltrosHistorial = document.getElementById('btn-aplicar-filtros-historial'); 
    paginacionHistorialRemitosDiv = document.getElementById('paginacion-historial-remitos');
    resumenHistorialRemitosDiv = document.getElementById('resumen-historial-remitos'); // NUEVO
    
    modalVerRemito = document.getElementById('modal-ver-remito');
    btnCerrarModalVerRemito = document.getElementById('btn-cerrar-modal-ver-remito');
    detalleRemitoGuardadoContenido = document.getElementById('detalle-remito-guardado-contenido');
    btnImprimirRemitoGuardado = document.getElementById('btn-imprimir-remito-guardado');
    btnCerrarModalVerRemitoAbajo = document.getElementById('btn-cerrar-modal-ver-remito-abajo');

    // Carga inicial del historial
    cargarHistorialRemitos(); 
    
    // --- Listeners para el historial de remitos ---
    function aplicarFiltrosYOrdenHistorial(nuevaPagina = 1) {
        paginaActualHistorial = nuevaPagina; 
        const filtroCliente = inputBusquedaRemitoCliente ? inputBusquedaRemitoCliente.value.trim() : "";
        const ordenarPor = selectOrdenarPor ? selectOrdenarPor.value : 'fecha';
        const ordenDireccion = selectOrdenDireccion ? selectOrdenDireccion.value : 'DESC';
        const fechaDesdeVal = inputFechaDesde ? inputFechaDesde.value : "";
        const fechaHastaVal = inputFechaHasta ? inputFechaHasta.value : "";
        cargarHistorialRemitos(paginaActualHistorial, filtroCliente, ordenarPor, ordenDireccion, fechaDesdeVal, fechaHastaVal);
    }

    if (btnRecargarHistorial) {
        btnRecargarHistorial.addEventListener('click', () => {
            if(inputBusquedaRemitoCliente) inputBusquedaRemitoCliente.value = '';
            if(inputFechaDesde) inputFechaDesde.value = '';
            if(inputFechaHasta) inputFechaHasta.value = '';
            if(selectOrdenarPor) selectOrdenarPor.value = 'fecha'; 
            if(selectOrdenDireccion) selectOrdenDireccion.value = 'DESC'; 
            aplicarFiltrosYOrdenHistorial(1); 
        });
    }
    if (inputBusquedaRemitoCliente) {
        inputBusquedaRemitoCliente.addEventListener('input', () => {
            clearTimeout(timeoutIdBusquedaRemito);
            timeoutIdBusquedaRemito = setTimeout(() => aplicarFiltrosYOrdenHistorial(1), 500); 
        });
    }
    if (selectOrdenarPor) {
        selectOrdenarPor.addEventListener('change', () => aplicarFiltrosYOrdenHistorial(1)); 
    }
    if (selectOrdenDireccion) {
        selectOrdenDireccion.addEventListener('change', () => aplicarFiltrosYOrdenHistorial(1)); 
    }
    if (btnAplicarFiltrosHistorial) { 
        btnAplicarFiltrosHistorial.addEventListener('click', () => aplicarFiltrosYOrdenHistorial(1)); 
    }
    if (btnCerrarModalVerRemito) btnCerrarModalVerRemito.addEventListener('click', cerrarModalVerRemito);
    if (btnCerrarModalVerRemitoAbajo) btnCerrarModalVerRemitoAbajo.addEventListener('click', cerrarModalVerRemito);
    if (modalVerRemito) modalVerRemito.addEventListener('click', (event) => {
        if (event.target === modalVerRemito) cerrarModalVerRemito();
    });
    if (btnImprimirRemitoGuardado) btnImprimirRemitoGuardado.addEventListener('click', () => {
        if (detalleRemitoGuardadoContenido && detalleRemitoGuardadoContenido.innerHTML.trim() !== "") {
            window.print();
        } else {
            alert("No hay detalle de remito para imprimir desde este modal.");
        }
    });

}); // Fin de DOMContentLoaded
//</script>
