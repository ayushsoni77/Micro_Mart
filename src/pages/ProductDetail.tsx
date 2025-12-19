import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw,
  User,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

interface Product {
  id?: number;
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  views: number;
  salesCount: number;
  detailedDescription?: string; // Added for detailed description
}

interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
  notHelpful: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [votingReview, setVotingReview] = useState<number | null>(null);
  const didFetch = useRef(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id && !didFetch.current) {
      fetchProductDetails();
      fetchReviews();
      didFetch.current = true;
    }
    // Reset didFetch when id changes (for navigation between products)
    return () => {
      didFetch.current = false;
    };
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3002/api/products/${id}`);
        setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:3006/api/reviews/product/${id}`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      const productId = product._id || product.id;
      if (!productId) return;
      
      setAddingToCart(true);
      try {
        await addToCart({
          id: productId, // Use 'id' instead of 'productId'
          name: product.name,
          price: product.price,
          image: product.images[0],
        }, quantity); // Pass quantity as second parameter
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        setAddingToCart(false);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    try {
      const response = await axios.post(
        'http://localhost:3006/api/reviews/',
        {
          productId: product._id || product.id,
      rating: newReview.rating,
      comment: newReview.comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReviews([response.data.review, ...reviews]);
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error submitting review');
    }
  };

  const handleReviewVote = async (reviewId: number, isHelpful: boolean) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please login to vote on reviews',
        },
      });
      return;
    }
    setVotingReview(reviewId);
    try {
      const response = await axios.patch(
        `http://localhost:3006/api/reviews/${reviewId}/helpful`,
        { helpful: isHelpful }
      );
      setReviews(
        reviews.map((review) =>
          review.id === reviewId ? response.data.review : review
        )
      );
    } catch (error) {
      alert('Error voting on review');
    } finally {
      setVotingReview(null);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/products" className="text-blue-600 hover:text-blue-700">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <motion.img
              layoutId={`product-image-${String(id)}`}
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === index 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600">{product.description}</p>
            
            {/* Product Specifications */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-2 text-gray-600">{product.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Product ID:</span>
                  <span className="ml-2 text-gray-600">#{product.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Availability:</span>
                  <span className={`ml-2 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Views:</span>
                  <span className="ml-2 text-gray-600">{product.views || 0}</span>
                </div>
                {product.category === 'Electronics' && (
                  <>
                    <div>
                      <span className="font-medium text-gray-700">Warranty:</span>
                      <span className="ml-2 text-gray-600">1 Year</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Brand:</span>
                      <span className="ml-2 text-gray-600">Premium Brand</span>
                    </div>
                  </>
                )}
                {product.category === 'Health' && (
                  <>
                    <div>
                      <span className="font-medium text-gray-700">Material:</span>
                      <span className="ml-2 text-gray-600">Eco-Friendly</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Certification:</span>
                      <span className="ml-2 text-gray-600">FDA Approved</span>
                    </div>
                  </>
                )}
                {product.category === 'Appliances' && (
                  <>
                    <div>
                      <span className="font-medium text-gray-700">Power:</span>
                      <span className="ml-2 text-gray-600">110-240V</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Energy Rating:</span>
                      <span className="ml-2 text-gray-600">A+++</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Detailed Description from backend */}
            {product.detailedDescription && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Product Details</h3>
              <div className="text-gray-700 space-y-2">
                  {product.detailedDescription.includes('\n') ? (
                    <ul className="list-disc pl-5">
                      {product.detailedDescription.split('\n').map((line, idx) => (
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

          {/* Rating */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(averageRating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-medium text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-500">({reviews.length} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-4">
            <span className="text-4xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-lg text-gray-500 line-through">
              ${(product.price * 1.2).toFixed(2)}
            </span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              17% OFF
            </span>
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            <span className="text-gray-700">
              {product.stock > 10 
                ? 'In Stock' 
                : product.stock > 0 
                ? `Only ${product.stock} left` 
                : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleAddToCart}
              disabled={!product || product.stock === 0 || addedToCart || addingToCart}
              className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                addedToCart
                  ? 'bg-success-500 text-white'
                  : !product || product.stock === 0 || addingToCart
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {addedToCart ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                <span>Added to Cart!</span>
                </>
              ) : addingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Adding to Cart...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-6 h-6" />
                  <span>{product?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </>
              )}
            </button>

            <div className="flex space-x-4">
              <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;