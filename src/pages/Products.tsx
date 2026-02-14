import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Search, Filter, Star, Plus } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
}

interface ProductWithReviews extends Product {
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
  };
}

const Products = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<ProductWithReviews[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [addedToCart, setAddedToCart] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      const productsData = response.data; // MongoDB returns array directly
      
      // Fetch review stats for each product
      const productsWithReviews = await Promise.all(
        productsData.map(async (product: Product) => {
          try {
            const reviewResponse = await axios.get(`${API_BASE_URL}/reviews/product/${product._id || product.id}/stats`);
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
      
      setProducts(productsWithReviews);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!products) {
      setFilteredProducts([]);
      return;
    }

    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (product: ProductWithReviews) => {
    const productId = product._id || product.id; // Handle both MongoDB _id and legacy id
    if (!productId) return;
    
    setAddingToCart(productId as any);
    try {
      await addToCart({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || product.image,
      });
      setAddedToCart(productId as any);
      setTimeout(() => setAddedToCart(null), 2000);
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

  const categories = [...new Set(products.map(product => product.category))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
        <p className="text-lg text-gray-600">Discover amazing products at great prices</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product, idx) => (
          <Link
            to={`/products/${product._id || product.id}`}
            key={product._id || product.id}
            className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden hover:transform hover:scale-105 transition-all duration-200 group animate-slideUp"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Product Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={product.images?.[0] || product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-4 right-4">
                <span className="bg-white/90 text-dark-grey px-2 py-1 rounded-full text-xs font-medium">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-dark-grey mb-2 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-grey text-sm mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Rating */}
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

              {/* Price and Stock */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-dark-grey">
                  ${product.price.toFixed(2)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.stock > 10 
                    ? 'bg-success-100 text-success-800' 
                    : product.stock > 0 
                    ? 'bg-warning-100 text-warning-800'
                    : 'bg-danger-100 text-danger-800'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent navigation when clicking add to cart
                  handleAddToCart(product);
                }}
                disabled={product.stock === 0 || addedToCart === (product._id || product.id) || addingToCart === (product._id || product.id)}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  addedToCart === (product._id || product.id)
                    ? 'bg-success-500 text-white'
                    : product.stock === 0 || addingToCart === (product._id || product.id)
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {addedToCart === (product._id || product.id) ? (
                  <>
                    <span>Added!</span>
                  </>
                ) : addingToCart === (product._id || product.id) ? (
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

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-12 text-center animate-fadeIn">
          <ShoppingCart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-dark-grey mb-2">No products found</h3>
          <p className="text-grey">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default Products;