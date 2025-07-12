// src/app.js

// --- 1. IMPORTACIONES ---
require('dotenv').config();
const path = require('path');

const express = require('express');
const cors = require('cors');

// Importamos la conexión y los modelos desde el archivo centralizador
const { sequelize } = require('./models');

// Importamos nuestros archivos de rutas
const productoRoutes = require('./routes/productoRoutes');
const remitoRoutes = require('./routes/remitoRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const authRoutes = require('./routes/auth'); // Ruta de autenticación
// --- 2. INICIALIZACIÓN DE LA APP ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 3. MIDDLEWARES (EN EL ORDEN CORRECTO Y SIN DUPLICADOS) ---

// A) Habilitar CORS para permitir todas las peticiones.
app.use(cors());

// B) Middlewares para parsear el cuerpo de las peticiones.
//    ESTOS DEBEN ESTAR ANTES DE LAS RUTAS DE LA API.
app.use(express.json()); // Para entender cuerpos en formato JSON
app.use(express.urlencoded({ extended: true })); // Para entender cuerpos de formularios

// C) Servir los archivos estáticos de nuestro frontend (HTML, CSS, JS del cliente).
//    Se usa la ruta absoluta para que funcione tanto en desarrollo como en el .exe.
const publicPath = path.join(__dirname, '..', 'public');
console.log('Sirviendo archivos estáticos desde:', publicPath);
app.use(express.static(publicPath));

// --- 4. RUTAS DE LA API ---
// El servidor ahora usa los archivos de rutas que importamos.
app.use('/api/productos', productoRoutes);
app.use('/api/remitos', remitoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/auth', authRoutes);; // Ruta de autenticación

// --- 5. MANEJO DE ERRORES (CORREGIDO Y AL FINAL) ---

// A) Middleware para capturar rutas de API no encontradas (404).
//    Se ejecuta solo si la petición no coincidió con ninguna ruta anterior.
app.use('/api', (req, res, next) => {
    res.status(404).json({ message: "Ruta de API no encontrada." });
});

// B) Middleware global para capturar todos los demás errores del servidor (500).
app.use((err, req, res, next) => {
  console.error("ERROR GLOBAL CAPTURADO:", err); // Logueamos el error completo para nosotros

  // Revisamos si es un error de validación de Sequelize para dar una respuesta clara
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: 'Error de validación.', errors });
  }

  // Para todos los demás errores, enviamos una respuesta genérica de error 500
  res.status(500).json({
    message: err.message || 'Ocurrió un error inesperado en el servidor.'
    // En desarrollo, podríamos añadir err.stack para más detalles
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// --- 6. INICIO DEL SERVIDOR ---
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // sync() crea las tablas si no existen. Es seguro y no borra datos.
    await sequelize.sync();
    console.log('Base de datos sincronizada y lista.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

// ¡Llamamos a la función para que todo comience!
startServer();
