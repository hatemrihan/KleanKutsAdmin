@echo off
echo ===== Elevee Admin Netlify Deployment Helper =====
echo.

echo Checking for dependencies...
where netlify >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Netlify CLI not found. Installing...
  npm install -g netlify-cli
)

echo.
echo === Step 1: Clean up ===
echo Cleaning npm cache...
npm cache clean --force

echo.
echo === Step 2: Reset installation if needed ===
choice /c YN /m "Do you want to reset the npm installation (removes package-lock.json and node_modules)?"
if %ERRORLEVEL% equ 1 (
  node scripts/reset-install.js
  echo Installing dependencies...
  npm install --legacy-peer-deps --prefer-offline
) else (
  echo Skipping reset.
)

echo.
echo === Step 3: Deploy to Netlify ===
echo Starting Netlify deployment...
netlify deploy --prod

echo.
echo === Deployment process complete ===
echo Check the Netlify dashboard for build status.
echo.
echo If you encounter issues, visit: https://eleveadmin.netlify.app/api/diagnose
echo.
pause 
very good, the corrected one just showing the 'NEW ARRIVALS' section good without any errors, the second one is the one that iam working on but i have errors in it in this section so take , the first one:'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import axios from 'axios'
import Nav from '@/app/sections/nav'
import { useCart } from '@/app/context/CartContext'
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import NewFooter from '@/app/sections/NewFooter'

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  discount?: number;
  color?: string;
}

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  isPreOrder: boolean;
}

interface Product {
  _id: string;
  name: string;
  title?: string;
  price: number;
  images: string[];
  selectedImages?: string[];
  description: string;
  materials: string[];
  sizeGuide: string;
  packaging: string;
  shippingReturns: string;
  sizes: SizeStock[];
  variants: ProductVariant[];
  discount?: number;
  categories?: string[];
}

type ProductsType = {
  [key: string]: Product;
}

// This will be replaced with API data later
const localProducts: ProductsType = {
  1: {
    _id: "1",
    name: '01 Sage set in Rich brown',
    price: 1300,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: 'Experience the perfect blend of luxury and ease with this Rich Brown French linen set. Naturally breathable, and effortlessly elegant, it brings warmth and refinement to any setting.',
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: [
      { size: 'S', color: 'Rich Brown', stock: 5, isPreOrder: false },
      { size: 'M', color: 'Rich Brown', stock: 10, isPreOrder: false },
      { size: 'L', color: 'Rich Brown', stock: 15, isPreOrder: false },
      { size: 'XL', color: 'Rich Brown', stock: 5, isPreOrder: true }
    ],
    discount: 0,
    categories: []
  },
  2: {
    _id: "2",
    name: '02 Sage set in light beige',
    price: 1300,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: 'Experience the perfect blend of luxury and ease with this Rich Brown French linen set. Naturally breathable, and effortlessly elegant, it brings warmth and refinement to any setting.',
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  3: {
    _id: "3",
    name: 'Sage top in Rich brown',
    price: 700,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  4: {
    _id: "4",
    name: 'Sage top in light beige',
    price: 700,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: 'Effortlessly chic and breathable, this Rich Brown French linen top offers a perfect balance of comfort and elegance. Its timeless design and natural texture make it a versatile wardrobe essential',
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  5: {
    _id: "5",
    name: 'Sage pants in rich brown',
    price: 600,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: "Designed for effortless style and comfort, these rich brown French linen pants offer a relaxed yet refined fit. Lightweight, breathable, and timeless, they're perfect for any occasion",
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  6: {
    _id: "6",
    name: 'Sage pants in light beige',
    price: 600,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: "Designed for effortless style and comfort, these rich brown French linen pants offer a relaxed yet refined fit. Lightweight, breathable, and timeless, they're perfect for any occasion",
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  7: {
    _id: "7",
    name: 'Linen Blazer in Rich brown',
    price: 900,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: "Elevate your wardrobe with our rich brown French linen blazer. Combining sophisticated tailoring with the natural comfort of linen, this piece transitions effortlessly from casual to formal settings.",
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  8: {
    _id: "8",
    name: 'Linen Blazer in Light beige',
    price: 900,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: "Elevate your wardrobe with our light beige French linen blazer. Combining sophisticated tailoring with the natural comfort of linen, this piece transitions effortlessly from casual to formal settings.",
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  9: {
    _id: "9",
    name: 'Linen Shirt in Rich brown',
    price: 550,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: "Our rich brown French linen shirt embodies casual luxury. With its relaxed fit and breathable fabric, it offers unmatched comfort while maintaining a refined appearance perfect for any occasion.",
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  },
  10: {
    _id: "10",
    name: 'Linen Shirt in Light beige',
    price: 550,
    images: [
      '/images/try-image.jpg',
      '/images/try-image.jpg',
      '/images/try-image.jpg'
    ],
    description: "Our light beige French linen shirt embodies casual luxury. With its relaxed fit and breathable fabric, it offers unmatched comfort while maintaining a refined appearance perfect for any occasion.",
    materials: ['French linen'],
    sizeGuide: 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
    packaging: 'Premium eco-friendly packaging',
    shippingReturns: 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
    sizes: [
      { size: 'S', stock: 10, isPreOrder: false },
      { size: 'M', stock: 10, isPreOrder: false },
      { size: 'L', stock: 10, isPreOrder: false },
      { size: 'XL', stock: 10, isPreOrder: false }
    ],
    variants: []
  }
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

type Props = {
  params: {
    id: string
  }
}

const ProductPage = ({ params }: Props) => {
  const router = useRouter()
  const { id } = params
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1)
  const [showAddedAnimation, setShowAddedAnimation] = useState(false)
  const pathname = usePathname()
  const { addToCart } = useCart()
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSizeMessage, setShowSizeMessage] = useState(false);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('Fetching product with ID:', id);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          console.error('API error response:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          throw new Error(`Product not found: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw product data:', data);
        
        // Transform the data to match our Product interface
        const transformedProduct: Product = {
          _id: data._id,
          name: data.title || 'Untitled Product',
          price: data.price || 0,
          images: data.selectedImages?.map((img: string) => 
            img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`
          ) || [],
          description: data.description || '',
          materials: data.materials?.split(',') || ['French linen'],
          sizeGuide: data.sizeGuide || 'Small fits from 50 to 58 kgs\nMedium from 59 to 70 kgs',
          packaging: data.packaging || 'Premium eco-friendly packaging',
          shippingReturns: data.shippingReturns || 'Shipping in 3-7 days. Try-on at delivery. Immediate return required if unsatisfied. No returns after courier leaves.',
          sizes: data.selectedSizes?.map((size: string) => ({
            size,
            stock: data.stock || 0,
            isPreOrder: false
          })) || [],
          variants: data.variants || [],
          discount: data.discount || 0,
          categories: data.categories || []
        };
        
        // Make sure we have variants data
        if (transformedProduct.variants.length === 0 && data.selectedSizes && data.selectedSizes.length > 0) {
          console.log('Creating default variants from selectedSizes:', data.selectedSizes);
          // Create default variants if none exist but sizes are specified
          transformedProduct.variants = data.selectedSizes.map((size: string) => ({
            size,
            color: data.color || 'Default',
            stock: data.stock || 0,
            isPreOrder: false
          }));
        }
        
        console.log('Transformed product:', transformedProduct);
        console.log('Variants count:', transformedProduct.variants.length);
        setProduct(transformedProduct);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    
    // Fetch new arrivals products
    const fetchNewArrivals = async () => {
      try {
        setLoadingNewArrivals(true);
        const response = await fetch('/api/products', {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('New arrivals loaded from API:', data.length);
        // Get the first 4 products for new arrivals
        setNewArrivals(data.slice(0, 4));
      } catch (err) {
        console.error('Error fetching new arrivals:', err);
      } finally {
        setLoadingNewArrivals(false);
      }
    };
    
    fetchNewArrivals();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      alert('Please select a size')
      return
    }
    
    // If we have variants, make sure color is selected too
    if (product.variants && product.variants.length > 0 && !selectedColor) {
      alert('Please select a color')
      return
    }

    // Check stock if variants are available
    if (product.variants && product.variants.length > 0 && selectedColor) {
      const variant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
      if (!variant || variant.stock <= 0) {
        alert('Selected variant is out of stock')
        return
      }
    }

    const cartItem: CartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      size: selectedSize,
      image: product.images[0],
      discount: product.discount,
      color: selectedColor || undefined
    };

    addToCart(cartItem);

    // Show animation
    setShowAddedAnimation(true)
    setTimeout(() => {
      setShowAddedAnimation(false)
    }, 2000)
  }

  const handleBuyNowClick = () => {
    if (!selectedSize) {
      setShowSizeMessage(true);
      setTimeout(() => setShowSizeMessage(false), 3000);
      return;
    }

    // If we have variants, make sure color is selected too
    if (product?.variants && product.variants.length > 0 && !selectedColor) {
      alert('Please select a color')
      return
    }

    // Check stock if variants are available
    if (product?.variants && product.variants.length > 0 && selectedColor) {
      const variant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
      if (!variant || variant.stock <= 0) {
        alert('Selected variant is out of stock')
        return
      }
    }

    if (!product) {
      console.error('Product not found');
      return;
    }

    // Add to cart first
    const cartItem: CartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      size: selectedSize,
      image: product.images[0],
      discount: product.discount,
      color: selectedColor || undefined
    };

    addToCart(cartItem);

    // Redirect to checkout
    router.push('/checkout');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);
    setOrderError('');

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      setOrderError('Please fill in all required customer information');
      setIsSubmitting(false);
      return;
    }

    const totalAmount = quantity * (product.discount 
      ? (product.price * (1 - product.discount/100))
      : product.price);

    const orderData = {
      customer: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address
      },
      products: [{
        productId: product._id,
        name: product.name,
        quantity: quantity,
        price: product.discount 
          ? (product.price * (1 - product.discount/100))
          : product.price,
        size: selectedSize,
        image: product.images[0]
      }],
      totalAmount: totalAmount,
      status: "pending",
      orderDate: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      if (data.success) {
        setShowOrderForm(false);
        setShowAddedAnimation(true);
        setTimeout(() => {
          setShowAddedAnimation(false);
          router.push('/cart');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setOrderError('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedSize) return;
    
    setIsPlacingOrder(true);
    setOrderError('');
    
    try {
      const orderData = {
        customer: customerInfo,
        products: [{
          productId: product?._id,
          name: product?.name,
          quantity: quantity,
          price: product?.price,
          size: selectedSize,
          image: product?.images[0]
        }],
        totalAmount: quantity * (product?.price || 0),
        status: "pending",
        orderDate: new Date().toISOString()
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      router.push('/cart');
      
    } catch (error) {
      console.error('Order placement error:', error);
      setOrderError('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleAddToCartClick = () => {
    if (!selectedSize) {
      setShowSizeMessage(true);
      setTimeout(() => setShowSizeMessage(false), 3000);
      return;
    }
    handleAddToCart();
  };

  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center flex-col">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Product Not Found</h1>
            <div className="text-red-600 mb-6 max-w-md mx-auto">
              {error && (
                <div className="bg-red-50 p-4 rounded mb-4">
                  <p>{error}</p>
                  <p className="text-sm mt-2">Product ID: {id}</p>
                  <p className="text-sm mt-1">If you're an admin, please check that this product exists in your database.</p>
                </div>
              )}
            </div>
            <Link href="/collection" className="text-black underline">
              Return to Collection
            </Link>
          </div>
        </div>
      </>
    );
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'SAGE COLLECTION', href: '/collection' },
    { label: product.name, href: pathname }
  ]

  return (
    <>
      <Nav />
      {/* Size Selection Message */}
      <div
        className={`fixed top-4 right-4 bg-black text-white px-6 py-3 transform transition-all duration-300 z-50 ${
          showSizeMessage
            ? 'translate-y-0 opacity-100'
            : 'translate-y-[-100%] opacity-0'
        }`}
      >
        Please select a size
      </div>

      {/* Added to Cart Animation */}
      <div
        className={`fixed top-4 right-4 bg-black text-white px-6 py-3 transform transition-all duration-300 z-50 ${
          showAddedAnimation
            ? 'translate-y-0 opacity-100'
            : 'translate-y-[-100%] opacity-0'
        }`}
      >
        Added to cart!
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md w-full" style={{ borderRadius: 0 }}>
            <h2 className="text-2xl font-light mb-6">Complete Your Order</h2>
            {orderError && (
              <div className="mb-4 p-3 bg-red-50 text-red-500 rounded">
                {orderError}
              </div>
            )}
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Address</label>
                <textarea
                  required
                  className="w-full border p-2 rounded"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 px-4 py-2 border border-black hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-900 disabled:bg-gray-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-white dark:bg-black pt-20 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Mobile: Images First */}
          <div className="w-full order-first lg:order-2 lg:w-1/3 flex flex-col items-center justify-center mb-8 lg:mb-0">
            <div className="w-full overflow-x-auto scrollable-x snap-x snap-mandatory">
              <div className="flex">
                {product.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 w-full snap-center"
                    style={{ minWidth: '100%' }}
                  >
                    <div className="relative w-full max-w-[400px] aspect-[3/4] mx-auto">
                      <Image
                        src={img}
                        alt={`${product.name} - View ${idx + 1}`}
                        fill
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Left: Info Card with Accordion */}
          <div className="w-full order-2 lg:order-1 lg:w-1/3 p-8 text-left flex flex-col items-center justify-center" style={{ minWidth: 320 }}>
            <div className="w-full">
              <div className="text-xs tracking-widest mb-2 text-gray-500 dark:text-gray-400 text-center">{product.name.toUpperCase()}</div>
              <div className="text-xl font-light mb-4 text-center text-black dark:text-white">{product.title || product.name}</div>
              
              {/* Accordion Sections */}
              <div className="space-y-1">
                {[
                  {
                    title: "DESCRIPTION",
                    content: product.description
                  },
                  {
                    title: "MATERIALS",
                    content: (
                      <ul className="text-sm text-gray-700 dark:text-gray-300">
                        {product.materials.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    )
                  },
                  {
                    title: "SIZE GUIDE",
                    content: (
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {product.sizeGuide.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            <br/>
                          </React.Fragment>
                        ))}
                      </div>
                    )
                  },
                  {
                    title: "PACKAGING",
                    content: <div className="text-sm text-gray-700 dark:text-gray-300">{product.packaging}</div>
                  },
                  {
                    title: "SHIPPING & RETURNS",
                    content: <div className="text-sm text-gray-700 dark:text-gray-300">{product.shippingReturns}</div>
                  }
                ].map((section, index) => (
                  <div
                    key={section.title}
                    className="border-b border-stone-200 dark:border-stone-700 last:border-b-0 relative isolate group/faq cursor-pointer"
                    onClick={() => setSelectedSection(selectedSection === index ? null : index)}
                  >
                    <div className={twMerge(
                      "flex items-center justify-between gap-4 py-4 transition-all group-hover/faq:px-4 text-black dark:text-white",
                      selectedSection === index && "px-4"
                    )}>
                      <div className="text-base font-medium">{section.title}</div>
                      <div className={twMerge(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full transition duration-300",
                        selectedSection === index ? "rotate-45" : ""
                      )}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      </div>
                    </div>
                    <AnimatePresence>
                      {selectedSection === index && (
                        <motion.div
                          className="overflow-hidden px-4"
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        >
                          <div className="pb-4 text-sm text-gray-600 dark:text-gray-300">
                            {section.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Size/Order Box */}
          <div className="w-full order-3 lg:order-3 lg:w-1/3 p-8 flex flex-col gap-6 items-center justify-center" style={{ minWidth: 320 }}>
            <div className="w-full flex flex-col items-center">
              <div className="text-xs font-semibold mb-2 text-center text-black dark:text-white">SIZE</div>
              <div className="flex flex-wrap gap-3 mb-4 justify-center">
                {product?.variants && product.variants.length > 0 ? (
                  // Get unique sizes
                  product.variants
                    .map(v => v.size)
                    .filter((size, index, self) => self.indexOf(size) === index)
                    .map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors
                        ${selectedSize === size 
                          ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                          : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                        }`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  ["S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors
                        ${selectedSize === size 
                          ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                          : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                        }`}
                    >
                      {size}
                    </button>
                  ))
                )}
              </div>
              
              {/* Display color options if variants exist */}
              {product?.variants && product.variants.length > 0 && selectedSize && (
                <>
                  <div className="text-xs font-semibold mb-2 text-center text-black dark:text-white">COLOR</div>
                  <div className="flex flex-wrap gap-3 mb-4 justify-center">
                    {product.variants
                      .filter(v => v.size === selectedSize)
                      .map(v => v.color)
                      .filter((color, index, self) => self.indexOf(color) === index)
                      .map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`flex items-center justify-center px-4 py-2 text-sm transition-colors
                          ${selectedColor === color 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                            : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {/* Stock display when size and color are selected */}
              {product?.variants && product.variants.length > 0 && selectedSize && selectedColor && (
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  {(() => {
                    const variant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
                    if (variant) {
                      return variant.stock > 0 
                        ? `In stock: ${variant.stock} units` 
                        : "Out of stock";
                    }
                    return "Select size and color";
                  })()}
                </div>
              )}
              
              {/* Price and Pre-order badge beside size */}
              <div className="flex items-center gap-4 mb-2 justify-center">
                <span className="text-lg font-medium text-black dark:text-white">L.E {product.price}</span>
                {product.variants && product.variants.length > 0 && selectedSize && selectedColor && (
                  (() => {
                    const variant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
                    return variant?.isPreOrder ? (
                      <span className="text-xs font-semibold text-black dark:text-white border border-black dark:border-white px-2 py-1">PRE-ORDER</span>
                    ) : null;
                  })()
                )}
              </div>
            </div>
            
            {/* Add to cart section */}
            <div className="flex flex-col gap-0 w-full border border-[#0F1824]">
              <button
                type="button"
                onClick={handleAddToCartClick}
                className="w-full py-4 text-sm font-medium transition-colors bg-[#0F1824] text-white active:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={Boolean(
                  product?.variants && 
                  product.variants.length > 0 && 
                  selectedSize && 
                  selectedColor && 
                  (product.variants.find(v => 
                    v.size === selectedSize && 
                    v.color === selectedColor
                  )?.stock || 0) <= 0
                )}
              >
                {
                  product?.variants && 
                  product.variants.length > 0 && 
                  selectedSize && 
                  selectedColor && 
                  (product.variants.find(v => 
                    v.size === selectedSize && 
                    v.color === selectedColor
                  )?.stock || 0) <= 0
                    ? "SOLD OUT" 
                    : "ADD TO CART"
                }
              </button>
              <button
                type="button"
                onClick={handleBuyNowClick}
                className="w-full py-4 text-sm font-medium transition-colors bg-white text-black active:bg-[#0F1824] active:text-white disabled:bg-gray-200 disabled:cursor-not-allowed"
                disabled={Boolean(
                  product?.variants && 
                  product.variants.length > 0 && 
                  selectedSize && 
                  selectedColor && 
                  (product.variants.find(v => 
                    v.size === selectedSize && 
                    v.color === selectedColor
                  )?.stock || 0) <= 0
                )}
              >
                BUY IT NOW
              </button>
            </div>
            
            {/* Order Status Message */}
            {orderStatus && (
              <div className={`text-center p-3 w-full ${
                orderStatus.includes('Success') 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
              }`}>
                {orderStatus}
              </div>
            )}

            <div className="text-xs text-gray-500 dark:hidden mt-2 text-center">Please select the size to see the colors</div>
          </div>
        </div>
      </main>

      {/* NEW ARRIVALS Section */}
      <div className="w-full max-w-7xl mx-auto mt-20 mb-16 px-4 bg-white dark:bg-black">
        <h2 className="text-3xl md:text-4xl font-light mb-12 text-center tracking-widest text-black dark:text-white">NEW ARRIVALS</h2>
        
        {loadingNewArrivals ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="flex overflow-x-auto scrollable-x gap-8 pb-8">
            {newArrivals.map((newProduct) => (
              <Link
                key={newProduct._id}
                href={`/product/${newProduct._id}`}
                className="flex-shrink-0 flex flex-col items-center min-w-[260px] max-w-[320px] group cursor-pointer"
              >
                <div className="relative w-full aspect-[3/4] mb-4">
                  <Image
                    src={(newProduct.images?.[0] || '/images/placeholder.jpg')}
                    alt={newProduct.name}
                    fill
                    className="object-cover object-center"
                    unoptimized={true}
                  />
                </div>
                <div className="w-full text-center">
                  <div className="text-xs tracking-widest mb-1 text-gray-600 dark:text-white group-hover:underline">
                    {(newProduct.name || newProduct.title || 'Product').toUpperCase()}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-black dark:text-white">
                    <span className="text-base">L.E {newProduct.price}</span>
                    {newProduct.discount && newProduct.discount > 0 && (
                      <span className="text-xs line-through text-gray-500 dark:text-gray-400">L.E {Math.round(newProduct.price / (1 - newProduct.discount / 100))}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* See all link */}
        <div className="w-full flex justify-center mt-8">
          <Link href="/collection" className="text-sm text-black dark:text-white border-b border-black dark:border-white pb-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            SEE ALL
          </Link>
        </div>
      </div>
      <NewFooter />
    </>
  )
}

export default ProductPage the second one:'use client' 

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Nav from '@/app/sections/nav'
import Footer from '@/app/sections/footer'
import { useCart } from '@/app/context/CartContext'
import { AnimatePresence, motion } from "framer-motion"
import { twMerge } from "tailwind-merge"
import { optimizeCloudinaryUrl, processImageUrl } from '@/app/utils/imageUtils';
import { initStockSync, forceRefreshStock, markProductAsRecentlyOrdered } from '@/app/utils/stockSync';
import axios from 'axios'
// For WebSocket connection
import { io } from 'socket.io-client';
import NewFooter from '@/app/sections/NewFooter'

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image: string;
  discount?: number;
  _stockInfo?: {
    originalStock: number;
    size: string;
    color: string;
  };
}

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface ColorVariant {
  color: string;
  hexCode?: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

interface Product {
  _id: string;
  name: string;
  title?: string;
  price: number;
  images: string[];
  description: string;
  Material: string[];
  sizes: SizeStock[];
  sizeVariants?: SizeVariant[];
  discount?: number;
  categories?: string[];
  materials?: string[];
  sizeGuide?: string;
  packaging?: string;
  shippingReturns?: string;
  variants?: Array<{
    size: string;
    color: string;
    stock: number;
    isPreOrder?: boolean;
  }>;
}

type Props = {
  params: {
    id: string
  }
}

const ProductPage = ({ params }: Props) => {
  const { id } = params
  const router = useRouter()
  const pathname = usePathname()
  const { addToCart } = useCart()
  
  // State
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [availableColors, setAvailableColors] = useState<ColorVariant[]>([])
  const [showAddedAnimation, setShowAddedAnimation] = useState(false)
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(false)
  const [newArrivals, setNewArrivals] = useState<any[]>([])
  const [orderStatus, setOrderStatus] = useState('')

  // Handler functions for the buttons
  const handleAddToCartClick = () => {
    // Call the existing handleAddToCart function
    handleAddToCart();
  }

  const handleBuyNowClick = () => {
    // Add to cart first
    handleAddToCart();
    // Then redirect to checkout
    router.push('/checkout');
  }
  
  // Function to get available stock for the current selected size and color
  const getAvailableStock = (): number => {
    // Default max stock if we can't determine actual stock
    const DEFAULT_MAX_STOCK = 10;
    
    // If no product or no size selected, return default
    if (!product || !selectedSize) {
      return DEFAULT_MAX_STOCK;
    }
    
    // If using size variants and color is selected
    if (product.sizeVariants && selectedSize && selectedColor) {
      // Find the selected size variant
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      if (sizeVariant && sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
        // Find the selected color variant
        const colorVariant = sizeVariant.colorVariants.find(cv => cv.color === selectedColor);
        if (colorVariant && typeof colorVariant.stock === 'number') {
          // Return the actual stock for this size/color combination
          return colorVariant.stock;
        }
      }
    }
    
    // If using size variants but no color selected
    if (product.sizeVariants && selectedSize) {
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      if (sizeVariant && sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants)) {
        // Calculate total stock across all colors for this size
        return sizeVariant.colorVariants.reduce((sum, cv) => sum + (cv.stock || 0), 0);
      }
    }
    
    // If using simple sizes
    if (product.sizes && selectedSize) {
      const sizeOption = product.sizes.find(s => s.size === selectedSize);
      if (sizeOption) {
        return sizeOption.stock;
      }
    }
    
    // Fallback to default max stock
    return DEFAULT_MAX_STOCK;
  };
  
  // Effect to update available colors when size changes
  useEffect(() => {
    if (product && product.sizeVariants && selectedSize) {
      console.log('Product sizeVariants:', product.sizeVariants);
      const sizeVariant = product.sizeVariants.find(sv => sv.size === selectedSize);
      console.log('Selected size variant:', sizeVariant);
      
      if (sizeVariant) {
        let colorVariantsToUse = [];
        
        // Case 1: Size variant has color variants array
        if (sizeVariant.colorVariants && Array.isArray(sizeVariant.colorVariants) && sizeVariant.colorVariants.length > 0) {
          // Process existing color variants
          colorVariantsToUse = sizeVariant.colorVariants.map(cv => {
            console.log('Processing existing color variant:', cv);
            return {
              ...cv,
              color: cv.color || 'Default',
              stock: Number(cv.stock) || 0,
              hexCode: cv.hexCode || '#000000'
            };
          });
        }
        // Case 2: Size variant has no color variants - create a default one
        else {
          // Create a default color variant with the size's stock
          // Use a type assertion to handle the potential missing stock property
          const defaultStock = typeof (sizeVariant as any).stock === 'number' ? (sizeVariant as any).stock : 0;
          colorVariantsToUse = [{
            color: 'Default',
            stock: defaultStock,
            hexCode: '#000000'
          }];
          console.log(`Created default color variant for size ${sizeVariant.size} with stock ${defaultStock}`);
        }
        
        console.log('Final color variants with stock:', colorVariantsToUse);
        setAvailableColors(colorVariantsToUse);
        
        // Auto-select first color if available
        if (colorVariantsToUse.length > 0 && !selectedColor) {
          setSelectedColor(colorVariantsToUse[0].color);
        }
      } else {
        // If size variant not found, set to empty array
        console.log('Size variant not found for selected size');
        setAvailableColors([]);
      }
    } else {
      console.log('No product, size variants, or selected size');
      setAvailableColors([]);
    }
  }, [product, selectedSize, selectedColor])
  
  // Effect to preserve selected size when product updates - ONLY runs on initial product load
  useEffect(() => {
    if (product && !selectedSize) { // Only run if no size is selected yet
      console.log('Initial product load, selecting first size');
      
      if (product.sizeVariants && Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) {
        console.log('Selecting first available size variant:', product.sizeVariants[0].size);
        setSelectedSize(product.sizeVariants[0].size);
      } else if (product.sizes && product.sizes.length > 0) {
        console.log('Selecting first available size from sizes array:', product.sizes[0].size);
        setSelectedSize(product.sizes[0].size);
      }
    }
    
    // Fetch new arrivals for the bottom section
    const fetchNewArrivals = async () => {
      try {
        setLoadingNewArrivals(true);
        
        // Add timestamp to prevent caching and exclude current product
        const timestamp = Date.now();
        const randomValue = Math.random().toString(36).substring(2, 10); // Add random value to prevent caching
        
        // Use the updated API endpoint with proper query parameters
        const response = await fetch(`/api/products?limit=6&featured=true&timestamp=${timestamp}&r=${randomValue}&exclude=${id}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          // Add a reasonable timeout
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle both response formats (array or { products: array })
          let productsArray = [];
          
          if (data && Array.isArray(data)) {
            // Direct array response
            console.log('Products API returned direct array');
            productsArray = data;
          } else if (data && Array.isArray(data.products)) {
            // Object with products array
            console.log('Products API returned object with products array');
            productsArray = data.products;
          } else {
            console.log('Unexpected products API response format:', data);
            setNewArrivals([]);
            return;
          }
          
          // Filter out the current product if it's still in the results
          // Also handle different ID formats
          const filteredProducts = productsArray.filter((prod: any) => {
            if (!prod) return false;
            
            // Check different ID formats
            const prodId = typeof prod._id === 'string' ? prod._id : 
                          (prod._id && prod._id.$oid) ? prod._id.$oid : 
                          prod.id || '';
                          
            return prodId !== id;
          });
          
          console.log(`Fetched ${filteredProducts.length} new arrivals products`);
          
          // Ensure products have valid IDs before setting state
          const processedProducts = filteredProducts.map((prod: any) => {
            if (!prod) return null;
            
            // Try to get the product ID from different possible locations
            const productId = typeof prod._id === 'string' ? prod._id : 
                             (prod._id && prod._id.$oid) ? prod._id.$oid : 
                             prod.id || '';
            
            // Add the extracted ID back to the product
            return {
              ...prod,
              _id: productId // Ensure _id is always a string
            };
          }).filter(Boolean); // Remove any null values
          
          setNewArrivals(processedProducts);
        } else {
          console.error(`Failed to fetch new arrivals: ${response.status}`);
          setNewArrivals([]);
        }
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
        setNewArrivals([]);
      } finally {
        setLoadingNewArrivals(false);
      }
    };
    
    fetchNewArrivals();
  }, [product, selectedSize]) // Only run on initial load or if selectedSize is cleared
  
  // Effect to adjust quantity if it exceeds available stock
  useEffect(() => {
    // Get current available stock
    const availableStock = getAvailableStock();
    
    // If quantity exceeds available stock, reduce it
    if (quantity > availableStock) {
      setQuantity(Math.max(1, availableStock));
    }
  }, [selectedSize, selectedColor, product]);

  // Helper function for aggressive stock refreshing after an order with multiple attempts
  const aggressiveStockRefresh = async (productId: string) => {
    console.log(`🔄 Starting aggressive stock refresh sequence for product ${productId}`);
    
    // Mark this product as recently ordered
    markProductAsRecentlyOrdered(productId);
    
    // Immediate refresh
    await refreshStockData(false, true);
    
    // Schedule additional refreshes with increasing delays
    setTimeout(async () => {
      console.log(`🔄 Second stock refresh attempt for product ${productId}`);
      await refreshStockData(false, true);
    }, 2000);
    
    setTimeout(async () => {
      console.log(`🔄 Third stock refresh attempt for product ${productId}`);
      await refreshStockData(false, true);
    }, 5000);
  };
  
  // Function to refresh stock data using the stockSync utility with retry logic and admin panel integration
  const refreshStockData = async (showMessage = false, afterOrder = false) => {
    // If this is an after-order refresh, log it for debugging
    if (afterOrder) {
      console.log(`🔥 Performing aggressive stock refresh after order for product ${product?._id}`);
    }
    if (product && product._id) {
      try {
        // Set refreshing state
        setRefreshing(true);
        setRefreshMessage('');
        
        console.log('Refreshing stock data for product:', product._id);
        
        // Implement retry logic for stock refresh
        let refreshSuccess = false;
        let refreshAttempts = 0;
        const MAX_REFRESH_ATTEMPTS = 3;
        let stockData = null;
        
        while (refreshAttempts < MAX_REFRESH_ATTEMPTS && !refreshSuccess) {
          try {
            console.log(`Attempting to refresh stock (attempt ${refreshAttempts + 1}/${MAX_REFRESH_ATTEMPTS})`);
            // Use the forceRefreshStock function from stockSync utility with afterOrder flag
            stockData = await forceRefreshStock(product._id, afterOrder);
            
            if (stockData && stockData.success) {
              refreshSuccess = true;
              console.log('Stock refresh successful:', stockData);
              break;
            } else {
              throw new Error(`Stock refresh failed: ${stockData?.message || 'Unknown error'}`);
            }
          } catch (refreshError) {
            refreshAttempts++;
            console.warn(`Stock refresh attempt ${refreshAttempts} failed:`, refreshError);
            
            if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
              // Wait before retrying (exponential backoff)
              const delay = Math.min(1000 * Math.pow(2, refreshAttempts - 1), 3000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // Now fetch the latest product data regardless of refresh success
        // This provides a fallback mechanism if the stock refresh fails
        try {
          // Add cache busting parameter and no-cache headers
          const timestamp = Date.now();
          const afterOrderParam = afterOrder ? '&afterOrder=true' : '';
          const response = await fetch(`/api/products/${product._id}?_t=${timestamp}${afterOrderParam}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Request-After-Order': afterOrder ? 'true' : 'false'
            }
          });
          
          // Check response headers to verify stock freshness
          const stockTimestamp = response.headers.get('X-Stock-Timestamp');
          if (stockTimestamp) {
            console.log('Stock last updated:', new Date(parseInt(stockTimestamp)));
          }
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.product) {
              // Save current size and color selection before processing new data
              const currentSize = selectedSize;
              const currentColor = selectedColor;
              
              // Process the updated product data
              processProductData(data.product);
              
              // Restore size selection if it still exists in the updated product
              if (currentSize) {
                const sizeExists = data.product.sizeVariants?.some((sv: any) => sv.size === currentSize);
                if (sizeExists) {
                  setSelectedSize(currentSize);
                  
                  // Try to restore color selection if the size still has this color
                  if (currentColor) {
                    const sizeVariant = data.product.sizeVariants?.find((sv: any) => sv.size === currentSize);
                    const colorExists = sizeVariant?.colorVariants?.some((cv: any) => cv.color === currentColor);
                    if (colorExists) {
                      setSelectedColor(currentColor);
                    }
                  }
                }
              }
              
              // Show appropriate success message
              if (showMessage) {
                setRefreshMessage(refreshSuccess 
                  ? 'Stock levels updated successfully!' 
                  : 'Stock levels refreshed from ADMIN.');
                // Clear message after 5 seconds
                setTimeout(() => setRefreshMessage(''), 5000);
              }
            } else {
              throw new Error('Invalid product data received');
            }
          } else {
            throw new Error(`Error fetching product: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('Error fetching updated product data:', fetchError);
          
          // Even if we can't fetch new data, we can still update the product with the stock data
          if (refreshSuccess && stockData && stockData.sizeVariants) {
            setProduct(prevProduct => {
              if (!prevProduct) return prevProduct;
              
              // Create a deep copy of the product
              const updatedProduct = {...prevProduct};
              
              // Update size variants with new stock data
              updatedProduct.sizeVariants = stockData.sizeVariants;
              
              return updatedProduct;
            });
            
            if (showMessage) {
              setRefreshMessage('Stock updated successfully!');
              setTimeout(() => setRefreshMessage(''), 5000);
            }
          } else if (showMessage) {
            setRefreshMessage('Could not update stock levels. Please try again later.');
            setTimeout(() => setRefreshMessage(''), 5000);
          }
        }
      } catch (error) {
        console.error('Unexpected error refreshing stock:', error);
        if (showMessage) {
          setRefreshMessage('Error updating stock. Please try again.');
          setTimeout(() => setRefreshMessage(''), 5000);
        }
      } finally {
        setRefreshing(false);
      }
    }
  };
  
  // Setup WebSocket connection for real-time stock updates
  useEffect(() => {
    if (product && product._id) {
      console.log('Setting up WebSocket connection for product:', product._id);
      
      try {
        // Connect to the WebSocket server with enhanced error handling
        const socket = io('https://eleveadmin.netlify.app', {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          extraHeaders: {
            'Origin': 'https://elevee.netlify.app'
          }
        });
        
        // Log connection events
        socket.on('connect', () => {
          console.log('WebSocket connected successfully with ID:', socket.id);
        });
        
        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          // Fall back to polling for stock updates
          console.log('Falling back to manual polling for stock updates');
        });
        
        // Listen for stock updates
        socket.on('stock:reduced', (data) => {
          console.log('Stock update received via WebSocket:', data);
          
          // If this update is for the current product
          if (data.productId === product._id) {
            console.log('Received real-time stock update via WebSocket for current product:', data);
            // Force refresh stock data when we receive a WebSocket notification
            refreshStockData(false, true);
            
            // Update the UI with new stock information if needed
            if (data.size && data.color && typeof data.stock !== 'undefined') {
              // Update specific size/color stock
              updateStockDisplay(data.size, data.color, data.stock);
            }
          }
        });
        
        // Test the connection by sending a ping
        setTimeout(() => {
          if (socket.connected) {
            console.log('WebSocket still connected after timeout');
          } else {
            console.log('WebSocket not connected after timeout, falling back to polling');
          }
        }, 5000);
        
        return () => {
          // Clean up socket connection
          console.log('Cleaning up WebSocket connection');
          socket.off('stock:reduced');
          socket.off('connect_error');
          socket.off('connect');
          socket.disconnect();
        };
      } catch (socketError) {
        console.error('Error setting up WebSocket:', socketError);
      }
    }
  }, [product?._id]);
  
  // Function to handle actual order placement and refresh the page
  const handleOrderPlacement = async () => {
    if (!product) return;
    
    console.log('Order placement detected, processing stock reduction');
    
    try {
      // Get any pending stock reductions from localStorage
      const pendingItemsJson = localStorage.getItem('pendingStockReduction');
      const pendingItems = pendingItemsJson ? JSON.parse(pendingItemsJson) : [];
      
      // Use only the pending items from localStorage
      // This is more reliable than trying to access current component state
      const allItems = [...pendingItems];
      
      if (allItems.length > 0) {
        console.log('Processing stock reduction for order placement:', allItems);
        
        // Use our own backend as a proxy to avoid CORS issues
        const orderId = `order_${Date.now()}`;
        
        // Make multiple attempts to ensure stock reduction succeeds
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;
        
        while (attempts < maxAttempts && !success) {
          attempts++;
          console.log(`Stock reduction attempt ${attempts} of ${maxAttempts}`);
          
          try {
            const response = await fetch(`/api/stock/reduce?afterOrder=true&orderId=${orderId}`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              body: JSON.stringify({ 
                items: allItems.map(item => ({
                  productId: item.productId,
                  size: item.size,
                  color: item.color || 'Default',
                  quantity: item.quantity || 1
                }))
              })
            });
            
            console.log('Order placement stock reduction response status:', response.status);
            
            if (response.ok) {
              const result = await response.json();
              console.log('Order placement stock reduction result:', result);
              success = true;
            } else {
              console.error(`Stock reduction attempt ${attempts} failed with status ${response.status}`);
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (attemptError) {
            console.error(`Error in stock reduction attempt ${attempts}:`, attemptError);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Clear pending stock reductions
        localStorage.removeItem('pendingStockReduction');
        
        // NOW is the appropriate time to force a page refresh
        console.log('Order placed successfully, forcing page refresh to get fresh stock data');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error processing order placement:', error);
    }
  };
  
  // Detect order placement from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderComplete = urlParams.get('orderComplete') === 'true';
    
    if (orderComplete && product) {
      console.log('Order completion detected from URL parameters');
      handleOrderPlacement();
      
      // Remove the query parameter
      window.history.replaceState({}, document.title, `/product/${product._id}`);
    }
  }, [product]);
  
  // Manual refresh function for stock as recommended by the admin developer
  const manualRefreshStock = async (productId: string) => {
    try {
      console.log(`🔄 Manual refresh for product ${productId}`);
      setRefreshing(true);
      setRefreshMessage('Refreshing stock data...');
      
      // Use our own backend as a proxy to avoid CORS issues
      const timestamp = Date.now();
      const randomValue = Math.random().toString(36).substring(2, 10);
      const response = await fetch(`/api/stock/sync?productId=${productId}&timestamp=${timestamp}&r=${randomValue}&forceRefresh=true`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fresh stock data received:', data);
        
        // Update the product with the fresh stock data
        if (product && data) {
          const updatedProduct = { ...product };
          
          // Update the stock information in the product
          if (data.sizes) {
            updatedProduct.sizes = data.sizes;
          }
          
          if (data.sizeVariants) {
            updatedProduct.sizeVariants = data.sizeVariants;
          }
          
          // Update the product state
          setProduct(updatedProduct);
          setRefreshMessage('Stock data updated successfully!');
          setTimeout(() => setRefreshMessage(''), 3000);
        }
      } else {
        console.error('Error refreshing stock:', await response.text());
        setRefreshMessage('Error updating stock. Please try again.');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error in manual refresh:', error);
      setRefreshMessage('Error updating stock. Please try again.');
      setTimeout(() => setRefreshMessage(''), 3000);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Function to call the admin panel's stock reduction API as specified by the admin developer
  const callAdminStockReductionApi = async (orderId: string, items: any[]) => {
    try {
      console.log(`Calling admin stock reduction API for order ${orderId}`);
      
      // Use our own backend as a proxy to avoid CORS issues
      const response = await fetch(`/api/stock/reduce?afterOrder=true&orderId=${orderId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ items })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Admin stock reduction result:', result);
        return result;
      } else {
        console.error('Admin stock reduction API returned error:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error calling admin stock reduction API:', error);
      return null;
    }
  };
  
  // Helper function to update stock display for specific size/color
  const updateStockDisplay = (size: string, color: string, stock: number) => {
    console.log(`Updating display for size: ${size}, color: ${color}, stock: ${stock}`);
    // Implementation would depend on how stock is stored in state
    if (product && product.sizeVariants) {
      // Create a deep copy of the current product
      const updatedProduct = JSON.parse(JSON.stringify(product));
      
      // Find and update the specific size/color combination
      for (const sizeVariant of updatedProduct.sizeVariants) {
        if (sizeVariant.size === size && sizeVariant.colorVariants) {
          for (const colorVariant of sizeVariant.colorVariants) {
            if (colorVariant.color === color) {
              colorVariant.stock = stock;
              console.log(`Updated stock for ${size}/${color} to ${stock}`);
              break;
            }
          }
        }
      }
      
      // Update the product state with the new stock information
      setProduct(updatedProduct);
      
      // If this is the currently selected size/color, update the UI immediately
      if (selectedSize === size && selectedColor === color) {
        // Force a re-render of the stock display
        setSelectedSize(size);
        setSelectedColor(color);
      }
    }
  };
  
  // Check for pending stock reductions on page load
  useEffect(() => {
    // Check if we're coming back from a pending reduction redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hasPendingReduction = urlParams.get('pendingReduction') === 'true';
    
    if (hasPendingReduction && product) {
      console.log('Found pending stock reduction, processing now...');
      
      try {
        // Get the pending items from local storage
        const pendingItemsJson = localStorage.getItem('pendingStockReduction');
        
        if (pendingItemsJson) {
          const pendingItems = JSON.parse(pendingItemsJson);
          
          if (pendingItems.length > 0) {
            console.log('Processing pending stock reduction for items:', pendingItems);
            
            // Use our own backend as a proxy to avoid CORS issues
            fetch('/api/stock/reduce?afterOrder=true', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              body: JSON.stringify({ items: pendingItems })
            })
            .then(response => {
              console.log('Pending reduction response status:', response.status);
              return response.json();
            })
            .then(data => {
              console.log('Pending stock reduction processed successfully:', data);
              // Clear the pending items from local storage
              localStorage.removeItem('pendingStockReduction');
              // Refresh the page without the query parameter
              window.history.replaceState({}, document.title, `/product/${product._id}`);
              // Force refresh stock data
              refreshStockData(true, true);
            })
            .catch(error => {
              console.error('Error processing pending stock reduction:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error handling pending stock reduction:', error);
      }
    }
  }, [product]);
  
  // Initialize real-time stock synchronization
  useEffect(() => {
    if (product && product._id) {
      console.log('Initializing real-time stock sync for product:', product._id);
      
      // Initialize stock synchronization
      const cleanup = initStockSync(product._id, (stockData) => {
        console.log('Real-time stock update received:', stockData);
        
        // Save current selections before updating
        const currentSize = selectedSize;
        const currentColor = selectedColor;
        
        // Update the product with new stock information
        setProduct(prevProduct => {
          if (!prevProduct) return prevProduct;
          
          // Create a deep copy of the product
          const updatedProduct = {...prevProduct};
          
          // Update size variants with new stock data
          if (stockData.sizeVariants && Array.isArray(stockData.sizeVariants) && stockData.sizeVariants.length > 0) {
            console.log(`Updating product with ${stockData.sizeVariants.length} size variants`);
            updatedProduct.sizeVariants = stockData.sizeVariants;
            
            // Also update the simple sizes array for compatibility
            updatedProduct.sizes = stockData.sizeVariants.map((sv: any) => {
              // Calculate total stock across all colors for this size
              const totalStock = Array.isArray(sv.colorVariants) 
                ? sv.colorVariants.reduce((sum: number, cv: any) => sum + (cv.stock || 0), 0)
                : sv.stock || 0;
                
              return {
                size: sv.size,
                stock: totalStock,
                isPreOrder: totalStock <= 0 // Mark as pre-order if no stock
              };
            });
          }
          
          return updatedProduct;
        });
        
        // IMPORTANT: Do NOT reset the user's size selection during stock updates
        // We'll only update the color selection if needed, but keep the user's size choice
        if (currentSize && currentColor && product?.sizeVariants) {
          const sizeVariant = product.sizeVariants.find(sv => sv.size === currentSize);
          if (sizeVariant && sizeVariant.colorVariants) {
            const colorStillExists = sizeVariant.colorVariants.some(cv => cv.color === currentColor);
            if (!colorStillExists && sizeVariant.colorVariants.length > 0) {
              // Only update color if the current one no longer exists
              setSelectedColor(sizeVariant.colorVariants[0].color);
            }
          }
        }
      });
      
      // Also handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refreshStockData(false); // Refresh without showing message
        }
      };
      
      // Add event listener for page visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        // Clean up stock sync and event listener
        cleanup();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [product?._id]); // Only re-initialize when product ID changes

  // Helper function to process product data
  const processProductData = (data: any) => {
    try {
      console.log('Processing product data:', data);
      
      // Process images safely
      const productImages = []
      try {
        if (Array.isArray(data.selectedImages) && data.selectedImages.length > 0) {
          productImages.push(...data.selectedImages.map((img: string) => processImageUrl(img)))
        } else if (Array.isArray(data.images) && data.images.length > 0) {
          productImages.push(...data.images.map((img: string) => processImageUrl(img)))
        } else if (typeof data.image === 'string') {
          productImages.push(processImageUrl(data.image))
        }
      } catch (imgErr) {
        console.error('Error processing images:', imgErr)
      }
      
      // If no images were found, add a default image
      if (productImages.length === 0) {
        productImages.push('/images/try-image.jpg')
      }
      
      // Process sizes and size variants
      let productSizes = []
      let productSizeVariants = undefined
      
      try {
        // Check if we have sizeVariants in the data (admin panel format)
        if (data.sizeVariants && Array.isArray(data.sizeVariants) && data.sizeVariants.length > 0) {
          console.log('Found size variants in data:', data.sizeVariants);
          // Process size variants to ensure stock information is properly handled
          productSizeVariants = data.sizeVariants.map((sv: any) => {
            // Ensure each color variant has valid stock information
            let processedColorVariants = [];
            
            // Case 1: Size variant has color variants array
            if (Array.isArray(sv.colorVariants) && sv.colorVariants.length > 0) {
              processedColorVariants = sv.colorVariants.map((cv: any) => ({
                ...cv,
                color: cv.color || 'Default',
                stock: typeof cv.stock === 'number' ? cv.stock : 0,
                hexCode: cv.hexCode || '#000000'
              }));
            }
            // Case 2: Size variant has no color variants - create a default one
            else {
              // Create a default color variant with the size's stock
              processedColorVariants = [{
                color: 'Default',
                stock: typeof sv.stock === 'number' ? sv.stock : 0,
                hexCode: '#000000'
              }];
              console.log(`Created default color variant for size ${sv.size} with stock ${sv.stock}`);
            }
              
            return {
              ...sv,
              size: sv.size || 'One Size',
              colorVariants: processedColorVariants
            };
          });
          
          console.log('Processed size variants with stock information:', productSizeVariants);
          
          // Also create simple sizes array for compatibility
          productSizes = data.sizeVariants.map((sv: any) => {
            // Calculate total stock across all colors for this size
            const totalStock = Array.isArray(sv.colorVariants) 
              ? sv.colorVariants.reduce((sum: number, cv: any) => sum + (cv.stock || 0), 0)
              : 0;
              
            return {
              size: sv.size,
              stock: totalStock,
              isPreOrder: totalStock <= 0 // Mark as pre-order if no stock
            };
          });
        }
        // If no size variants but we have selectedSizes
        else if (Array.isArray(data.selectedSizes) && data.selectedSizes.length > 0) {
          productSizes = data.selectedSizes.map((size: string) => ({
            size,
            stock: 10, // Default stock value
            isPreOrder: false
          }));
        } 
        // If we have a sizes array
        else if (Array.isArray(data.sizes) && data.sizes.length > 0) {
          productSizes = data.sizes.map((sizeStock: any) => ({
            size: sizeStock.size || 'One Size',
            stock: typeof sizeStock.stock === 'number' ? sizeStock.stock : 10,
            isPreOrder: Boolean(sizeStock.isPreOrder)
          }));
        } 
        // Default fallback
        else {
          productSizes = [{ size: 'One Size', stock: 10, isPreOrder: false }];
        }
      } catch (sizeErr) {
        console.error('Error processing sizes:', sizeErr);
        productSizes = [{ size: 'One Size', stock: 10, isPreOrder: false }];
      }

      // Create the transformed product
      const transformedProduct: Product = {
        _id: data._id || data.id || id, // Support both _id and id fields, fallback to URL id
        name: data.title || data.name || 'Untitled Product',
        price: typeof data.price === 'number' ? data.price : 0,
        images: productImages,
        description: data.description || '',
        Material: Array.isArray(data.material) ? data.material : ['French linen'],
        sizes: productSizes,
        sizeVariants: productSizeVariants,
        discount: typeof data.discount === 'number' ? data.discount : 0,
        categories: Array.isArray(data.categories) ? data.categories : []
      }

      console.log('Transformed product:', transformedProduct)
      setProduct(transformedProduct)
      
      // If there's only one size, select it automatically
      if (productSizes.length > 0) {
        setSelectedSize(productSizes[0].size)
      }
    } catch (processError) {
      console.error('Error processing product data:', processError)
      throw new Error('Failed to process product data')
    }
  }

  // Fetch product data with retry logic and better admin panel integration
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Reset selected size and color when product changes
        setSelectedSize('')
        setSelectedColor('')
        


        // Check if this product needs to be forcefully refreshed after an order
        if (typeof window !== 'undefined') {
          const productsToUpdateJson = sessionStorage.getItem('productsToUpdate');
          if (productsToUpdateJson) {
            try {
              const productsToUpdate = JSON.parse(productsToUpdateJson);
              // Check if the current product is in the list of products to update
              if (productsToUpdate?.ids?.includes(id)) {
                console.log(`Product ${id} needs a refresh after recent order`);
                setRefreshMessage('Updating product information...');
                // Force a refresh of stock data right now
                setTimeout(() => {
                  console.log('Forcing stock refresh after order completion');
                  refreshStockData(true, true); // Force refresh with visual feedback
                }, 500);
                // Clear the update flag
                sessionStorage.removeItem('productsToUpdate');
              }
            } catch (parseError) {
              console.error('Error parsing products to update:', parseError);
            }
          }
        }
        
        console.log('Fetching product with ID:', id)
        
        // Implement retry logic for product fetching
        let fetchAttempts = 0;
        const MAX_FETCH_ATTEMPTS = 3;
        let productData = null;
        let fetchError = null;
        
        // Try to fetch from our API with retries
        while (fetchAttempts < MAX_FETCH_ATTEMPTS && !productData) {
          try {
            console.log(`Fetching product data (attempt ${fetchAttempts + 1}/${MAX_FETCH_ATTEMPTS})`);
            
            // Add cache busting parameter and no-cache headers
            const response = await fetch(`/api/products/${id}?_t=${Date.now()}`, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            });
            
            if (!response.ok) {
              throw new Error(`API returned status ${response.status}`);
            }

            const data = await response.json();
            console.log('Received product data:', JSON.stringify(data, null, 2));
            
            // Log specific stock information for debugging
            if (data && (data.product || data)) {
              const productInfo = data.product || data;
              console.log('Product size variants:', JSON.stringify(productInfo.sizeVariants, null, 2));
              
              // Check if size variants have color variants with stock
              if (productInfo.sizeVariants && Array.isArray(productInfo.sizeVariants)) {
                productInfo.sizeVariants.forEach((sv: any, i: number) => {
                  console.log(`Size variant ${i} (${sv.size}):`, sv);
                  if (sv.colorVariants && Array.isArray(sv.colorVariants)) {
                    sv.colorVariants.forEach((cv: any, j: number) => {
                      console.log(`  Color variant ${j} (${cv.color}):`, cv);
                      console.log(`  Stock value: ${cv.stock} (type: ${typeof cv.stock})`);
                    });
                  }
                });
              }
              
              productData = productInfo;
              break; // Success, exit retry loop
            } else {
              throw new Error('Invalid product data received');
            }
          } catch (error) {
            fetchError = error;
            fetchAttempts++;
            console.warn(`Fetch attempt ${fetchAttempts} failed:`, error);
            
            if (fetchAttempts < MAX_FETCH_ATTEMPTS) {
              // Wait before retrying (exponential backoff)
              const delay = Math.min(1000 * Math.pow(2, fetchAttempts - 1), 5000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        if (productData) {
          // Process product data
          processProductData(productData);
          console.log('Successfully processed product data');
        } else {
          console.error('All fetch attempts failed:', fetchError);
          
          // If we're here, the API fetch failed, try local data
          console.log('Falling back to local data');
          
          // Create a placeholder product
          const placeholderProduct: Product = {
            _id: id,
            name: 'Product ' + id,
            price: 0,
            images: ['/images/model-image.jpg'],
            description: 'Product description not available.',
            Material: ['Unknown'],
            sizes: [{ size: 'One Size', stock: 10, isPreOrder: false }]
          }
          
          setProduct(placeholderProduct)
          setSelectedSize(placeholderProduct.sizes[0].size)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    // Call the fetchProduct function

    fetchProduct()
  }, [id])

  // Add to cart function with stock validation - NEVER reduces stock (only done after checkout)
  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    // If product has sizeVariants and colors are available, require color selection
    if (product.sizeVariants && availableColors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }
    
    // Get current available stock
    const availableStock = getAvailableStock();
    
    // Validate stock one more time before adding to cart
    if (quantity > availableStock) {
      // Adjust quantity to match available stock
      setQuantity(availableStock);
      
      if (availableStock <= 0) {
        alert('Sorry, this item is out of stock.');
        return;
      }
      
      alert(`Only ${availableStock} items available. We've adjusted your quantity.`);
    }
    
    // Create cart item
    const cartItem: CartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: Math.min(quantity, availableStock), // Ensure we don't exceed available stock
      size: selectedSize,
      color: selectedColor || undefined,
      image: product.images[0],
      discount: product.discount,
      _stockInfo: {
        originalStock: availableStock,
        size: selectedSize,
        color: selectedColor || ''
      }
    };
    
    try {
      // Try to validate stock with the server before adding to cart
      const response = await fetch('/api/stock/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            productId: product._id,
            size: selectedSize,
            color: selectedColor || undefined,
            quantity: Math.min(quantity, availableStock)
          }]
        })
      });
      
      const result = await response.json();
      
      if (!result.valid) {
        // If server says stock is not valid, refresh stock and show error
        refreshStockData(false);
        alert(`Stock issue: ${result.message}. The page will refresh with updated stock information.`);
        return;
      }
      
      // Stock is valid, add to cart
      addToCart(cartItem);
      
      // Show added animation
      setShowAddedAnimation(true);
      setTimeout(() => setShowAddedAnimation(false), 2000);
      
      // Mark this product as recently ordered for better real-time updates
      markProductAsRecentlyOrdered(product._id);
      
      // Log successful cart addition
      console.log('Item added to cart successfully - NO STOCK REDUCTION until checkout');
      
      // Refresh stock data in background without showing message to user
      refreshStockData(false, false);
      
    } catch (error) {
      console.error('Error validating stock:', error);
      
      // If server validation fails, still add to cart
      addToCart(cartItem);
      setShowAddedAnimation(true);
      setTimeout(() => setShowAddedAnimation(false), 2000);
      
      // Mark this product as recently ordered
      if (product) {
        markProductAsRecentlyOrdered(product._id);
      }
      
      // Refresh stock data in background
      refreshStockData(false, false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
        <NewFooter />
      </>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <>
        <Nav />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-xl">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/collection" className="text-black underline">
              Return to Collection
            </Link>
          </div>
        </div>
        <NewFooter />
      </>
    )
  }

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Collection', href: '/collection' },
    { label: product.name, href: pathname }
  ]

  // Check if product is sold out
  const isSoldOut: boolean = product.sizes && Array.isArray(product.sizes) 
    ? product.sizes.every(size => 
        (typeof size.stock === 'number' && size.stock <= 0) || 
        size.isPreOrder === true
      )
    : false

  // Calculate price with discount
  const finalPrice = product.discount 
    ? product.price - (product.price * product.discount / 100) 
    : product.price;

  return (
    <>
      <Nav />
      
      {/* Added to Cart Animation */}
      <AnimatePresence>
        {showAddedAnimation && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg z-50"
          >
            Added to cart!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-white dark:bg-black pt-20 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Mobile: Images First */}
          <div className="w-full order-first lg:order-2 lg:w-1/3 flex flex-col items-center justify-center mb-8 lg:mb-0">
            <div className="w-full overflow-x-auto scrollable-x snap-x snap-mandatory">
              <div className="flex">
                {product.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 w-full snap-center"
                    style={{ minWidth: '100%' }}
                  >
                    <div className="relative w-full max-w-[400px] aspect-[3/4] mx-auto">
                      {/* SOLD OUT Badge */}
                      {isSoldOut && idx === 0 && (
                        <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
                          SOLD OUT
                        </div>
                      )}
                      <Image
                        src={optimizeCloudinaryUrl(img, { width: 800 })}
                        alt={`${product.name} - View ${idx + 1}`}
                        fill
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

            {/* Left: Info Card with Accordion */}
            <div className="w-full order-2 lg:order-1 lg:w-1/3 p-8 text-left flex flex-col items-center justify-center" style={{ minWidth: 320 }}>
              <div className="w-full">
                <div className="text-xs tracking-widest mb-2 text-gray-500 dark:text-gray-400 text-center">{product.name.toUpperCase()}</div>
                <div className="text-xl font-light mb-4 text-center text-black dark:text-white">{product.title || product.name}</div>
                
                {/* Stock refresh message */}
                {refreshMessage && (
                  <div className="bg-green-50 text-green-700 p-2 mb-4 text-sm rounded text-center">
                    {refreshMessage}
                  </div>
                )}
                
                {/* Accordion Sections */}
                <div className="space-y-1">
                  {[
                    {
                      title: "DESCRIPTION",
                      content: product.description
                    },
                    {
                      title: "MATERIALS",
                      content: (
                        <ul className="text-sm text-gray-700 dark:text-gray-300">
                          {product.Material ? product.Material.map((m, i) => <li key={i}>{m}</li>) : <li>French linen</li>}
                        </ul>
                      )
                    },
                    {
                      title: "SIZE GUIDE",
                      content: (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <p>XS fits from 45 to 50 kgs</p>
                          <p>Small fits from 50 to 58 kgs</p>
                          <p>Medium from 59 to 70 kgs</p>
                          <p>Large from 71 to 80 kgs</p>
                        </div>
                      )
                    },
                    {
                      title: "PACKAGING",
                      content: <div className="text-sm text-gray-700 dark:text-gray-300">All items are carefully packaged to ensure they arrive in perfect condition.</div>
                    },
                    {
                      title: "SHIPPING & RETURNS",
                      content: (
                        <ul className="text-sm list-disc pl-4 space-y-2 text-gray-700 dark:text-gray-300">
                          <li>Shipping in 3-7 days</li>
                          <li><strong>On-the-Spot Trying:</strong> Customers have the ability to try on the item while the courier is present at the time of delivery.</li>
                          <li><strong>Immediate Return Requirement:</strong> If the customer is not satisfied, they must return the item immediately to the courier. Once the courier leaves, the item is considered accepted, and no returns or refunds will be processed.</li>
                          <li><strong>Condition of Return:</strong> The item must be undamaged, and in its original packaging for a successful return.</li>
                          <li><strong>No Returns After Courier Departure:</strong> After the courier has left, all sales are final, and no returns, exchanges, or refunds will be accepted.</li>
                        </ul>
                      )
                    }
                  ].map((section, index) => (
                    <div
                      key={section.title}
                      className="border-b border-stone-200 dark:border-stone-700 last:border-b-0 relative isolate group/faq cursor-pointer"
                      onClick={() => setSelectedSection(selectedSection === index ? null : index)}
                    >
                      <div className={twMerge(
                        "flex items-center justify-between gap-4 py-4 transition-all group-hover/faq:px-4 text-black dark:text-white",
                        selectedSection === index && "px-4"
                      )}>
                        <div className="text-base font-medium">{section.title}</div>
                        <div className={twMerge(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full transition duration-300",
                          selectedSection === index ? "rotate-45" : ""
                        )}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        </div>
                      </div>
                      <AnimatePresence>
                        {selectedSection === index && (
                          <motion.div
                            className="overflow-hidden px-4"
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                          >
                            <div className="pb-4 text-sm text-gray-600 dark:text-gray-300">
                              {section.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Size/Order Box */}
            <div className="w-full order-3 lg:order-3 lg:w-1/3 p-8 flex flex-col gap-6 items-center justify-center" style={{ minWidth: 320 }}>
              <div className="w-full flex flex-col items-center">
                <div className="text-xs font-semibold mb-2 text-center text-black dark:text-white">SIZE</div>
                <div className="flex flex-wrap gap-3 mb-4 justify-center">
                  {(product.sizeVariants && Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) ? (
                    product.sizeVariants.map((sizeVariant) => {
                      // Calculate total stock for this size
                      const totalStock = Array.isArray(sizeVariant.colorVariants) 
                        ? sizeVariant.colorVariants.reduce((sum, cv) => sum + (cv.stock || 0), 0)
                        : 0;
                        
                      return (
                        <button
                          key={sizeVariant.size}
                          type="button"
                          onClick={() => setSelectedSize(sizeVariant.size)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors
                            ${selectedSize === sizeVariant.size 
                              ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                              : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                            }`}
                        >
                          {sizeVariant.size}
                          {totalStock > 0 && totalStock <= 5 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                              {totalStock}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    // Only use sizes from the API, no fallback
                    (product?.sizes && product.sizes.length > 0 ? product.sizes : []).map((sizeOption) => (
                      <button
                        key={sizeOption.size}
                        type="button"
                        onClick={() => setSelectedSize(sizeOption.size)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm transition-colors
                          ${selectedSize === sizeOption.size 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                            : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                          } ${sizeOption.stock <= 0 && !sizeOption.isPreOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={sizeOption.stock <= 0 && !sizeOption.isPreOrder}
                      >
                        {sizeOption.size}
                        {sizeOption.stock > 0 && sizeOption.stock <= 5 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                            {sizeOption.stock}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Display color options if variants exist */}
                {product.sizeVariants && selectedSize && availableColors.length > 0 && (
                  <>
                    <div className="text-xs font-semibold mb-2 text-center text-black dark:text-white">COLOR</div>
                    <div className="flex flex-wrap gap-3 mb-4 justify-center">
                      {availableColors.map((colorVariant) => (
                        <button
                          key={colorVariant.color}
                          onClick={() => setSelectedColor(colorVariant.color)}
                          disabled={colorVariant.stock === 0}
                          className={`relative flex items-center justify-center px-4 py-2 text-sm transition-colors
                            ${selectedColor === colorVariant.color 
                              ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' 
                              : 'bg-transparent text-black dark:text-white border border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white'
                            } ${colorVariant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-center w-full">
                            <span className="mr-1">{colorVariant.color}</span>
                            {colorVariant.stock > 0 && colorVariant.stock <= 15 && (
                              <span className="text-red-500 font-medium whitespace-nowrap">
                                ({colorVariant.stock} left)
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Stock display when size and color are selected */}
                {product.sizeVariants && selectedSize && selectedColor && (
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                    {(() => {
                      const variant = availableColors.find(cv => cv.color === selectedColor);
                      if (variant) {
                        return variant.stock > 0 
                          ? `In stock: ${variant.stock} units` 
                          : "Out of stock";
                      }
                      return "Select size and color";
                    })()}
                  </div>
                )}
                
                {/* Quantity Selector */}
                {selectedSize && selectedColor && (availableColors.find(cv => cv.color === selectedColor)?.stock ?? 0) > 0 && (
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center border border-gray-300">
                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 text-lg border-r border-gray-300 hover:bg-gray-100"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-1">{quantity}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const maxStock = availableColors.find(cv => cv.color === selectedColor)?.stock ?? 0;
                          setQuantity(Math.min(maxStock, quantity + 1));
                        }}
                        className="px-3 py-1 text-lg border-l border-gray-300 hover:bg-gray-100"
                        disabled={quantity >= (availableColors.find(cv => cv.color === selectedColor)?.stock ?? 0)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Price and Pre-order badge beside size */}
                <div className="flex items-center gap-4 mb-4 justify-center">
                  <span className="text-lg font-medium text-black dark:text-white">
                    L.E {product.discount ? finalPrice.toFixed(2) : product.price.toFixed(2)}
                  </span>
                  {product.discount && (
                    <span className="text-sm line-through text-gray-500 dark:text-gray-400">
                      L.E {product.price.toFixed(2)}
                    </span>
                  )}
                  {/* Add pre-order badge if applicable */}
                  {selectedSize && selectedColor && (availableColors.find(cv => cv.color === selectedColor)?.stock ?? 0) <= 0 && (
                    <span className="text-xs font-semibold text-black dark:text-white border border-black dark:border-white px-2 py-1">
                      PRE-ORDER
                    </span>
                  )}
                </div>
            
                {/* Add to cart section */}
                <div className="flex flex-col gap-0 w-full border border-[#0F1824] mb-4">
                  <button
                    type="button"
                    onClick={handleAddToCartClick}
                    className="w-full py-4 text-sm font-medium transition-colors bg-[#0F1824] text-white active:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!selectedSize || (selectedColor !== '' && (availableColors.find(cv => cv.color === selectedColor)?.stock ?? 0) <= 0)}
                  >
                    {(selectedColor && (availableColors.find(cv => cv.color === selectedColor)?.stock ?? 0) <= 0)
                      ? "SOLD OUT" 
                      : "ADD TO CART"}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    className="w-full py-4 text-sm font-medium transition-colors bg-white text-black active:bg-[#0F1824] active:text-white disabled:bg-gray-200 disabled:cursor-not-allowed"
                    disabled={!selectedSize || (selectedColor !== '' && (availableColors.find(cv => cv.color === selectedColor)?.stock ?? 0) <= 0)}
                  >
                    BUY IT NOW
                  </button>
                </div>
                
                {/* Stock Indicator */}
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Please select the size to see the colors
                </div>

              </div>
            </div>
          </div>
        </div>
      

      {/* NEW ARRIVALS Section */}
      <div className="w-full max-w-7xl mx-auto mt-20 mb-16 px-4 bg-white dark:bg-black">
        <h2 className="text-3xl md:text-4xl font-light mb-12 text-center tracking-widest text-black dark:text-white">NEW ARRIVALS</h2>
        
        {loadingNewArrivals ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="flex overflow-x-auto scrollable-x gap-8 pb-8">
            {newArrivals && newArrivals.length > 0 ? (
              // Map over products only if we have them
              newArrivals.map((newProduct: any) => (
                <Link
                  key={newProduct._id || Math.random().toString()}
                  href={newProduct._id ? `/product/${newProduct._id}` : '/collection'}
                  className="flex-shrink-0 flex flex-col items-center min-w-[260px] max-w-[320px] group cursor-pointer"
                >
                  <div className="relative w-full aspect-[3/4] mb-4">
                    <Image
                      src={(newProduct.images?.[0] || '/images/placeholder.jpg')}
                      alt={newProduct.name || 'Product'}
                      fill
                      className="object-cover object-center"
                      unoptimized={true}
                    />
                  </div>
                  <div className="w-full text-center">
                    <div className="text-xs tracking-widest mb-1 text-gray-600 dark:text-white group-hover:underline">
                      {(newProduct.name || newProduct.title || 'Product').toUpperCase()}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-black dark:text-white">
                      <span className="text-base">L.E {newProduct.price || 0}</span>
                      {newProduct.discount && newProduct.discount > 0 && (
                        <span className="text-xs line-through text-gray-500 dark:text-gray-400">
                          L.E {Math.round(newProduct.price / (1 - newProduct.discount / 100))}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Empty state when no products found
              <div className="w-full text-center text-gray-500 py-8">
                No new arrivals to display
              </div>
            )}
          </div>
        )}
        
        {/* See all link */}
        <div className="w-full flex justify-center mt-8">
          <Link href="/collection" className="text-sm text-black dark:text-white border-b border-black dark:border-white pb-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            SEE ALL
          </Link>
        </div>
      </div>
      
      <NewFooter />
    </>
  )
}

export default ProductPage