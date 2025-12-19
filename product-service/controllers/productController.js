import Product from '../models/Product.js';
import axios from 'axios';

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3005';

// Get all products with optional filtering
export const getProducts = async (req, res) => {
  try {
    const { category, search, seller } = req.query;
    console.log(`📦 Products request - Category: ${category || 'All'}, Search: ${search || 'None'}, Seller: ${seller || 'All'}`);
    
    // Build query
    let query = { isActive: true };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (seller && seller !== 'All') {
      query.sellerId = parseInt(seller);
    }
    
    // Execute query
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    // Fetch inventory data for each product
    const productsWithInventory = await Promise.all(
      products.map(async (product) => {
        try {
          const inventoryResponse = await axios.get(`${INVENTORY_SERVICE_URL}/api/inventory/${product._id}`);
          return {
            ...product,
            stock: inventoryResponse.data.stock || 0,
            views: product.views || 0
          };
        } catch (error) {
          console.log(`⚠️ Inventory service unavailable for product ${product._id}:`, error.message);
          return {
            ...product,
            stock: 0,
            views: product.views || 0
          };
        }
      })
    );
    
    console.log(`✅ Returning ${productsWithInventory.length} products with inventory data`);
    res.json(productsWithInventory);
  } catch (error) {
    console.error('❌ Get products error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Product details request for ID: ${id}`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Increment views
    await product.incrementViews();
    
    // Fetch inventory data
    let stock = 0;
    try {
      const inventoryResponse = await axios.get(`${INVENTORY_SERVICE_URL}/api/inventory/${id}`);
      stock = inventoryResponse.data.stock || 0;
    } catch (error) {
      console.log(`⚠️ Inventory service unavailable for product ${id}:`, error.message);
    }
    
    const productWithInventory = {
      ...product.toObject(),
      stock,
      views: product.views
    };
    
    console.log(`✅ Product found:`, {
      id: product._id,
      name: product.name,
      price: product.price,
      stock,
      views: product.views
    });
    
    res.json(productWithInventory);
  } catch (error) {
    console.error('❌ Get product by ID error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new product (for sellers)
export const createProduct = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const sellerName = req.user.name || req.user.email;
    
    console.log(`📦 Creating new product for seller ${sellerId}`);
    
    const productData = {
      ...req.body,
      sellerId,
      sellerName,
      images: req.body.images || []
    };
    
    const product = new Product(productData);
    await product.save();
    
    // Create inventory entry
    try {
      await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory`, {
        productId: product._id,
        stock: req.body.stock || 0
      });
      console.log(`✅ Inventory created for product ${product._id}`);
    } catch (error) {
      console.log(`⚠️ Inventory service unavailable:`, error.message);
    }
    
    console.log(`✅ Product created successfully:`, {
      productId: product._id,
      name: product.name,
      price: product.price,
      sellerId: product.sellerId
    });
    
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('❌ Create product error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product (for sellers)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.userId;
    
    console.log(`📦 Updating product ${id} for seller ${sellerId}`);
    
    const product = await Product.findOne({ _id: id, sellerId });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    
    // Update product
    Object.assign(product, req.body);
    await product.save();
    
    // Update inventory if stock is provided
    if (req.body.stock !== undefined) {
      try {
        await axios.put(`${INVENTORY_SERVICE_URL}/api/inventory/${id}`, {
          stock: req.body.stock
        });
        console.log(`✅ Inventory updated for product ${id}`);
      } catch (error) {
        console.log(`⚠️ Inventory service unavailable:`, error.message);
      }
    }
    
    console.log(`✅ Product updated successfully:`, {
      productId: product._id,
      name: product.name,
      price: product.price
    });
    
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('❌ Update product error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product (for sellers)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.userId;
    
    console.log(`📦 Deleting product ${id} for seller ${sellerId}`);
    
    const product = await Product.findOne({ _id: id, sellerId });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    
    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();
    
    console.log(`✅ Product deleted successfully:`, {
      productId: product._id,
      name: product.name
    });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Delete product error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get products by seller
export const getProductsBySeller = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    
    console.log(`📦 Getting products for seller ${sellerId}`);
    
    const products = await Product.findBySeller(sellerId);
    
    console.log(`✅ Found ${products.length} products for seller ${sellerId}`);
    
    res.json(products);
  } catch (error) {
    console.error('❌ Get products by seller error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    console.log(`📦 Getting featured products`);
    
    const products = await Product.findFeatured();
    
    console.log(`✅ Found ${products.length} featured products`);
    
    res.json(products);
  } catch (error) {
    console.error('❌ Get featured products error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};