// =================================================================
// ARCHIVO COMPLETO: src/app.js
// =================================================================

// --- 1. IMPORTACIONES ---
const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importamos la instancia de sequelize desde el centralizador de modelos
const { sequelize } = require('./models');

// Importamos los archivos de rutas
const productoRoutes = require('./routes/productoRoutes');
const remitoRoutes = require('./routes/remitoRoutes');

// --- 2. INICIALIZACIÓN DE LA APP ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 3. MIDDLEWARES ---
// NOTA IMPORTANTE: El orden de los middlewares es crucial.

// A) Habilitar CORS. Esta debe ser una de las primeras líneas.
// La configuración simple permite peticiones de cualquier origen.
app.use(cors());
// En src/app.js

// ... tus otras importaciones
const publicPath = path.join(__dirname, '..', 'public');

// 2. Imprimimos la ruta en la consola de la terminal para verla
console.log('================================================');
console.log('Ruta estática que se está intentando usar:', publicPath);
console.log('================================================');

// 3. Usamos la variable para servir los archivos
app.use(express.static(publicPath));


app.use(express.json());


/*
// Si necesitas una configuración de CORS más específica en el futuro:
const corsOptions = {
  // Reemplaza esto con la URL de tu frontend
  origin: 'http://127.0.0.1:5500', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
*/

// B) Middlewares para parsear el cuerpo de las peticiones
app.use(express.json()); // Para entender cuerpos en formato JSON
app.use(express.urlencoded({ extended: true })); // Para entender cuerpos de formularios

// --- 4. RUTAS DE LA API ---
// Aquí es donde la app "usa" los archivos de rutas.
app.use('/api/productos', productoRoutes);
app.use('/api/remitos', remitoRoutes);

// Ruta de bienvenida o para verificar que el servidor está vivo
/*app.get('/', (req, res) => {
  res.send('¡API de PelusitaStock funcionando!');
});
*/
// --- 5. MANEJO DE ERRORES ---
// Middleware para capturar rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

// Middleware global para capturar todos los demás errores (500)
// Debe tener 4 argumentos para que Express lo identifique como manejador de errores.
app.use((err, req, res, next) => {
  console.error("Error global capturado:", err.message);

  // ... tu if para errores de Sequelize ...

  // --- ¡MODIFICACIÓN TEMPORAL PARA DEPURAR! ---
  // ¡NUNCA USAR ESTO EN UNA APLICACIÓN REAL EN PRODUCCIÓN!
  res.status(err.status || 500).json({
    message: err.message,
    // Añadimos el 'stack' para ver el rastro completo del error
    stack: err.stack, 
    // También el error original por si acaso
    originalError: err.original 
  });

  // Manejo específico para errores de validación de Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: 'Error de validación.', errors });
  }

  // Respuesta para todos los demás errores
  res.status(err.status || 500).json({
    message: err.message || 'Ocurrió un error inesperado en el servidor.',
  });
});

// --- 6. INICIO DEL SERVIDOR ---
async function startServer() {
  try {
    // Sincroniza la base de datos usando el sequelize del index de modelos.
    // `alter: true` intenta modificar las tablas existentes para que coincidan con los modelos.
    await sequelize.sync();
    console.log('Base de datos sincronizada correctamente.');

    // Inicia el servidor para escuchar peticiones
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
    });

    // Lógica para un apagado elegante (cierra la DB antes de salir)
    const gracefulShutdown = async (signal) => {
      console.log(`\nRecibida señal ${signal}. Apagando servidor...`);
      server.close(async () => {
        console.log('Servidor HTTP cerrado.');
        try {
          await sequelize.close();
          console.log('Conexión a la base de datos cerrada.');
          process.exit(0);
        } catch (dbErr) {
          console.error('Error durante el cierre de la conexión a la base de datos:', dbErr);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Señal de terminación

  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

// ¡Llamamos a la función para que todo comience!
startServer();