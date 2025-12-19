import Order from './Order.js';
import OrderItem from './OrderItem.js';
import OrderStatus from './OrderStatus.js';

// Define relationships

// Order -> OrderItem (One-to-Many)
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE'
});
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

// Order -> OrderStatus (One-to-Many)
Order.hasMany(OrderStatus, {
  foreignKey: 'orderId',
  as: 'statusHistory',
  onDelete: 'CASCADE'
});
OrderStatus.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order'
});

export {
  Order,
  OrderItem,
  OrderStatus
};

export default {
  Order,
  OrderItem,
  OrderStatus
}; 