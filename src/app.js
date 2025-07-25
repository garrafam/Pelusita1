// src/app.js

require('dotenv').config(); // Correcto, siempre al principio.
const path = require('path');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const productoRoutes = require('./routes/productoRoutes');
const remitoRoutes = require('./routes/remitoRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const authRoutes = require('./routes/auth');

// --- 2. INICIALIZACIÓN DE LA APP ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 3. MIDDLEWARES ---
app.use(cors());

// ▼▼▼ INICIO DEL CAMBIO PARA DEPURACIÓN ▼▼▼
// Reemplazamos express.json() con nuestro propio middleware "espía".
app.use((req, res, next) => {
    // Solo actuamos en peticiones POST con contenido JSON
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            console.log('<<<<< CUERPO DE LA PETICIÓN RECIBIDO (RAW) >>>>>');
            console.log(data);
            console.log('<<<<< FIN DEL CUERPO RAW >>>>>');
            try {
                // Intentamos "traducir" el texto a JSON y lo ponemos en req.body
                req.body = data ? JSON.parse(data) : {};
                next();
            } catch (e) {
                console.error("Error al parsear el JSON del cuerpo de la petición:", e);
                res.status(400).json({ message: "Cuerpo de la petición JSON mal formado." });
            }
        });
    } else {
        // Para cualquier otra petición (GET, etc.), simplemente continuamos.
        next();
    }
});
// ▲▲▲ FIN DEL CAMBIO PARA DEPURACIÓN ▲▲▲

app.use(express.urlencoded({ extended: true }));

const publicPath = path.join(__dirname, '..', 'public');
console.log('Sirviendo archivos estáticos desde:', publicPath);
app.use(express.static(publicPath));

// --- 4. RUTAS DE LA API ---
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
