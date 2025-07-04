// Detectamos si estamos en un entorno local
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Exportamos la constante API_URL con el valor correcto según el entorno
export const API_URL = isLocal
  ? 'http://localhost:3001' // URL para desarrollo local
  : 'https://pelusita-v1.onrender.com'; // URL para producción

// Mensaje en consola para saber qué modo se está usando
console.log(`Modo detectado: ${isLocal ? 'LOCAL' : 'PRODUCCIÓN'}. API URL: ${API_URL}`);