'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Factura extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Definimos la relación: Una Factura tiene muchos FacturaItem
      this.hasMany(models.FacturaItem, {
        foreignKey: 'facturaId',
        as: 'items' // Un alias útil para las consultas
      });
    }
  }
  
  Factura.init({
    // Todos los campos de tu factura
    clienteNombre: DataTypes.STRING,
    clienteCUIT: DataTypes.STRING,
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    subtotalSinIVA: DataTypes.FLOAT,
    totalIVA: DataTypes.FLOAT,
    totalConIVA: DataTypes.FLOAT,
    tipoComprobante: DataTypes.STRING,
    puntoDeVenta: DataTypes.INTEGER,
    numeroComprobante: DataTypes.INTEGER,
    cae: DataTypes.STRING,
    vencimientoCae: DataTypes.DATE,
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'Generada'
    }
  }, {
    sequelize,
    // Asegurarse de que el modelName coincida exactamente
    modelName: 'Factura', 
    tableName: 'facturas',
    // Usamos timestamps para createdAt y updatedAt, ya que están en tu migración
    timestamps: true 
  });

  return Factura;
};
