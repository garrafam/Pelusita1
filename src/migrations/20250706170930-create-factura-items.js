'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('factura_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      facturaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'facturas', // Se conecta a la tabla 'facturas'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Si se borra una factura, se borran sus ítems
      },
        
      productoId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'productos', // Se conecta a la tabla 'productos'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Si se borra un producto, el ítem no se borra
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      precioUnitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      subtotalItemConIVA: {
        type: Sequelize.DECIMAL(10, 2)
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
    await queryInterface.dropTable('factura_items');
  }
};