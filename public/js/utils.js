
let genericModal
let genericModalTitulo , genericModalMensaje, genericModalBotones
genericModal = document.getElementById('generic-modal');
genericModalTitulo = document.getElementById('generic-modal-titulo');
genericModalMensaje = document.getElementById('generic-modal-mensaje');
genericModalBotones = document.getElementById('generic-modal-botones');
export async function fetchAPI(url, options = {}) {
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
// --- NUEVAS FUNCIONES PARA MODAL GENÉRICO ---
export function mostrarModalMensaje(titulo, mensaje, tipo = 'info', autoCerrar = true, elementoMensajeAlternativo = null) { /* ... (código sin cambios) ... */ }

export function mostrarModalConfirmacion(titulo, mensaje, callbackConfirmar, callbackCancelar = null) { 
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
export function cerrarGenericModal() {
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
