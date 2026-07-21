/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Home, Search, ShoppingBag } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import { motion } from 'motion/react';
import Catalog from './components/Catalog';
import Cart from './components/Cart';
const AdminPanel = lazy(() => import('./components/AdminPanel'));
import { supabase } from './lib/supabase';
import { getVariantPromoPrice } from './utils/promoHelpers';
import { Product, OrderCartItem, ProductVariant } from './types';
import { writeSafeLocalStorage, readSafeLocalStorage } from './utils/sanitize';

/** Lightweight hook that tracks window.location.pathname and lets components navigate without a full reload */
function useRoute() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (path: string) => {
    if (path !== window.location.pathname) {
      window.history.pushState(null, '', path);
      setPathname(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return { pathname, navigate };
}

export default function App() {
  const { pathname, navigate } = useRoute();

  // true when URL is /admin (or any /admin/* sub-path)
  const isAdminRoute = pathname.startsWith('/admin');

  // Modal controllers
  const [isCartOpen, setIsCartOpen] = useState(() => sessionStorage.getItem('is_cart_open') === 'true');

  // Products state (synchronized from Supabase/mock)
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Cart State (stored safely with sanitized reading)
  const [cartItems, setCartItems] = useState<OrderCartItem[]>([]);

  // Search query state (elevated to App level to share with Header)
  const [searchQuery, setSearchQuery] = useState('');

  // 1. LOAD PRODUCTS ON MOUNT
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        throw error;
      }
      if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching catalog products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Load saved cart state from safe local storage
    const savedCart = readSafeLocalStorage<OrderCartItem[]>('martemu_cart_items', []);
    setCartItems(savedCart);
  }, []);

  // Sync modal states to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('is_cart_open', isCartOpen.toString());
  }, [isCartOpen]);

  // Track and restore scroll position across refreshes
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('scroll_position');
    if (savedScroll) {
      const timer = setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [products]); // Run when products are loaded to ensure correct height

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('scroll_position', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync cart items to safe storage upon edits
  const updateCartState = (newCart: OrderCartItem[]) => {
    setCartItems(newCart);
    writeSafeLocalStorage<OrderCartItem[]>('martemu_cart_items', newCart, 7); // Expire in 7 days
  };

  // 2. CART CRUD OPERATIONS
  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.id === product.id &&
        item.selectedVariant?.name === variant?.name
    );

    if (existingIndex > -1) {
      const copy = [...cartItems];
      copy[existingIndex].quantity += 1;
      updateCartState(copy);
    } else {
      const basePrice = product.promo_price ? product.promo_price : product.price;
      
      let finalVariant: ProductVariant | undefined = undefined;
      if (variant) {
        finalVariant = {
          name: variant.name,
          price: product.promo_price 
            ? getVariantPromoPrice(product.price, product.promo_price, variant.price)
            : variant.price,
          image: variant.image
        };
      }

      const newItem: OrderCartItem = {
        id: product.id,
        name: product.name,
        price: basePrice,
        quantity: 1,
        image: (variant && variant.image) ? variant.image : product.images[0],
        selectedVariant: finalVariant
      };
      updateCartState([...cartItems, newItem]);
    }

    // Open cart drawer immediately to provide responsive purchase feedback
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, quantity: number, variant?: ProductVariant) => {
    const copy = cartItems.map((item) => {
      if (item.id === id && item.selectedVariant?.name === variant?.name) {
        return { ...item, quantity };
      }
      return item;
    });
    updateCartState(copy);
  };

  const handleRemoveCartItem = (id: string, variant?: ProductVariant) => {
    const filtered = cartItems.filter(
      (item) =>
        !(item.id === id && item.selectedVariant?.name === variant?.name)
    );
    updateCartState(filtered);
  };

  const handleClearCart = () => {
    updateCartState([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa]">
      {/* Universal Header */}
      <Header
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isAdminRoute={isAdminRoute}
        onNavigateShop={() => navigate('/')}
        onNavigateAdmin={() => navigate('/admin')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Container Content */}
      <div className="flex-1">
        {isAdminRoute ? (
          <Suspense fallback={
            <div className="flex items-center justify-center py-32">
              <span className="text-sm font-semibold text-brand-blue animate-pulse">Cargando panel de administración...</span>
            </div>
          }>
            <AdminPanel
              products={products}
              onRefreshProducts={fetchProducts}
            />
          </Suspense>
        ) : (
          <Catalog
            products={products}
            isLoading={isLoadingProducts}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </div>

      {/* Universal Footer */}
      <Footer
        onNavigateShop={() => navigate('/')}
      />

      {/* Cart Drawer panel */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Mobile Sticky Bottom Navigation (only on public storefront) */}
      {!isAdminRoute && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-150 bg-white/95 backdrop-blur-md px-4 py-2 shadow-lg md:hidden flex justify-around items-center h-14">
          <button
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-0.5 transition active:scale-95 cursor-pointer ${(pathname === '/' && !isCartOpen) ? 'text-brand-blue font-bold' : 'text-gray-500 hover:text-brand-blue'}`}
          >
            <Home className={`h-5 w-5 ${(pathname === '/' && !isCartOpen) ? 'text-brand-blue' : 'text-gray-500'}`} />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>
          
          <button
            onClick={() => {
              const desktopSearch = document.querySelector('#header-search-container input') as HTMLInputElement;
              if (desktopSearch && window.innerWidth >= 768) {
                desktopSearch.focus();
              } else {
                const mobileBtn = document.querySelector('#btn-search-mobile') as HTMLButtonElement;
                mobileBtn?.click();
              }
            }}
            className={`flex flex-col items-center gap-0.5 transition active:scale-95 cursor-pointer ${searchQuery ? 'text-brand-blue font-bold' : 'text-gray-500 hover:text-brand-blue'}`}
          >
            <Search className={`h-5 w-5 ${searchQuery ? 'text-brand-blue' : 'text-gray-500'}`} />
            <span className="text-[10px] font-bold">Buscar</span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative flex flex-col items-center gap-0.5 transition active:scale-95 cursor-pointer ${isCartOpen ? 'text-brand-navy font-bold' : 'text-gray-500 hover:text-brand-blue'}`}
          >
            <ShoppingBag className={`h-5 w-5 ${isCartOpen ? 'text-brand-navy' : 'text-gray-500'}`} />
            <span className="text-[10px] font-bold">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-purple text-[9px] font-bold text-white shadow-sm animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      {!isAdminRoute && (
        <motion.a
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href="https://wa.me/573042564311?text=Hola%20MarTemu!%20Me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre%20los%20productos%20del%20cat%C3%A1logo%20y%20recibir%20asesor%C3%ADa%20personalizada."
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 md:bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-[#25d366]/25 cursor-pointer hover:shadow-xl hover:shadow-[#25d366]/40"
          title="Contactar por WhatsApp"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </motion.a>
      )}
    </div>
  );
}

