/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useTransition } from 'react';
import { Search, ChevronRight, ChevronLeft, ShoppingCart, SlidersHorizontal, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductVariant } from '../types';
import { sanitizeString, DEFAULT_DESCRIPTIONS } from '../utils/sanitize';
import { parseCOP, calculateDiscountPercent, getVariantPromoPrice } from '../utils/promoHelpers';

interface CatalogProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CATEGORIES = ['Todos', 'Tecnología', 'Hogar y Cocina', 'Ropa', 'Belleza', 'Peluches', 'Novedades'];

export default function Catalog({
  products,
  isLoading,
  onAddToCart,
  searchQuery,
  onSearchChange,
}: CatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('catalog_selected_category') || 'Todos';
  });

  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products.length > 0) {
      const shuffled = [...products];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledProducts(shuffled);
    } else {
      setShuffledProducts([]);
    }
  }, [products]);

  const displayProducts = shuffledProducts.length > 0 ? shuffledProducts : products;

  useEffect(() => {
    sessionStorage.setItem('catalog_selected_category', selectedCategory);
  }, [selectedCategory]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isPending, startTransition] = useTransition();

  // Advanced Filters & Sorting States
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Pagination count for client-side loading optimization
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset page count when search/categories/filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy, onlyInStock]);

  // Close product modal with Escape key
  useEffect(() => {
    if (!selectedProduct) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedProduct]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct]);

  // DYNAMIC IMAGE PRELOADING HOOK
  // Preloads the first 4 images of the active category into the document <head> for near-instant rendering.
  useEffect(() => {
    // 1. Filter products for the chosen category
    const categoryProducts = displayProducts.filter((p) => {
      if (selectedCategory === 'Todos') return true;
      return p.category === selectedCategory;
    });

    // 2. Extract first image URL of the top 4 products
    const preloadUrls = categoryProducts
      .slice(0, 4)
      .map((p) => p.images[0])
      .filter((url) => url && url.startsWith('http'));

    // 3. Remove existing preloaded images to avoid clogging the DOM
    const existingPreloads = document.querySelectorAll('link[rel="preload"][as="image"][data-martemu-preload]');
    existingPreloads.forEach((el) => el.remove());

    // 4. Inject new link preload elements
    preloadUrls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.setAttribute('data-martemu-preload', 'true');
      document.head.appendChild(link);
    });

    // Clean up on unmount
    return () => {
      const remainingPreloads = document.querySelectorAll('link[rel="preload"][as="image"][data-martemu-preload]');
      remainingPreloads.forEach((el) => el.remove());
    };
  }, [selectedCategory, products]);

  // Handle Search & Filter with React 19 transition support
  const handleCategoryChange = (category: string) => {
    startTransition(() => {
      setSelectedCategory(category);
    });
  };

  const filteredProducts = displayProducts
    .filter((p) => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Price filters
      const activePriceStr = p.promo_price ? p.promo_price : p.price;
      const priceVal = parseCOP(activePriceStr);
      const matchesMinPrice = minPrice === '' || priceVal >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === '' || priceVal <= parseFloat(maxPrice);
      
      // Stock availability filter
      const matchesStock = !onlyInStock || p.stock > 0;
      
      return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') {
        return parseCOP(a.price) - parseCOP(b.price);
      }
      if (sortBy === 'priceDesc') {
        return parseCOP(b.price) - parseCOP(a.price);
      }
      if (sortBy === 'nameAsc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  // Safe Image Loading Error Handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = ''; // Clear source to trigger fallback rendering
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) {
      const fallback = parent.querySelector('.img-fallback-placeholder');
      if (fallback) fallback.classList.remove('hidden');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative">
      {/* Soft background ambient glows */}
      <div className="absolute top-0 inset-x-0 h-125 bg-linear-to-b from-brand-blue/5 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-brand-purple/5 blur-3xl pointer-events-none" />
      <div className="absolute left-0 top-2/3 h-96 w-96 rounded-full bg-brand-blue/5 blur-3xl pointer-events-none" />
      


      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        
        {/* Category Pills Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/40 pb-4 mb-4 relative z-10" id="category-navigation">
          <div className="flex items-center justify-between w-full sm:w-auto shrink-0">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-xs sm:text-sm tracking-wide uppercase">
              <SlidersHorizontal className="h-4 w-4 text-brand-blue" />
              <span>Categorías</span>
            </div>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`ml-4 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isFilterPanelOpen
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span>Filtros</span>
              {(minPrice !== '' || maxPrice !== '' || sortBy !== 'relevance' || onlyInStock) && (
                <span className="flex h-2 w-2 rounded-full bg-brand-purple animate-pulse" />
              )}
            </button>
          </div>
          
          <div className="w-full relative z-10" id="category-capsule-wrapper">
            <div className="flex overflow-x-auto flex-nowrap sm:flex-wrap items-center gap-1.5 bg-white/70 backdrop-blur-md border border-white/50 p-1 rounded-full shadow-xs scrollbar-none w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shrink-0 duration-200 active:scale-95 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'text-gray-650 hover:text-gray-900 px-3.5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sliding Filters Panel */}
        <AnimatePresence>
          {isFilterPanelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden relative z-10"
            >
              <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  
                  {/* Sorting dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Ordenar por</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-brand-blue focus:outline-hidden cursor-pointer"
                    >
                      <option value="relevance">Relevancia</option>
                      <option value="priceAsc">Precio: Menor a Mayor</option>
                      <option value="priceDesc">Precio: Mayor a Menor</option>
                      <option value="nameAsc">Nombre: A - Z</option>
                    </select>
                  </div>

                  {/* Price inputs */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Rango de Precio</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Mín"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-blue focus:outline-hidden"
                      />
                      <span className="text-gray-400 text-xs">—</span>
                      <input
                        type="number"
                        placeholder="Máx"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-blue focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Availability toggle */}
                  <div className="space-y-1.5 flex flex-col justify-between">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Disponibilidad</label>
                    <label className="flex items-center gap-2.5 h-10 px-3 border border-gray-200 rounded-xl bg-white cursor-pointer select-none text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={onlyInStock}
                        onChange={(e) => setOnlyInStock(e.target.checked)}
                        className="h-4 w-4 rounded-xs border-gray-300 text-brand-blue focus:ring-brand-blue"
                      />
                      <span>Solo artículos disponibles</span>
                    </label>
                  </div>

                </div>

                {/* Reset button action */}
                {(minPrice !== '' || maxPrice !== '' || sortBy !== 'relevance' || onlyInStock) && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice('');
                        setSortBy('relevance');
                        setOnlyInStock(false);
                      }}
                      className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transition Spinner for Category Changes (React 19) */}
        {isPending && (
          <div className="flex justify-center mb-6">
            <span className="text-xs font-semibold text-brand-purple animate-pulse">Sincronizando categoría...</span>
          </div>
        )}

        {/* Products Grid / Skeleton Loading */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" id="skeleton-loader-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white/75 backdrop-blur-xs rounded-2xl border border-white/40 overflow-hidden shadow-xs animate-pulse">
                <div className="bg-gray-200 aspect-square w-full"></div>
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="pt-2 flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-7 bg-gray-200 rounded-full w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-150 p-8" id="no-products-view">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-brand-navy">No se encontraron artículos</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md">
              Prueba cambiando los términos de búsqueda o selecciona otra categoría.
            </p>
            <button
              onClick={() => { setSelectedCategory('Todos'); onSearchChange(''); }}
              className="mt-6 rounded-lg bg-brand-blue text-white px-5 py-2.5 text-xs font-bold hover:bg-brand-blue/90 transition"
            >
              Restaurar Catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" id="products-catalog-grid">
            {filteredProducts.slice(0, visibleCount).map((product, index) => {
              // Apply fetchPriority="high" to the first 4 products in the viewport for optimized LCP
              const isPriority = index < 4;
              
              // Data-driven promo badges based on product properties
              const isFreeShipping = parseCOP(product.price) >= 150000;
              const isBestSeller = product.stock >= 10;
              
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/75 backdrop-blur-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:bg-white/90 transition-all duration-300 will-change-transform"
                  id={`product-card-${product.id}`}
                >
                  {/* Floating Promotion & Stock Badges */}
                  <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 items-start">
                    <span className="rounded-md bg-white/95 px-2 py-0.5 text-[9px] font-bold text-brand-navy shadow-sm backdrop-blur-xs uppercase tracking-wider">
                      {product.category}
                    </span>
                    
                    {product.promo_price && (
                      <span className="rounded-md bg-linear-to-r from-brand-purple to-rose-500 px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs uppercase tracking-wider animate-pulse">
                        {calculateDiscountPercent(product.price, product.promo_price)}% OFF
                      </span>
                    )}

                    {product.stock === 0 ? (
                      <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                        Agotado
                      </span>
                    ) : product.stock <= 3 ? (
                      <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs animate-pulse">
                        Pocas unidades
                      </span>
                    ) : isFreeShipping ? (
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs uppercase tracking-wider">
                        Envío Gratis
                      </span>
                    ) : isBestSeller ? (
                      <span className="rounded-md bg-brand-purple px-2 py-0.5 text-[9px] font-bold text-white shadow-xs uppercase tracking-wider">
                        Top Ventas
                      </span>
                    ) : null}
                  </div>

                  {/* Image Container with Fallback */}
                  <div 
                    onClick={() => {
                      setSelectedProduct(product);
                      setActiveImageIndex(0);
                      setSelectedVariant(product.variants.length > 0 ? product.variants[0] : null);
                    }}
                    className="relative aspect-square w-full bg-gray-50 overflow-hidden cursor-pointer group-hover:scale-102 transition-transform duration-500"
                  >
                    <img
                      src={product.images[0] || ''}
                      alt={product.name}
                      loading="lazy"
                      fetchPriority={isPriority ? 'high' : 'low'}
                      onError={handleImageError}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Safe SVG Placeholder for Image Load Failure */}
                    <div className="img-fallback-placeholder absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center" style={{ display: 'none' }}>
                      <ImageIcon className="h-8 w-8 text-slate-300 mb-1" />
                      <span className="text-[9px] font-semibold">MarTemu Premium</span>
                    </div>

                    {/* Quick View Hover Overlay (Desktop only) */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center transition-opacity duration-300">
                      <span className="rounded-full bg-white/95 backdrop-blur-md px-4 py-2 text-xs font-bold text-brand-navy shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Vista Rápida
                      </span>
                    </div>
                  </div>

                  {/* Details Card Content */}
                  <div className="flex flex-1 flex-col p-3 sm:p-4 space-y-1 justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 hover:text-brand-blue transition text-left">
                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setActiveImageIndex(0);
                            setSelectedVariant(product.variants.length > 0 ? product.variants[0] : null);
                          }}
                          className="text-left font-bold"
                        >
                          {product.name}
                        </button>
                      </h3>
                      
                      <p className="hidden xs:line-clamp-1 text-[10px] sm:text-xs text-gray-400 leading-relaxed mt-0.5">
                        {product.description || DEFAULT_DESCRIPTIONS[product.category] || ''}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-50/50 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] sm:text-xs font-semibold text-gray-450">Precio</span>
                        {product.promo_price ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-rose-600">
                              {product.promo_price}
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                              {product.price}
                            </span>
                            <span className="inline-flex items-center rounded-sm bg-rose-50 px-1 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-100 animate-pulse">
                              {calculateDiscountPercent(product.price, product.promo_price)}% OFF
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm sm:text-base font-black text-brand-navy">
                            {product.price}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (product.stock > 0) {
                            onAddToCart(product, product.variants[0]);
                          }
                        }}
                        disabled={product.stock === 0}
                        className={`flex h-8 w-8 sm:h-9 sm:w-auto items-center justify-center gap-1.5 rounded-full sm:px-3.5 text-xs font-bold text-white transition-all ${
                          product.stock === 0
                            ? 'bg-gray-250 cursor-not-allowed text-gray-400'
                            : 'bg-linear-to-r from-brand-blue to-brand-purple hover:scale-105 active:scale-95'
                        }`}
                        title={product.stock === 0 ? "Agotado" : "Comprar"}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="hidden sm:inline">Comprar</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>

            {/* Load More Button */}
            {filteredProducts.length > visibleCount && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="rounded-xl border border-brand-navy bg-white hover:bg-brand-navy hover:text-white px-8 py-3 text-xs font-bold transition duration-300 shadow-xs cursor-pointer active:scale-95 text-brand-navy"
                >
                  Cargar más productos
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* PRODUCT DETAIL MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs" onClick={() => setSelectedProduct(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl md:grid md:grid-cols-2"
              onClick={(e) => e.stopPropagation()}
              id="modal-product-detail"
            >
              {/* Close Button - sticky so it stays visible when scrolling on mobile */}
              <div className="sticky top-0 z-20 flex justify-end p-3 md:absolute md:right-4 md:top-4 md:p-0">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-white transition-all shadow-md active:scale-90"
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>

              {/* Left Column: Image Carousel */}
              <div className="relative bg-gray-50 flex flex-col justify-between p-4 md:p-6 border-r border-gray-100">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white shadow-xs">
                  <img
                    src={selectedProduct.images[activeImageIndex] || ''}
                    alt={selectedProduct.name}
                    onError={handleImageError}
                    className="h-full w-full object-cover object-center transition-all duration-300"
                  />
                  
                  {/* Embedded SVG Placeholder for failure inside carousel */}
                  <div className="img-fallback-placeholder absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4" style={{ display: 'none' }}>
                    <ImageIcon className="h-12 w-12 text-slate-300 mb-2" />
                    <span className="text-xs font-semibold">MarTemu Premium Visual</span>
                  </div>

                  {/* Carousel controls */}
                  {selectedProduct.images.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === 0 ? selectedProduct.images.length - 1 : prev - 1));
                        }}
                        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white active:scale-95 transition"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === selectedProduct.images.length - 1 ? 0 : prev + 1));
                        }}
                        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white active:scale-95 transition"
                        aria-label="Siguiente imagen"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail Previews */}
                {selectedProduct.images.length > 1 && (
                  <div className="flex items-center gap-2 mt-4 justify-center">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImageIndex === idx 
                            ? 'border-brand-blue scale-105' 
                            : 'border-transparent hover:border-gray-200'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Information & Options */}
              <div className="p-6 md:p-8 flex flex-col justify-between">
                
                {/* Header detail */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-gray-150 px-2.5 py-1 text-[10px] font-bold text-brand-navy uppercase tracking-wider">
                      {selectedProduct.category}
                    </span>

                    {selectedProduct.stock === 0 ? (
                      <span className="rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white">
                        Agotado
                      </span>
                    ) : selectedProduct.stock <= 3 ? (
                      <span className="rounded-md bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white animate-pulse">
                        Últimas {selectedProduct.stock} unidades
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                        Stock Disponible
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-extrabold text-brand-navy leading-snug">
                    {selectedProduct.name}
                  </h2>

                  {/* Pricing and dynamics */}
                  {selectedProduct.promo_price ? (
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-2xl font-black text-rose-600">
                        {selectedVariant 
                          ? getVariantPromoPrice(selectedProduct.price, selectedProduct.promo_price, selectedVariant.price)
                          : selectedProduct.promo_price}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {selectedVariant ? selectedVariant.price : selectedProduct.price}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 border border-rose-100 animate-pulse">
                        {calculateDiscountPercent(selectedProduct.price, selectedProduct.promo_price)}% OFF
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-brand-purple">
                      {selectedVariant ? selectedVariant.price : selectedProduct.price}
                    </div>
                  )}

                  {/* Sanitized description container */}
                  <div className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                    <p>{sanitizeString(selectedProduct.description || DEFAULT_DESCRIPTIONS[selectedProduct.category] || '', 1000)}</p>
                  </div>

                  {/* Variants Selector */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                      <span className="text-xs font-bold text-brand-navy block">Variante</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.variants.map((v, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedVariant(v);
                              if (v.image) {
                                const idx = selectedProduct.images.indexOf(v.image);
                                if (idx > -1) {
                                  setActiveImageIndex(idx);
                                }
                              }
                            }}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                              selectedVariant?.name === v.name
                                ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold'
                                : 'border-gray-200 hover:border-gray-400 text-gray-600'
                            }`}
                          >
                            {v.name} ({v.price})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Cart addition buttons */}
                <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Despacho inmediato</span>
                    <span>Procesamiento seguro</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (selectedProduct.stock > 0) {
                        onAddToCart(selectedProduct, selectedVariant || undefined);
                        setSelectedProduct(null);
                      }
                    }}
                    disabled={selectedProduct.stock === 0}
                    className={`w-full flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all ${
                      selectedProduct.stock === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-linear-to-r from-brand-purple to-brand-blue hover:shadow-lg hover:shadow-brand-blue/20 hover:scale-101 active:scale-99'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Agregar al Carrito de WhatsApp</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
