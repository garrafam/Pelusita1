'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // --- Crear la tabla de Productos (CON LA COLUMNA 'categoria') ---
    await queryInterface.createTable('productos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      precio: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      stock: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      codigoDeBarras: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      // ▼▼▼ AQUÍ ESTÁ LA LÍNEA CLAVE QUE FALTABA EN LA BASE DE DATOS REAL ▼▼▼
      categoria: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'General'
      }
    });

    // --- Crear la tabla de Remitos ---
    await queryInterface.createTable('remitos', {
      // ... (el resto de la definición de remitos que ya tenías)
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      clienteNombre: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // ... etc.
    });

    // --- Crear la tabla intermedia RemitoItems ---
    await queryInterface.createTable('remito_items', {
      // ... (la definición de remito_items que ya tenías)
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      remitoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'remitos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('remito_items');
    await queryInterface.dropTable('remitos');
    await queryInterface.dropTable('productos');
  }
};