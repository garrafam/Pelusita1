// /src/app.js (VERSIÓN FINAL Y SINCRONIZADA)
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
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Rutas de la API
app.use('/api/productos', productoRoutes);
app.use('/api/remitos', remitoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/auth', authRoutes);

// Manejo de errores (al final)
// ... (tu código de manejo de errores va aquí)

// Función de inicio que devuelve una promesa
function startServer() {
  return new Promise(async (resolve, reject) => {
    try {
      await sequelize.authenticate();
      console.log('Conexión a la base de datos establecida.');
      await sequelize.sync();
      console.log('Base de datos sincronizada y lista.');
      const server = app.listen(PORT, () => {
        console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
        resolve(server); // Avisa que el servidor está listo
      });
    } catch (error) {
      console.error('❌ No se pudo iniciar el servidor:', error);
      reject(error);
    }
  });
}

// Exportamos la función para que main.js pueda usarla
module.exports = { startServer };