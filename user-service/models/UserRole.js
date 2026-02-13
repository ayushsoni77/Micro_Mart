import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  }
}, {
  tableName: 'user_roles',
  indexes: [
    { unique: true, fields: ['user_id', 'role_id'] }
  ]
});

export default UserRole;
