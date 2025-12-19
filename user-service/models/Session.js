import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.STRING(255),
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45), // IPv6 compatible
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'sessions',
  indexes: [
    {
      fields: ['user_id'] // Use the actual column name in database
    },
    {
      fields: ['expires_at'] // Use the actual column name in database
    },
    {
      fields: ['id']
    }
  ]
});

// Define relationship
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });

export default Session; 