import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  fetchCart: () => Promise<void>;
  syncCartWithBackend: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Fetch cart from backend on mount
  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.id) {
        console.log('No token or user found, skipping cart fetch');
        return;
      }

      const response = await axios.get(`http://localhost:3007/api/cart/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cart service returns cart items directly in response.data.cart
      if (response.data.cart) {
        setItems(response.data.cart);
        console.log('✅ Cart fetched from backend:', response.data.cart);
      } else {
        // Fallback: if no cart property, assume response.data is the cart array
        setItems(response.data || []);
        console.log('✅ Cart fetched from backend (fallback):', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Don't clear local cart on fetch failure
    }
  };

  const syncCartWithBackend = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.id) {
        console.log('No token or user found, skipping cart sync');
        return;
      }

      // For now, just fetch the cart to sync
      await fetchCart();
      console.log('✅ Cart synced with backend');
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  };

  const addToCart = async (product: any, quantity: number = 1) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.id) {
        console.log('No token or user found, adding to local cart only');
        // Add to local cart only
        setItems(prevItems => {
          const existingItem = prevItems.find(item => item.productId === product.id);
          if (existingItem) {
            return prevItems.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            return [...prevItems, {
              id: `${product.id}-${Date.now()}`,
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity,
              image: product.image
            }];
          }
        });
        return;
      }

      // Fetch product details if not already provided
      let productDetails = product;
      if (!product.name || !product.price || !product.image) {
        try {
          const productResponse = await axios.get(`http://localhost:3002/api/products/${product.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          productDetails = productResponse.data; // MongoDB returns product directly
        } catch (error) {
          console.error('Failed to fetch product details:', error);
          // Fallback to local cart
          setItems(prevItems => {
            const existingItem = prevItems.find(item => item.productId === product.id);
            if (existingItem) {
              return prevItems.map(item =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              );
            } else {
              return [...prevItems, {
                id: `${product.id}-${Date.now()}`,
                productId: product.id,
                name: product.name || 'Unknown Product',
                price: product.price || 0,
                quantity,
                image: product.image || ''
              }];
            }
          });
          return;
        }
      }

      const response = await axios.post(`http://localhost:3007/api/cart/${user.id}/items`, {
        productId: productDetails.id,
        name: productDetails.name,
        price: productDetails.price,
        image: productDetails.image,
        quantity: quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.cart) {
        setItems(response.data.cart);
        console.log('✅ Item added to cart:', response.data.cart);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Fallback to local cart
      setItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === product.id);
        if (existingItem) {
          return prevItems.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prevItems, {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            name: product.name || 'Unknown Product',
            price: product.price || 0,
            quantity,
            image: product.images?.[0] || product.image || ''
          }];
        }
      });
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.id) {
        console.log('No token or user found, removing from local cart only');
        setItems(prevItems => prevItems.filter(item => item.productId !== productId));
        return;
      }

      // Find the cart item ID for this product
      const cartItem = items.find(item => item.productId === productId);
      if (!cartItem) {
        console.log('Cart item not found for product:', productId);
        return;
      }

      const response = await axios.delete(`http://localhost:3007/api/cart/${user.id}/items/${cartItem.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.cart) {
        setItems(response.data.cart);
        console.log('✅ Item removed from cart:', response.data.cart);
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      // Fallback to local cart
      setItems(prevItems => prevItems.filter(item => item.productId !== productId));
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.id) {
        console.log('No token or user found, updating local cart only');
        setItems(prevItems =>
          prevItems.map(item =>
            item.productId === productId
              ? { ...item, quantity: Math.max(0, quantity) }
              : item
          ).filter(item => item.quantity > 0)
        );
        return;
      }

      // Find the cart item ID for this product
      const cartItem = items.find(item => item.productId === productId);
      if (!cartItem) {
        console.log('Cart item not found for product:', productId);
        return;
      }

      const response = await axios.put(`http://localhost:3007/api/cart/${user.id}/items/${cartItem.id}`, {
        quantity: quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.cart) {
        setItems(response.data.cart);
        console.log('✅ Cart quantity updated:', response.data.cart);
      }
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      // Fallback to local cart
      setItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        ).filter(item => item.quantity > 0)
      );
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.id) {
        console.log('No token or user found, clearing local cart only');
        setItems([]);
        return;
      }

      const response = await axios.delete(`http://localhost:3007/api/cart/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setItems([]);
      console.log('✅ Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      // Fallback to local cart
      setItems([]);
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    fetchCart,
    syncCartWithBackend,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};