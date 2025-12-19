import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, Bell, Package, LogOut, Menu, X, Plus, Minus, Trash2, LogIn, Store, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { items, getTotalItems, getTotalPrice, updateQuantity, removeFromCart, loading: cartLoading } = useCart();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [updatingCart, setUpdatingCart] = useState<number | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const publicNavLinks = [
    { path: '/products', label: 'Products', icon: ShoppingCart },
  ];

  const buyerNavLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Package },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const sellerNavLinks = [
    { path: '/seller-dashboard', label: 'Seller Dashboard', icon: Store },
    { path: '/orders', label: 'Manage Orders', icon: Package },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const getNavLinks = () => {
    if (!user) return [];
    return user.role === 'seller' ? sellerNavLinks : buyerNavLinks;
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    setUpdatingCart(itemId);
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setUpdatingCart(null);
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    setUpdatingCart(itemId);
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setUpdatingCart(null);
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-dark-grey">
                MicroMart
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Public Links */}
              {publicNavLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(path)
                      ? 'bg-primary-500 text-white'
                      : 'text-grey hover:text-primary-500 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Role-specific Links */}
              {user && getNavLinks().map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(path)
                      ? 'bg-primary-500 text-white'
                      : 'text-grey hover:text-primary-500 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {path === '/notifications' && (
                    <span className="bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      3
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Side Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart Icon (only for buyers) */}
              {(!user || user.role === 'buyer') && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-grey hover:text-primary-500 transition-colors"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              )}
              
              {user ? (
                /* Profile Dropdown */
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-dark-grey hover:text-primary-500 transition-colors p-2 rounded-lg hover:bg-neutral-50"
                  >
                    {user.role === 'seller' ? (
                      <Store className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                      {user.role}
                    </span>
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-neutral-200">
                        <p className="text-sm font-medium text-dark-grey">{user.name}</p>
                        <p className="text-sm text-grey">{user.email}</p>
                        <p className="text-xs text-primary-600 font-medium capitalize">{user.role} Account</p>
                      </div>
                      <div className="py-2">
                        {user.role === 'buyer' ? (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-dark-grey hover:bg-neutral-50"
                            >
                              <Package className="w-4 h-4 mr-3" />
                              Dashboard
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-dark-grey hover:bg-neutral-50"
                            >
                              <Package className="w-4 h-4 mr-3" />
                              My Orders
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/seller-dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-dark-grey hover:bg-neutral-50"
                            >
                              <Store className="w-4 h-4 mr-3" />
                              Seller Dashboard
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center px-4 py-2 text-sm text-dark-grey hover:bg-neutral-50"
                            >
                              <BarChart3 className="w-4 h-4 mr-3" />
                              Manage Orders
                            </Link>
                          </>
                        )}
                        <Link
                          to="/notifications"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-dark-grey hover:bg-neutral-50"
                        >
                          <Bell className="w-4 h-4 mr-3" />
                          Notifications
                        </Link>
                      </div>
                      <div className="border-t border-neutral-200 py-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Login/Register Links */
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 px-4 py-2 text-grey hover:text-primary-500 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-grey hover:bg-neutral-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-neutral-200 py-4">
              <div className="flex flex-col space-y-2">
                {/* Public Links */}
                {publicNavLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(path)
                        ? 'bg-primary-500 text-white'
                        : 'text-grey hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                ))}

                {/* Role-specific Links */}
                {user && getNavLinks().map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(path)
                        ? 'bg-primary-500 text-white'
                        : 'text-grey hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                ))}
                
                {(!user || user.role === 'buyer') && (
                  <button
                    onClick={() => {
                      setIsCartOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-grey hover:bg-neutral-100 rounded-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Cart ({getTotalItems()})</span>
                  </button>
                )}
                
                <div className="border-t border-neutral-200 pt-2 mt-2">
                  {user ? (
                    <>
                      <div className="flex items-center space-x-2 px-3 py-2 text-dark-grey">
                        {user.role === 'seller' ? (
                          <Store className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-primary-600 ml-2 capitalize">({user.role})</span>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-3 py-2 text-danger-600 hover:bg-danger-50 rounded-lg w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-grey hover:bg-neutral-100 rounded-lg"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Login</span>
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                      >
                        <User className="w-4 h-4" />
                        <span>Sign Up</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Cart Sidebar (only for buyers) */}
      {isCartOpen && (!user || user.role === 'buyer') && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <h2 className="text-xl font-bold text-dark-grey">Shopping Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-grey hover:text-dark-grey rounded-lg hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 bg-neutral-50 rounded-lg p-4">
                        <Link to={`/products/${item.productId}`} onClick={() => setIsCartOpen(false)}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg hover:scale-110 transition-transform"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/products/${item.productId}`} 
                            onClick={() => setIsCartOpen(false)}
                            className="text-sm font-medium text-dark-grey truncate hover:text-primary-500 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-grey">${item.price.toFixed(2)}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={updatingCart === item.id || cartLoading}
                              className="p-1 text-grey hover:text-dark-grey rounded disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-dark-grey min-w-[2rem] text-center">
                              {updatingCart === item.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mx-auto"></div>
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={updatingCart === item.id || cartLoading}
                              className="p-1 text-grey hover:text-dark-grey rounded disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right flex items-center justify-center h-full">
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            disabled={updatingCart === item.id || cartLoading}
                            className="animated-delete-btn disabled:opacity-50"
                            type="button"
                          >
                            <svg viewBox="0 0 448 512" className="svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-dark-grey mb-2">Your cart is empty</h3>
                    <p className="text-grey">Add some products to get started!</p>
                    <Link
                      to="/products"
                      onClick={() => setIsCartOpen(false)}
                      className="inline-block mt-4 bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200"
                    >
                      Browse Products
                    </Link>
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {items.length > 0 && (
                <div className="border-t border-neutral-200 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-dark-grey">Total:</span>
                    <span className="text-xl font-bold text-dark-grey">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  {user && user.role === 'buyer' ? (
                    <Link
                      to="/orders"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200 flex items-center justify-center"
                    >
                      Proceed to Checkout
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-grey text-center">Please login as a buyer to place an order</p>
                      <Link
                        to="/login"
                        onClick={() => setIsCartOpen(false)}
                        className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200 flex items-center justify-center"
                      >
                        Login to Checkout
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside handlers */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;

<style>{`
.animated-delete-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgb(20, 20, 20);
  border: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.10);
  cursor: pointer;
  transition-duration: .3s;
  overflow: hidden;
  position: relative;
  margin: 0;
}
.animated-delete-btn .svgIcon {
  width: 14px;
  transition-duration: .3s;
}
.animated-delete-btn .svgIcon path {
  fill: white;
}
.animated-delete-btn:hover {
  width: 100px;
  border-radius: 50px;
  transition-duration: .3s;
  background-color: rgb(255, 69, 69);
  align-items: center;
}
.animated-delete-btn:hover .svgIcon {
  width: 36px;
  transition-duration: .3s;
  transform: translateY(60%);
}
.animated-delete-btn::before {
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  content: "Delete";
  color: white;
  transition-duration: .3s;
  font-size: 2px;
  text-align: center;
  opacity: 0;
}
.animated-delete-btn:hover::before {
  font-size: 13px;
  opacity: 1;
  transform: translateY(20px);
  transition-duration: .3s;
}
`}</style>