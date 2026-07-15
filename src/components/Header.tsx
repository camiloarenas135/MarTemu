/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Shield, Search, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isRealSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenVIP: () => void;
  isAdminRoute: boolean;
  onNavigateShop: () => void;
  onNavigateAdmin: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({
  cartCount,
  onOpenCart,
  onOpenVIP,
  isAdminRoute,
  onNavigateShop,
  onNavigateAdmin,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/50 bg-white/75 backdrop-blur-lg shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <div 
            onClick={onNavigateShop} 
            className="flex cursor-pointer items-center gap-3 select-none shrink-0"
            id="brand-logo"
          >
            <img
              src="/infinity.png"
              alt="MarTemu"
              className="h-7 w-auto object-contain aspect-256/150"
              draggable={false}
            />
            <span className="text-2xl font-black tracking-tight text-brand-navy font-heading">
              Mar<span className="text-brand-blue">Temu</span>
            </span>
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="hidden lg:inline-block text-[11px] font-black uppercase tracking-widest bg-linear-to-r from-brand-blue via-brand-purple to-brand-navy bg-clip-text text-transparent border-l border-gray-200 pl-3.5 py-1 select-none"
            >
              Lo que buscas, lo que te encanta
            </motion.span>
          </div>

          {/* Search Box (Desktop/Tablet) */}
          {!isAdminRoute && (
            <div className="hidden md:block flex-1 max-w-xs lg:max-w-md mx-6 lg:mx-8 relative animate-fade-up" id="header-search-container">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-50/50 pl-8.5 pr-4 py-1.5 text-xs text-gray-850 placeholder-gray-400 focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all shadow-xs"
              />
            </div>
          )}

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Trigger (Mobile only) */}
            {!isAdminRoute && (
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-550 hover:bg-gray-100 transition-all md:hidden shrink-0 cursor-pointer"
                aria-label="Buscar"
                id="btn-search-mobile"
              >
                {isMobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4.5 w-4.5" />}
              </button>
            )}


            {/* VIP Club Trigger */}
            {!isAdminRoute && (
              <button
                onClick={onOpenVIP}
                className="group flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center sm:justify-start gap-1.5 rounded-full bg-linear-to-r from-brand-purple to-brand-blue text-white transition-all hover:shadow-md hover:shadow-brand-purple/20 sm:px-4 sm:py-2 text-xs font-bold shrink-0"
                id="btn-vip-club"
              >
                <Users className="h-4 w-4 text-amber-300 group-hover:scale-125 transition-transform" />
                <span className="hidden sm:inline">Club VIP</span>
              </button>
            )}

            {/* Admin mode indicator — only shown on /admin route */}
            {isAdminRoute && (
              <div 
                className="flex items-center gap-1.5 rounded-lg bg-brand-navy text-white px-3 py-2 text-xs font-bold shadow-xs select-none"
                id="tab-admin"
              >
                <Shield className="h-3.5 w-3.5 text-brand-blue" />
                <span>Admin</span>
              </div>
            )}

            {/* Cart Floating Button */}
            {!isAdminRoute && (
              <button
                onClick={onOpenCart}
                className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-brand-navy text-white transition-all hover:bg-brand-blue hover:scale-105 shrink-0"
                aria-label="Ver carrito"
                id="btn-cart-floating"
              >
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-purple text-[9px] font-bold text-white shadow-sm"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Mobile Expandable Search Bar Overlay */}
      <AnimatePresence>
        {!isAdminRoute && isMobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-gray-150 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-xs sticky top-20 z-39"
          >
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full rounded-full border border-gray-205 bg-gray-50 pl-8.5 pr-4 py-1.5 text-xs text-gray-800 focus:border-brand-blue focus:bg-white focus:outline-hidden"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => {
                  onSearchChange('');
                  setIsMobileSearchOpen(false);
                }}
                className="text-brand-blue hover:text-brand-navy text-xs font-bold px-2 py-1 shrink-0 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
