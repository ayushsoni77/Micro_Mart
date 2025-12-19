import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Star, Clock, Zap, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import axios from 'axios';
import { LayoutGroup, motion } from 'framer-motion';

interface Product {
  id?: number;
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  images?: string[];
  detailedDescription?: string;
  isLimited?: boolean;
  isUpcoming?: boolean;
  launchDate?: string;
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
  };
}

interface ProductDetailModalProps {
  productId: string | number | null;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ productId, onClose }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<any>(null);
  
  useEffect(() => {
    if (productId) {
      setLoading(true);
      Promise.all([
        axios.get(`http://localhost:3002/api/products/${productId}`),
        axios.get(`http://localhost:3006/api/reviews/product/${productId}/stats`).catch(() => null)
      ])
        .then(([productRes, reviewRes]) => {
          setProduct(productRes.data);
          setReviewStats(reviewRes?.data?.stats || null);
        })
        .catch(() => {
          setProduct(null);
          setReviewStats(null);
        })
        .finally(() => setLoading(false));
    }
  }, [productId]);
  
  if (!productId) return null;
  
  const averageRating = reviewStats?.averageRating || 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeInModal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-scaleIn">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl">×</button>
        {loading ? (
          <div className="flex items-center justify-center min-h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : !product ? (
          <div className="text-center py-12">Product not found</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
              <img src={product.image || (product.images && product.images[0])} alt={product.name} className="w-64 h-64 object-cover rounded-xl shadow" />
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                <p className="text-gray-600 mb-2">{product.description}</p>
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(averageRating) 
                          ? 'text-warning-400 fill-current' 
                          : 'text-neutral-300'
                      }`} 
                    />
                  ))}
                  <span className="text-sm text-grey ml-2">
                    ({averageRating.toFixed(1)})
                  </span>
                  {(reviewStats?.totalReviews || 0) > 0 && (
                    <span className="text-xs text-grey ml-1">
                      ({reviewStats?.totalReviews || 0} reviews)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mb-2">
                  <span className="text-2xl font-bold text-dark-grey">${product.price.toFixed(2)}</span>
                  <span className="text-xs text-success-600 bg-success-100 px-2 py-1 rounded-full">{product.stock} in stock</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                  <span className="text-gray-700">
                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
            {product.detailedDescription && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Product Details</h3>
                <div className="text-gray-700 space-y-2">
                  {product.detailedDescription.includes('\n') ? (
                    <ul className="list-disc pl-5">
                      {product.detailedDescription.split('\n').map((line: string, idx: number) => (
                        <li key={idx}>{line.replace(/^•\s*/, '')}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{product.detailedDescription}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [limitedEdition, setLimitedEdition] = useState<Product[]>([]);
  const [upcomingProducts, setUpcomingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/products');
      const products = response.data || [];
      
      // Fetch review stats for real products
      const productsWithReviews = await Promise.all(
        products.map(async (product: Product) => {
          try {
            const reviewResponse = await axios.get(`http://localhost:3006/api/reviews/product/${product._id || product.id}/stats`);
            return {
              ...product,
              reviewStats: reviewResponse.data.stats
            };
          } catch (error) {
            // If review stats fail, continue without them
            return {
              ...product,
              reviewStats: { averageRating: 0, totalReviews: 0 }
            };
          }
        })
      );
      
      // Simulate featured, limited edition, and upcoming products
      setFeaturedProducts(productsWithReviews.slice(0, 4));
      setLimitedEdition(productsWithReviews.slice(0, 3).map((p: Product) => ({ ...p, isLimited: true })));
      setUpcomingProducts([
        {
          id: 997,
          name: 'iPhone 16 Pro Max',
          description: 'The most advanced iPhone yet with revolutionary camera system',
          price: 1199.99,
          category: 'Electronics',
          stock: 0,
          image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=500',
          isUpcoming: true,
          launchDate: '2024-09-20',
          reviewStats: { averageRating: 0, totalReviews: 0 }
        },
        {
          id: 998,
          name: 'Tesla Model Y 2025',
          description: 'Next generation electric vehicle with enhanced autopilot',
          price: 52999.99,
          category: 'Automotive',
          stock: 0,
          image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=500',
          isUpcoming: true,
          launchDate: '2024-12-01',
          reviewStats: { averageRating: 0, totalReviews: 0 }
        },
        {
          id: 999,
          name: 'MacBook Pro M4',
          description: 'Revolutionary M4 chip with unprecedented performance',
          price: 2499.99,
          category: 'Electronics',
          stock: 0,
          image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=500',
          isUpcoming: true,
          launchDate: '2024-10-15',
          reviewStats: { averageRating: 0, totalReviews: 0 }
        }
      ]);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    const productId = product._id || product.id;
    if (!productId) return;
    
    setAddingToCart(productId as any);
    try {
      await addToCart({
        productId: productId,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.image,
        quantity: 1
    });
    
    setAddedToCart(productId as any);
    setTimeout(() => setAddedToCart(null), 1000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-500 rounded-3xl animate-slideUp">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-8 py-20 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Welcome to MicroMart
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Discover amazing products from trusted sellers worldwide. Shop the latest trends and exclusive collections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-white text-primary-500 px-8 py-4 rounded-xl font-bold text-lg hover:bg-neutral-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Shop Now
            </Link>
            <Link
              to="/register"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary-500 transition-all duration-200"
            >
              Join as Seller
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Products */}
      <section className="animate-slideUp">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-dark-grey mb-2">Upcoming Launches</h2>
            <p className="text-grey">Be the first to know about our latest products</p>
          </div>
          <Clock className="w-8 h-8 text-primary-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcomingProducts.map((product, idx) => (
            <Link
              to={`/products/${product.id}`}
              key={product.id}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden group hover:transform hover:scale-105 transition-all duration-300 animate-slideUp"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-warning-400 text-dark-grey px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Coming Soon
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-dark-grey mb-2">{product.name}</h3>
                <p className="text-grey text-sm mb-4 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-dark-grey">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-primary-600 font-medium">
                    Launch: {new Date(product.launchDate!).toLocaleDateString()}
                  </span>
                </div>
                
                <button className="w-full bg-neutral-400 text-white py-3 px-6 rounded-lg font-medium cursor-not-allowed">
                  Notify Me
                </button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Limited Edition */}
      <section className="animate-slideUp">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-dark-grey mb-2">Limited Edition</h2>
            <p className="text-grey">Exclusive products available for a limited time</p>
          </div>
          <Zap className="w-8 h-8 text-warning-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {limitedEdition.map((product, idx) => (
            <Link
              to={`/products/${product.id}`}
              key={product.id}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden group hover:transform hover:scale-105 transition-all duration-300 animate-slideUp"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-warning-400 text-dark-grey px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Limited
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-danger-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    Only {Math.floor(Math.random() * 10) + 1} left
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-dark-grey mb-2">{product.name}</h3>
                <p className="text-grey text-sm mb-4 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.reviewStats?.averageRating || 0) 
                          ? 'text-warning-400 fill-current' 
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-grey ml-2">
                    ({product.reviewStats?.averageRating?.toFixed(1) || '0.0'})
                  </span>
                  {(product.reviewStats?.totalReviews || 0) > 0 && (
                    <span className="text-xs text-grey ml-1">
                      ({product.reviewStats?.totalReviews || 0} reviews)
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-dark-grey">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(product);
                  }}
                  disabled={product.stock === 0 || addedToCart === product.id || addingToCart === product.id}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    addedToCart === product.id
                      ? 'bg-success-500 text-white'
                      : product.stock === 0 || addingToCart === product.id
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {addedToCart === product.id ? (
                    <>
                    <span>Added!</span>
                    </>
                  ) : addingToCart === product.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="animate-slideUp">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-dark-grey mb-2">Featured Products</h2>
            <p className="text-grey">Handpicked products just for you</p>
          </div>
          <Link
            to="/products"
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <LayoutGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden group hover:transform hover:scale-105 transition-all duration-300 animate-slideUp cursor-pointer"
              style={{ animationDelay: `${idx * 80}ms` }}
              onClick={() => navigate(`/products/${product.id}`)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  layoutId={`product-image-${String(product.id)}`}
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-dark-grey mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-grey text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.reviewStats?.averageRating || 0) 
                          ? 'text-warning-400 fill-current' 
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-grey ml-2">
                    ({product.reviewStats?.averageRating?.toFixed(1) || '0.0'})
                  </span>
                  {(product.reviewStats?.totalReviews || 0) > 0 && (
                    <span className="text-xs text-grey ml-1">
                      ({product.reviewStats?.totalReviews || 0} reviews)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-dark-grey">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-success-600 bg-success-100 px-2 py-1 rounded-full">
                    {product.stock} in stock
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </LayoutGroup>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-500 rounded-3xl p-8 text-white animate-slideUp">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <TrendingUp className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">10,000+</h3>
            <p className="text-white/80">Happy Customers</p>
          </div>
          <div>
            <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">50,000+</h3>
            <p className="text-white/80">Products Sold</p>
          </div>
          <div>
            <Star className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">4.8/5</h3>
            <p className="text-white/80">Average Rating</p>
          </div>
        </div>
      </section>
      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
      )}
    </div>
  );
};

export default Home;