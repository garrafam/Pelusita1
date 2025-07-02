document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const productList = document.getElementById('product-list');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let productIdToDelete = null;

    // --- Seguridad: si no hay token, fuera ---
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // --- Cargar Productos ---
    async function fetchProducts() {
        try {
            const response = await fetch(`${API_URL}/api/productos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 403 || response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            productList.innerHTML = `<p class="error-message">Error al cargar los productos.</p>`;
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