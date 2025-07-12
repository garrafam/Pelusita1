// /models/Remito.js (VERSIÓN CORREGIDA Y COMPLETA)

'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Remito extends Model {
    static associate(models) {
      // Define aquí tus asociaciones. Por ejemplo, un remito tiene muchos ítems.
      this.hasMany(models.RemitoItem, { as: 'items', foreignKey: 'remitoId' });
    }
  }
  Remito.init({
    // Definimos solo las columnas que no son automáticas (id, createdAt, updatedAt)
    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },
    clienteNombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clienteCUIT: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subtotalSinIVA: DataTypes.DECIMAL(10, 2),
    totalIVA: DataTypes.DECIMAL(10, 2),
    totalConIVA: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Remito',
    tableName: 'remitos',
    timestamps: true // <-- LA OPCIÓN CLAVE Y LA SOLUCIÓN
  });
  return Remito;
};