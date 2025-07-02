document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Si ya hay un token, redirigir al panel de administración
    if (localStorage.getItem('token')) {
        window.location.href = './admin_productos.html';
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = event.target.email.value;
        const password = event.target.password.value;

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión.');
            }

            // Guardar el token y redirigir
            localStorage.setItem('token', data.token);
            window.location.href = '/admin_productos.html';

        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
});