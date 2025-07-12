// /seeders/...-initial-users.js (VERSIÓN FINAL Y CORRECTA)
'use strict';
const { User } = require('../models'); // Importamos el modelo User

module.exports = {
  async up (queryInterface, Sequelize) {
    // Usamos User.create() para cada usuario. Esto asegura que el hook 'beforeCreate' se ejecute.
    await User.create({
      email: '1@marcos.com',
      password: 'eccole1234', // Contraseña en texto plano
      role: 'admin'
    });
    await User.create({
      email: '1@diego.com',
      password: 'labestia1234', // Contraseña en texto plano
      role: 'user'
    });
    await User.create({
      email: '1@lajefa.com',
      password: 'meolvide1234', // Contraseña en texto plano
      role: 'user'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};