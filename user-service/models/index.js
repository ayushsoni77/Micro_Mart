import User from './User.js';
import Buyer from './Buyer.js';
import Seller from './Seller.js';
import Address from './Address.js';
import Session from './Session.js';
import Token from './Token.js';

// Import models to ensure relationships are established
const models = {
  User,
  Buyer,
  Seller,
  Address,
  Session,
  Token
};

export default models; 