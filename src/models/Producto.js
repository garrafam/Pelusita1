'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    // El método associate le dice a Sequelize cómo se relaciona este modelo con otros
    static associate(models) {
      // Un Producto puede estar en muchos RemitoItems
      this.hasMany(models.RemitoItem, { foreignKey: 'productoId' });
    }
  }
  Producto.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    precio: DataTypes.FLOAT,
    stock: DataTypes.INTEGER,
    codigoDeBarras: {
      type: DataTypes.STRING,
      unique: true
    },
    categoria: {
    type: DataTypes.STRING,
    allowNull: false, // Lo hacemos obligatorio para que siempre haya un valor
    defaultValue: 'General' // Si no se especifica, se guardará como 'General'
  }
    // ... y los demás campos que tenías ...
  }, {
    sequelize,
    modelName: 'Producto',
    tableName: 'productos',
    timestamps: false // O true, como prefieras
  });
  return Producto;
};