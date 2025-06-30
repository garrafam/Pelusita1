'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FacturaItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Un item pertenece a UNA Factura
      this.belongsTo(models.Factura, {
        foreignKey: 'facturaId'
      });
      // Un item pertenece a UN Producto
      this.belongsTo(models.Producto, {
        foreignKey: 'productoId'
      });
    }
  }

  FacturaItem.init({
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    precioUnitario: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'FacturaItem',
    tableName: 'factura_items',
    timestamps: true
  });

  return FacturaItem;
};
