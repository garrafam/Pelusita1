// public/js/form_producto.js

import { fetchAPI, initUtils, mostrarModalMensaje, cerrarGenericModal } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initUtils();

    const BASE_URL = 'http://localhost:3001/api/productos';
    
    const formulario = document.getElementById('formulario-agregar-producto');
    if (!formulario) return; // Si no hay formulario, no hacer nada.

    const inputNombre = document.getElementById('nombre');
    const inputPrecio = document.getElementById('precio');
    const inputCategoria = document.getElementById('categoria');
    const inputStock = document.getElementById('stock');
    const inputCodigoDeBarras = document.getElementById('codigoDeBarras');
    const btnLimpiar = document.getElementById('btn-limpiar-formulario');
    const inputIdOculto = document.getElementById('producto-existente-id');
    const btnSubmit = formulario.querySelector('button[type="submit"]');

    // --- LÓGICA PARA CARGAR DATOS EN MODO EDICIÓN ---
    const urlParams = new URLSearchParams(window.location.search);
    const productoIdParaEditar = urlParams.get('id');

    if (productoIdParaEditar) {
        cargarDatosDelProducto(productoIdParaEditar);
    }
    
    async function cargarDatosDelProducto(id) {
        mostrarModalMensaje("Cargando...", `Cargando datos del producto...`, 'info', false);
        try {
            const producto = await fetchAPI(`${BASE_URL}/${id}`);
            inputNombre.value = producto.nombre;
            inputPrecio.value = producto.precio;
            inputCategoria.value = producto.categoria;
            inputStock.value = producto.stock;
            inputCodigoDeBarras.value = producto.codigoDeBarras || '';
            inputIdOculto.value = producto.id;

            const tituloPagina = document.querySelector('h1');
            if (tituloPagina) tituloPagina.textContent = 'Editar Producto';
            if (btnSubmit) btnSubmit.textContent = 'Actualizar Producto';

            cerrarGenericModal();
        } catch (error) {
            mostrarModalMensaje("Error de Carga", `No se pudieron cargar los datos: ${error.message}.`, 'error');
            setTimeout(() => window.location.href = 'index.html', 3000);
        }
    }

    // --- LÓGICA DEL FORMULARIO ---
    formulario.addEventListener('submit', async (event) => {
        event.preventDefault();

        const datosProducto = {
            nombre: inputNombre.value.trim(),
            precio: parseFloat(inputPrecio.value),
            categoria: inputCategoria.value.trim() || 'General',
            stock: parseInt(inputStock.value, 10),
            codigoDeBarras: inputCodigoDeBarras.value.trim() || null
        };

        if (!datosProducto.nombre || isNaN(datosProducto.precio) || isNaN(datosProducto.stock)) {
            mostrarModalMensaje('Error de Validación', 'Nombre, precio y stock son obligatorios.', 'error');
            return;
        }

        const idExistente = inputIdOculto.value;
        let url = BASE_URL;
        let method = 'POST';
        if (idExistente) {
            url += `/${idExistente}`;
            method = 'PUT';
        }

        try {
            if (btnSubmit) btnSubmit.disabled = true;
            mostrarModalMensaje("Procesando...", "Guardando producto...", 'info', false);
            const resultado = await fetchAPI(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosProducto)
            });
            
            mostrarModalMensaje("Éxito", `Producto "${resultado.nombre}" guardado.`, 'exito');
            
            if (!idExistente) { // Limpiar formulario solo si es un producto nuevo
                limpiarFormulario();
            }
        } catch (error) {
            mostrarModalMensaje("Error", `No se pudo guardar: ${error.message}`, 'error');
        } finally {
            if (btnSubmit) btnSubmit.disabled = false;
        }
    });

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    function limpiarFormulario() {
        formulario.reset();
        inputIdOculto.value = '';
        inputNombre.focus();
    }
});