import { API_URL } from './config.js'; 


document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Si ya hay un token, redirigir al panel de administración
    if (localStorage.getItem('token')) {
        window.location.href = './index.html';
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = event.target.email.value;
        const password = event.target.password.value;

        try {console.log("Intentando iniciar sesión con:", email, password);
            const response = await fetch(`${API_URL}/api/auth/login`, {
                
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
               
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
             console.log("Respuesta completa del servidor:", data);
    console.log("Token recibido:", data.token); 

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión.');
            }

            // Guardar el token y redirigir
            localStorage.setItem('token', data.token);
             console.log("Token guardado. Redirigiendo...")
            window.location.href = '/index.html';

        } catch (error) {
            console.error("Error durante el login:", error);
            errorMessage.textContent = error.message;
        }
    });
});