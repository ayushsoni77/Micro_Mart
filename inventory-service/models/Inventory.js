import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    comment: 'Reference to the product in product-service (MongoDB ObjectId)'
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    comment: 'Available stock quantity'
  },
  reserved: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    comment: 'Reserved stock for pending orders'
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    comment: 'Total stock (available + reserved)'
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0,
    comment: 'Threshold for low stock alerts'
  },
  reorderPoint: {
    type: Number,
    default: 5,
    min: 0,
    comment: 'Point at which to reorder stock'
  },
  supplier: {
    name: String,
    contact: String,
    leadTime: Number, // in days
    minimumOrder: Number
  },
  location: {
    warehouse: {
      type: String,
      default: 'Main Warehouse'
    },
    aisle: String,
    shelf: String,
    bin: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    comment: 'Additional metadata for this inventory item'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
inventorySchema.index({ stock: 1 });
inventorySchema.index({ 'location.warehouse': 1 });
inventorySchema.index({ lastUpdated: -1 });

// Virtual for available stock
inventorySchema.virtual('available').get(function() {
  return this.stock - this.reserved;
});

// Virtual for stock status
inventorySchema.virtual('status').get(function() {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  if (this.stock <= this.reorderPoint) return 'reorder_needed';
  return 'in_stock';
});

// Pre-save middleware to update total
inventorySchema.pre('save', function(next) {
  this.total = this.stock + this.reserved;
  this.lastUpdated = new Date();
  next();
});

// Static method to find low stock items
inventorySchema.statics.findLowStock = function() {
  return this.find({
    $expr: {
      $lte: ['$stock', '$lowStockThreshold']
    }
  });
};

// Static method to find items needing reorder
inventorySchema.statics.findReorderNeeded = function() {
  return this.find({
    $expr: {
      $lte: ['$stock', '$reorderPoint']
    }
  });
};

// Instance method to reserve stock
inventorySchema.methods.reserveStock = function(quantity) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    this.reserved += quantity;
    return this.save();
  }
  throw new Error('Insufficient stock available');
};

// Instance method to release reserved stock
inventorySchema.methods.releaseReserved = function(quantity) {
  if (this.reserved >= quantity) {
    this.reserved -= quantity;
    this.stock += quantity;
    return this.save();
  }
  throw new Error('Insufficient reserved stock to release');
};

// Instance method to confirm reserved stock (for completed orders)
inventorySchema.methods.confirmReserved = function(quantity) {
  if (this.reserved >= quantity) {
    this.reserved -= quantity;
    return this.save();
  }
  throw new Error('Insufficient reserved stock to confirm');
};

// Instance method to add stock
inventorySchema.methods.addStock = function(quantity, notes = '') {
  this.stock += quantity;
  this.lastRestocked = new Date();
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory; 