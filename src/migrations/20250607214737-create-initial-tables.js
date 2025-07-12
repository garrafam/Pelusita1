'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // --- Crear la tabla de Productos ---
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
      categoria: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'General'
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

    // --- Crear la tabla de Remitos ---
    await queryInterface.createTable('remitos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
       fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW // Pone la fecha actual si no se especifica
      },
      clienteNombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clienteCUIT: {
        type: Sequelize.STRING,
        allowNull: true
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

    // --- Crear la tabla intermedia RemitoItems (CON CORRECCIÓN) ---
    await queryInterface.createTable('remito_items', {
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
      },
      // --- COLUMNAS QUE FALTABAN ---
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
    // El orden de borrado es importante (de la más dependiente a la menos)
    await queryInterface.dropTable('remito_items');
    await queryInterface.dropTable('remitos');
    await queryInterface.dropTable('productos');
  }
};