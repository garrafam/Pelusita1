import { API_URL } from './config.js';
import { fetchAPI } from './utils.js'; 

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const productList = document.getElementById('product-list');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let productIdToDelete = null;

    // --- Seguridad: si no hay token, fuera ---
    /*if (!token) {
        window.location.href = './login.html';
        return;
    }*/

    // --- Cargar Productos ---
    async function fetchProducts() {
    try {
        // 1. fetchAPI ya devuelve los datos en formato JSON directamente.
        const data = await fetchAPI(`${API_URL}/api/productos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 2. Le pasamos solo el array de productos a la función de renderizado.
        // Esto soluciona el problema de que los productos no se muestren.
        renderProducts(data.productos);

    } catch (error) {
        // 3. Si el token es inválido (error 401/403), fetchAPI fallará y caerá aquí.
        // Verificamos el mensaje de error para redirigir si es necesario.
        if (error.message.includes('401') || error.message.includes('403')) {
            localStorage.removeItem('token');
            window.location.href = './login.html';
        } else {
            // Para cualquier otro error, mostramos el mensaje genérico.
            productList.innerHTML = `<p class="error-message">Error al cargar los productos.</p>`;
            console.error("Error detallado en fetchProducts:", error);
        }
    }
}

    // --- Renderizar Productos ---
    function renderProducts(products) {
        productList.innerHTML = '';
        if (products.length === 0) {
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

    // --- Event Listeners ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
    
    productList.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-danger')) {
            productIdToDelete = event.target.dataset.id;
            deleteModal.style.display = 'flex';
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        productIdToDelete = null;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!productIdToDelete) return;

        try {
            const response = await fetch(`${API_URL}/api/productos/${productIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('No se pudo eliminar el producto.');
            }
            
            deleteModal.style.display = 'none';
            productIdToDelete = null;
            fetchProducts(); // Recargar la lista de productos

        } catch (error) {
            alert(error.message);
            deleteModal.style.display = 'none';
        }
    });

    // Carga inicial
    fetchProducts();
});