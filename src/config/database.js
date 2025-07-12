'use strict';

const path = require('path');
require('dotenv').config();

// TU LÍNEA DE CÓDIGO - ¡Está perfecta!
const storagePath = process.env.DB_STORAGE_PATH || path.join(process.cwd(), 'database.sqlite');

module.exports = {
  /**
   * --- Entorno de Desarrollo (tu PC local) ---
   */
  development: {
    dialect: 'sqlite',
    storage: storagePath, // Usando la variable que definiste
    logging: console.log,
  },

  /**
   * --- Entorno de Producción (Servidor online) ---
   */
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
  }
};