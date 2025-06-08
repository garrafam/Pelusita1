// src/config/database.js

const path = require('path');
require('dotenv').config();

// La única tarea de este archivo es exportar este objeto.
// No ejecuta nada más.
/*module.exports = {
  development: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'database.sqlite'),
    logging: false
  }
};*/
const storagePath = process.env.DB_STORAGE_PATH || path.join(process.cwd(), 'database.sqlite');

module.exports = {
  // Solo necesitamos la configuración de desarrollo para una app de escritorio
  development: {
    dialect: 'sqlite',
    storage: storagePath, // Usamos la ruta calculada
    logging: false
  }
};