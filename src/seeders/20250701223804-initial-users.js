// dentro del archivo en la carpeta /seeders

'use strict';
const bcrypt = require('bcryptjs'); // Importamos bcrypt para encriptar

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Generamos el hash para cada contraseña de forma segura
    const adminPassword = await bcrypt.hash('eccole', 10);
    const userPassword = await bcrypt.hash('labestia', 10);
    const userPassword1 = await bcrypt.hash('meolvide', 10);

    // Usamos bulkInsert para añadir los usuarios a la tabla 'users'
    await queryInterface.bulkInsert('users', [
      {
        email: '1@marcos.com',
        password: adminPassword,
        role: 'admin', // Asignamos el rol de administrador
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: '1@diego.com',
        password: userPassword,
        role: 'user', // Rol de usuario estándar
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: '1@lajefa.com',
        password: userPassword1,
        role: 'user', // Rol de usuario estándar
        createdAt: new Date(),
        updatedAt: new Date()
      }
      // Puedes añadir más objetos de usuario aquí
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Esto permite revertir el seeder, borrando los datos insertados
    await queryInterface.bulkDelete('users', null, {});
  }
};