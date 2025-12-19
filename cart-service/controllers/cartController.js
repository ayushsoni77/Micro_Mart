// In-memory cart storage (replace with database in production)
const carts = {};

export const getCart = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Verify user can only access their own cart
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own cart.' });
    }

    const userCart = carts[userId] || [];
    res.json({ cart: userCart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addItemToCart = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { productId, name, price, image, quantity = 1 } = req.body;

    // Verify user can only modify their own cart
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own cart.' });
    }

    // Validate required fields
    if (!productId || !name || !price || !image) {
      return res.status(400).json({ message: 'Product ID, name, price, and image are required' });
    }

    if (!carts[userId]) {
      carts[userId] = [];
    }

    console.log('Cart before add:', JSON.stringify(carts[userId]));
    // Check if item already exists in cart
    const existingItemIndex = carts[userId].findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      carts[userId][existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      const cartItem = {
        id: Date.now() + Math.random(), // Generate unique ID
        productId,
        name,
        price,
        image,
        quantity,
        addedAt: new Date().toISOString()
      };
      carts[userId].push(cartItem);
    }
    console.log('Cart after add:', JSON.stringify(carts[userId]));

    res.status(201).json({ 
      message: 'Item added to cart successfully',
      cart: carts[userId]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateCartItem = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const itemId = parseFloat(req.params.itemId);
    const { quantity } = req.body;
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own cart.' });
    }
    if (!carts[userId]) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    console.log('Cart before update:', JSON.stringify(carts[userId]));
    const itemIndex = carts[userId].findIndex(item => Number(item.id) === Number(itemId));
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    if (quantity <= 0) {
      carts[userId].splice(itemIndex, 1);
      console.log('Cart after remove (from update):', JSON.stringify(carts[userId]));
      res.json({ 
        message: 'Item removed from cart',
        cart: carts[userId]
      });
    } else {
      carts[userId][itemIndex].quantity = quantity;
      console.log('Cart after update:', JSON.stringify(carts[userId]));
      res.json({ 
        message: 'Cart item updated successfully',
        cart: carts[userId]
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeCartItem = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const itemId = parseFloat(req.params.itemId);
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own cart.' });
    }
    if (!carts[userId]) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    console.log('Cart before remove:', JSON.stringify(carts[userId]));
    const itemIndex = carts[userId].findIndex(item => Number(item.id) === Number(itemId));
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    carts[userId].splice(itemIndex, 1);
    console.log('Cart after remove:', JSON.stringify(carts[userId]));
    res.json({ 
      message: 'Item removed from cart successfully',
      cart: carts[userId]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const clearCart = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Verify user can only modify their own cart
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own cart.' });
    }

    carts[userId] = [];
    res.json({ 
      message: 'Cart cleared successfully',
      cart: []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 