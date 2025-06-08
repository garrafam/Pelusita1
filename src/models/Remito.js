'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Remito extends Model {
    static associate(models) {
      // Un Remito puede tener muchos items (productos con cantidades)
      this.hasMany(models.RemitoItem, {
        foreignKey: 'remitoId',
        as: 'items' // Un alias para acceder a los items del remito
      });
    }
  }
  
  Remito.init({
    // El 'id' es creado automáticamente por Sequelize
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    /*destino: {
      type: DataTypes.STRING,
      allowNull: false, // Este es el campo que daba el error al guardar
      validate: {
        notEmpty: {
          msg: 'El destino del remito es obligatorio.'
        }
      }
    },*/
    // --- CAMPOS FALTANTES QUE AÑADIMOS AQUÍ ---
    clienteNombre: {
      type: DataTypes.STRING,
      allowNull: true // Lo ponemos como opcional, puedes cambiarlo a false si lo necesitas
    },
    clienteCUIT: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subtotalSinIVA: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    totalIVA: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    totalConIVA: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    }
    // --- FIN DE LOS CAMPOS FALTANTES ---
  }, {
    sequelize,
    modelName: 'Remito',
    tableName: 'remitos',
    timestamps: false
  });

  return Remito;
};