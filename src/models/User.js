'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Ejemplo: si un usuario puede tener muchos productos:
      // this.hasMany(models.Producto, { foreignKey: 'userId' });
    }
  }

  User.init({
    // --- DEFINICIÓN DE LOS CAMPOS DE LA TABLA ---

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false, // El email es obligatorio
      unique: true,     // No puede haber dos usuarios con el mismo email
      validate: {
        isEmail: true   // Sequelize valida que el formato sea de un email
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false  // La contraseña es obligatoria
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user', // Rol por defecto (ej. 'user', 'admin')
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users', // Nombre de la tabla en la base de datos
    timestamps: true,   // Crea los campos createdAt y updatedAt automáticamente
    
    // --- HOOKS: ACCIONES AUTOMÁTICAS ---
    hooks: {
      // Este "hook" se ejecuta automáticamente ANTES de que un nuevo usuario se cree.
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};