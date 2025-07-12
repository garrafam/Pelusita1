'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Este comando SQL busca todos los usuarios cuyo email empieza con '@'
     * y lo actualiza, concatenando 'usuario' + el ID del usuario + el email original.
     * Ejemplo: '@marcos.com' con id=1 se convierte en 'usuario1@marcos.com'
     * Esta sintaxis funciona tanto en SQLite como en PostgreSQL.
     */
    await queryInterface.sequelize.query(
      "UPDATE users SET email = 'usuario' || id || email WHERE email LIKE '@%'"
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Revertir este tipo de cambio de datos es complejo y potencialmente destructivo.
     * Por seguridad, no implementaremos una función 'down'.
     */
    console.log('No se puede revertir esta migración de datos automáticamente.');
  }
};