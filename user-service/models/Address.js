import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Address = sequelize.define('Address', {
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
  type: {
    type: DataTypes.ENUM('home', 'work', 'other'),
    allowNull: false,
    defaultValue: 'home'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  street: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  zipCode: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'India'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'addresses',
  hooks: {
    beforeCreate: async (address) => {
      // If this is the first address for the user, make it default
      const existingAddresses = await Address.count({
        where: { userId: address.userId }
      });
      if (existingAddresses === 0) {
        address.isDefault = true;
      }
    },
    beforeUpdate: async (address) => {
      // If setting this address as default, unset others
      if (address.changed('isDefault') && address.isDefault) {
        await Address.update(
          { isDefault: false },
          { 
            where: { 
              userId: address.userId,
              id: { [sequelize.Sequelize.Op.ne]: address.id }
            }
          }
        );
      }
    }
  }
});

// Define relationship
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });

export default Address; 