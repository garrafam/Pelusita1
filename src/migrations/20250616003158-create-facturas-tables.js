'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('facturas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
        fecha: { // La columna que falta
        type: Sequelize.DATE,
        allowNull: false
      },
      tipoComprobante: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Factura B' // Un valor por defecto es útil
      },
        estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pendiente' // Por ejemplo
      },
       puntoDeVenta: {
      type: Sequelize.STRING,
      allowNull: true // Puede que al inicio sean nulos
    },
    numeroComprobante: {
      type: Sequelize.STRING,
      allowNull: true
    },
    cae: {
      type: Sequelize.STRING,
      allowNull: true
    },
    vencimientoCae: {
      type: Sequelize.DATE,
      allowNull: true
    },
      clienteNombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clienteCUIT: {
        type: Sequelize.STRING
      },
      subtotalSinIVA: {
        type: Sequelize.DECIMAL(10, 2)
      },
      totalIVA: {
        type: Sequelize.DECIMAL(10, 2)
      },
      totalConIVA: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('facturas');
  }
};