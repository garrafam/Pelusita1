// public/js/utils.js (Versión Corregida y Robusta)

// --- Variables Globales para el Modal ---
let genericModal;
let genericModalTitulo;
let genericModalMensaje;
let genericModalBotones;
let genericModalBtnCerrarX;

/**
 * Realiza una petición a la API y maneja las respuestas y errores de forma centralizada.
 * @param {string} url La URL del endpoint de la API.
 * @param {object} options Opciones para la petición fetch (method, headers, body, etc.).
 * @returns {Promise<any>} Una promesa que se resuelve con los datos JSON de la respuesta.
 */
// /public/js/utils.js (Versión Corregida y Robusta)

// --- FUNCIÓN fetchAPI MEJORADA ---
export async function fetchAPI(url, options = {}) {
     
    const response = await fetch(url, options);
    
    // Verificamos si la respuesta fue exitosa (códigos 200-299)
    if (response.ok) {
        // Si la respuesta no tiene contenido (ej. en un DELETE), devolvemos un objeto de éxito
        if (response.status === 204) {
            return { success: true };
        }
        return response.json(); // Si tiene contenido, lo devolvemos como JSON
    }

    // --- MANEJO DE ERRORES ---
    // Si la respuesta NO fue exitosa, creamos un error personalizado.
    let errorMessage = `Error HTTP: ${response.status}`;
    try {
        // Intentamos obtener más detalles del cuerpo de la respuesta
        const errorData = await response.json();
        errorMessage = errorData.message || JSON.stringify(errorData);
    } catch (e) {
        // Si el cuerpo no es JSON, usamos el texto de status
        errorMessage = response.statusText;
    }

    // Creamos un error que incluye el código de status en el mensaje
    const error = new Error(`${response.status}: ${errorMessage}`);
    throw error;
}

// --- TU FUNCIÓN handleAuthError (Ahora funcionará siempre) ---
export function handleAuthError(error, customMessage = 'Ocurrió un error') {
    cerrarGenericModal();
    console.error("Error detectado:", error.message);
    
    if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        mostrarModalMensaje("Sesión Expirada", "Tu sesión ha expirado. Serás redirigido al login.", "advertencia");
        setTimeout(() => window.location.href = './login.html', 2500);
    } else {
        mostrarModalMensaje("Error", `${customMessage}: ${error.message}`, "error");
    }
}

/*
 * Muestra un modal genérico con un título, mensaje y botones personalizables.
 * @param {string} titulo El título del modal.
 * @param {string} mensaje El cuerpo del mensaje del modal.
 * @param {'info'|'exito'|'advertencia'|'error'|'confirmacion'} tipo El tipo de modal, que afecta el color y los botones.
 * @param {boolean} [mostrarBotonCerrar=true] Si se muestra o no un botón para cerrar el modal. Por defecto es true.
 * @param {HTMLElement} [elementoMensajeAlternativo=null] Un elemento del DOM alternativo donde mostrar el mensaje.
 */
export function mostrarModalMensaje(titulo, mensaje, tipo, mostrarBotonCerrar = true, elementoMensajeAlternativo = null) {
    if (elementoMensajeAlternativo) {
        elementoMensajeAlternativo.textContent = mensaje;
        elementoMensajeAlternativo.className = `p-2 my-2 rounded text-sm ${
            tipo === 'error' ? 'bg-red-100 text-red-700' : 
            tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`;
        return;
    }

    if (!genericModal || !genericModalTitulo || !genericModalMensaje || !genericModalBotones) return;
    
    genericModalTitulo.textContent = titulo;
    genericModalMensaje.textContent = mensaje;
    genericModalBotones.innerHTML = ''; // Limpiar botones anteriores

    // Asignar color al título según el tipo
    genericModalTitulo.className = 'text-xl font-bold mb-4 ';
    switch (tipo) {
        case 'exito':
            genericModalTitulo.classList.add('text-green-600');
            break;
        case 'error':
            genericModalTitulo.classList.add('text-red-600');
            break;
        case 'advertencia':
            genericModalTitulo.classList.add('text-yellow-600');
            break;
        default:
            genericModalTitulo.classList.add('text-sky-600');
            break;
    }

    if (mostrarBotonCerrar) {
        const btnOk = document.createElement('button');
        btnOk.textContent = 'Aceptar';
        btnOk.className = 'bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded';
        btnOk.onclick = cerrarGenericModal;
        genericModalBotones.appendChild(btnOk);
    }
    
    // ----- LA CLAVE DE LA CORRECCIÓN ESTÁ AQUÍ -----
    // Se muestra el contenedor principal del modal, que actúa como fondo (overlay)
    genericModal.classList.remove('hidden');
    genericModal.classList.add('flex'); // Usamos flex para centrar el contenido
}

/**
 * Muestra un modal de confirmación con acciones personalizadas para "Confirmar" y "Cancelar".
 * @param {string} titulo El título de la confirmación.
 * @param {string} mensaje El mensaje preguntando al usuario.
 * @param {Function} onConfirm La función a ejecutar si el usuario confirma.
 * @param {Function} [onCancel] La función a ejecutar si el usuario cancela.
 */
export function mostrarModalConfirmacion(titulo, mensaje, onConfirm, onCancel) {
    if (!genericModal || !genericModalTitulo || !genericModalMensaje || !genericModalBotones) return;

    mostrarModalMensaje(titulo, mensaje, 'confirmacion', false); // Muestra el texto sin botones por defecto

    const btnConfirmar = document.createElement('button');
    btnConfirmar.textContent = 'Confirmar';
    btnConfirmar.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded';
    btnConfirmar.onclick = () => {
        cerrarGenericModal();
        if (onConfirm) onConfirm();
    };

    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.className = 'bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded';
    btnCancelar.onclick = () => {
        cerrarGenericModal();
        if (onCancel) onCancel();
    };

    genericModalBotones.innerHTML = ''; // Limpiar de nuevo por si acaso
    genericModalBotones.appendChild(btnCancelar);
    genericModalBotones.appendChild(btnConfirmar);
}

/**
 * Cierra el modal genérico, asegurándose de que el contenedor principal (overlay) se oculte.
 */
export function cerrarGenericModal() {
    if (genericModal) {
        // ----- ESTA ES LA PARTE MÁS IMPORTANTE DE LA CORRECCIÓN -----
        // Oculta TODO el componente modal, incluyendo el fondo que bloquea los clics.
        genericModal.classList.add('hidden');
        genericModal.classList.remove('flex');
    }
}

/**
 * Inicializa las variables del modal y asigna los eventos de cierre.
 * Esta función debe ser llamada una sola vez en DOMContentLoaded.
 */
export function initUtils() {
    genericModal = document.getElementById('generic-modal');
    genericModalTitulo = document.getElementById('generic-modal-titulo');
    genericModalMensaje = document.getElementById('generic-modal-mensaje');
    genericModalBotones = document.getElementById('generic-modal-botones');
    genericModalBtnCerrarX = document.getElementById('generic-modal-btn-cerrar-x');

    if (genericModal) {
        // Cierra el modal si se hace clic en el fondo (el propio contenedor)
        genericModal.addEventListener('click', (event) => {
            if (event.target === genericModal) {
                cerrarGenericModal();
            }
        });
    }
    if (genericModalBtnCerrarX) {
        // Cierra el modal si se hace clic en el botón 'X'
        genericModalBtnCerrarX.addEventListener('click', cerrarGenericModal);
    }
}
// Añade esta nueva función a tu archivo utils.js

