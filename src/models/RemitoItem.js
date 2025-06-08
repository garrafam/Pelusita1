'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RemitoItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Un item de remito pertenece a un Remito
      this.belongsTo(models.Remito, {
        foreignKey: 'remitoId'
      });
      // Un item de remito también pertenece a un Producto
      this.belongsTo(models.Producto, {
        foreignKey: 'productoId'
      });
    }
  }
  RemitoItem.init({
    // El 'id' es creado automáticamente por Sequelize
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'La cantidad debe ser como mínimo 1.'
        }
      }
    }
    // Las columnas 'remitoId' y 'productoId' se crearán automáticamente
    // gracias a las asociaciones definidas arriba.
  }, {
    sequelize,
    modelName: 'RemitoItem',
    tableName: 'remito_items',
    timestamps: false
  });
  return RemitoItem;
};