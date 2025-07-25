// src/app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const productoRoutes = require('./routes/productoRoutes');
const remitoRoutes = require('./routes/remitoRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());

// --- INICIO DE LA DEPURACIÓN ---

// LOG 1: ¿Qué hay antes de express.json?
app.use((req, res, next) => {
    console.log(`\n--- 1. Petición recibida: ${req.method} ${req.url} ---`);
    console.log('req.body ANTES de express.json:', req.body); // Debería ser undefined
    next();
});

app.use(express.json());

// LOG 2: ¿Qué hay después de express.json?
app.use((req, res, next) => {
    console.log('--- 2. Después de express.json() ---');
    console.log('req.body DESPUÉS de express.json:', req.body); // ¡DEBERÍA TENER DATOS AQUÍ!
    next();
});

// --- FIN DE LA DEPURACIÓN ---

app.use(express.urlencoded({ extended: true }));

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Rutas de la API
app.use('/api/productos', productoRoutes);
app.use('/api/remitos', remitoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/auth', authRoutes); // Corregido el doble punto y coma

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
