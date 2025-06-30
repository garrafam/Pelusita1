'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // 1. Definimos la clase correcta: Producto
  class Producto extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Un Producto puede estar en muchos RemitoItems y FacturaItems.
      this.hasMany(models.RemitoItem, {
        foreignKey: 'productoId'
      });
      this.hasMany(models.FacturaItem, {
        foreignKey: 'productoId'
      });
    }
  }

  // 2. Inicializamos el modelo Producto con sus campos correctos
  Producto.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    precio: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    categoria: {
      type: DataTypes.STRING,
      defaultValue: 'General'
    },
    codigoDeBarras: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    }
  }, {
    sequelize,
    // 3. Le damos el nombre correcto
    modelName: 'Producto',
    tableName: 'productos',
    timestamps: true // O false, como prefieras
  });

  // 4. Devolvemos el modelo correcto
  return Producto;
};
