// src/config/database.js (Versión Final y Actualizada)
'use strict';

const path = require('path');
require('dotenv').config();

// Mantenemos tu lógica para la ruta de la base de datos en desarrollo.
const storagePath = process.env.DB_STORAGE_PATH || path.join(process.cwd(), 'database.sqlite');

module.exports = {
  /**
   * --- Entorno de Desarrollo (tu PC local) ---
   * Esta configuración utiliza tu base de datos SQLite local.
   * Tu `models/index.js` la usará automáticamente cuando no estés en producción.
   */
  development: {
    dialect: 'sqlite',
    storage: storagePath, // Usamos la ruta que definiste. ¡Perfecto!
    // Sugerencia: Activamos el logging en desarrollo. Es muy útil para ver las
    // consultas SQL que Sequelize está ejecutando y depurar problemas.
    logging: console.log,
  },

  /**
   * --- Entorno de Producción (Servidor online como Render) ---
   * Esta configuración se usará cuando despliegues tu aplicación.
   * Tu `models/index.js` la activará cuando la variable de entorno NODE_ENV sea 'production'.
   */
  production: {
    // Esta línea le dice a Sequelize/index.js que use la variable de entorno
    // DATABASE_URL para la conexión. Render la creará por ti.
    use_env_variable: "DATABASE_URL",
    
    // Le decimos a Sequelize que el "dialecto" en producción es PostgreSQL.
    dialect: "postgres",
    
    // Opciones específicas para PostgreSQL en Render
    dialectOptions: {
      // La configuración SSL es requerida por Render para todas sus bases de datos.
      ssl: {
        require: true,
        // Esta línea es crucial y evita errores comunes de certificados en Render.
        rejectUnauthorized: false
      }
    },
    // Desactivamos el logging en producción para mantener la consola limpia.
    logging: false,
  }
};