import User from './User.js';
import Buyer from './Buyer.js';
import Seller from './Seller.js';
import Address from './Address.js';
import Session from './Session.js';
import Token from './Token.js';
import Role from './Role.js';
import UserRole from './UserRole.js';

// Define associations
// User <-> Buyer (one-to-one)
User.hasOne(Buyer, { foreignKey: 'userId', as: 'buyerProfile' });
Buyer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Seller (one-to-one)
User.hasOne(Seller, { foreignKey: 'userId', as: 'sellerProfile' });
Seller.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Roles (many-to-many)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId', as: 'users' });

// Note: Session, Token, and Address associations are already defined in their respective model files
// to avoid duplicate alias conflicts. They reference User correctly via 'userId' FK.

// Import models to ensure relationships are established
const models = {
  User,
  Buyer,
  Seller,
  Address,
  Session,
  Token,
  Role,
  UserRole
};

export default models;