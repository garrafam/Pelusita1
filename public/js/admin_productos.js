import { API_URL } from './config.js';
import { fetchAPI } from './utils.js'; 
import { handleAuthError } from './utils.js'; // Asegúrate de que esta función esté definida en utils.js
document.addEventListener('DOMContentLoaded', () => {
    // Asumo que tienes un config.js que exporta API_URL
     const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return; }

    const productList = document.getElementById('product-list');
    const logoutBtn = document.getElementById('logout-btn');
    const paginationControls = document.getElementById('pagination-controls');
    
    // Elementos del modal de eliminación
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let productIdToDelete = null;

    let currentPage = 1;
    const productsPerPage = 9;

    // --- Cargar Productos (Ahora pide una página específica) ---
   async function fetchProducts(page = 1) {
    productList.innerHTML = `<p>Cargando productos...</p>`;
    const url = `${API_URL}/api/productos?pagina=${page}&limite=${productsPerPage}`;
    
    // --- INICIO DE LA MODIFICACIÓN ---

    // 1. Obtienes el token que guardaste en localStorage después del login
    const token = localStorage.getItem('token');

    // 2. Creas el objeto de opciones con los headers de autorización
    const options = {
        method: 'GET', // Aunque GET es el default, es bueno ser explícito
        headers: {
            'Authorization': token // 'token' ya contiene "Bearer ..." desde el login
        }
    };
    
    // --- FIN DE LA MODIFICACIÓN ---

    try {
        // 3. Pasas las opciones como segundo argumento al fetch
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            // Creamos un error que incluya el status para que handleAuthError funcione
            throw new Error(`${response.status}: ${errorData.message}`);
        }
        
        const data = await response.json();
        
        renderProducts(data.productos);
        renderPagination(data.totalPaginas, data.paginaActual);
        currentPage = data.paginaActual;

    } catch (error) {
        // Asumiendo que ya tienes handleAuthError en tu script o en utils.js
        handleAuthError(error, "Error al cargar productos");
    }
}
    // --- Renderizar Productos ---
    function renderProducts(products) {
        productList.innerHTML = '';
        if (!products || products.length === 0) {
            productList.innerHTML = `<p>No hay productos para mostrar. ¡Crea uno nuevo!</p>`;
            return;
        }
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h3>${product.nombre}</h3>
                <p>Categoría: ${product.categoria || 'N/A'}</p>
                <p>Stock: ${product.stock}</p>
                <p class="price">Precio: $${parseFloat(product.precio).toFixed(2)}</p>
                <div class="card-actions">
                    <a href="/form_producto.html?id=${product.id}" class="btn btn-secondary">Editar</a>
                    <button class="btn btn-danger" data-id="${product.id}">Eliminar</button>
                </div>
            `;
            productList.appendChild(productCard);
        });
    }
    
    // --- Renderizar los botones de paginación ---
    function renderPagination(totalPages, currentPage) {
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.className = 'btn-pagination';
        prevButton.disabled = currentPage === 1;
        prevButton.dataset.page = currentPage - 1;
        paginationControls.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        pageInfo.className = 'page-info';
        paginationControls.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.className = 'btn-pagination';
        nextButton.disabled = currentPage === totalPages;
        nextButton.dataset.page = currentPage + 1;
        paginationControls.appendChild(nextButton);
    }

    // --- Event Listeners ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        });
    }
    
    if (paginationControls) {
        paginationControls.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.dataset.page) {
                const newPage = parseInt(event.target.dataset.page, 10);
                fetchProducts(newPage);
            }
        });
    }

    // --- CÓDIGO RESTAURADO: Lógica de Eliminación ---
    if (productList) {
        productList.addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-danger')) {
                productIdToDelete = event.target.dataset.id;
                deleteModal.style.display = 'flex';
            }
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            productIdToDelete = null;
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!productIdToDelete) return;
             // 1. Obtenemos el token
        const token = localStorage.getItem('token');
        if (!token) {
            handleAuthError(new Error("401: No autenticado")); // Usa tu manejador de errores
            return;
        }

        // 2. Preparamos las opciones para el fetch con el token
        const optionsConToken = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
                
            }
        };

            try {
                // NOTA: Cuando actives la seguridad, aquí también necesitarás el token.
                const response = await fetch(`${API_URL}/api/productos/${productIdToDelete}`, {
                    method: 'DELETE',
                    ...optionsConToken // Aquí pasamos las opciones con el token
                });

                if (!response.ok) {
                    throw new Error('No se pudo eliminar el producto.');
                }
                
                deleteModal.style.display = 'none';
                productIdToDelete = null;
                fetchProducts(currentPage); // Recargar la lista de productos en la página actual

            } catch (error) {
                alert(error.message); // Podrías reemplazar esto con un modal de error
                deleteModal.style.display = 'none';
            }
        });
    }
    // --- FIN DEL CÓDIGO RESTAURADO ---

    // Carga inicial de productos
    fetchProducts(currentPage);
});