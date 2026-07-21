/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, Send, CheckCircle, Smartphone, MapPin, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderCartItem, ProductVariant } from '../types';
import { sanitizeString, sanitizePhone, sanitizeTotalAmount } from '../utils/sanitize';
import { checkRateLimit, recordAttempt } from '../utils/rateLimiter';
import { supabase } from '../lib/supabase';

// Custom Brand SVGs for Payment Methods
const EfectivoLogo = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2005/svg">
    <rect width="24" height="24" rx="5" fill="#ffe600" />
    <path d="M8 8l4 4-4 4m5-8l4 4-4 4" stroke="#0035a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NequiLogo = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2005/svg">
    <rect width="24" height="24" rx="5" fill="#1e102f" />
    <path d="M6 7.5h2.5V11L6 10.5V7.5zm5 0h2.5v9H11v-9zm2.5 3.5l2.5 3V7.5H18.5v9H16v-3.5l-2.5-3v6.5H11v-9h2.5z" fill="#ffffff" />
    <circle cx="18" cy="7.5" r="1" fill="#da1c5c" />
  </svg>
);

const DaviplataLogo = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2005/svg">
    <rect width="24" height="24" rx="5" fill="#e30613" />
    <path d="M12 6l-5 4v6.5h10V10l-5-4zm-1.5 8.5v-3h3v3h-3z" fill="#ffffff" />
    <circle cx="12" cy="9" r="1" fill="#ffffff" />
  </svg>
);

const BoldLogo = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2005/svg">
    <circle cx="12" cy="12" r="11" fill="#ff004f" />
    <path d="M8.5 7h2v3.5c.4-.6.9-1 1.7-1 1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5c-.7 0-1.3-.4-1.7-.9v2.4h-2V7zm2 5.5v1.5c.3.3.6.4 1 .4.7 0 1.1-.4 1.1-1.2s-.4-1.2-1.1-1.2c-.4 0-.7.1-1 .5z" fill="#ffffff" />
  </svg>
);

const TarjetaLogo = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2005/svg">
    <rect width="24" height="16" y="4" rx="3" fill="#0b1e46" />
    <rect width="24" height="3.5" y="7" fill="#000" />
    <circle cx="6" cy="14" r="2" fill="#eb001b" />
    <circle cx="9" cy="14" r="2" fill="#f79e1b" opacity="0.85" />
  </svg>
);

const TransferenciaLogo = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2005/svg">
    <rect width="24" height="24" rx="5" fill="#f4f6f9" />
    <path d="M5.5 10c0-2 1.5-3.5 3.5-3.5h6c2 0 3.5 1.5 3.5 3.5v4c0 2-1.5 3.5-3.5 3.5h-6c-2 0-3.5-1.5-3.5-3.5v-4z" fill="#0c2340" />
    <path d="M7.5 9h2.5v1.2H7.5V9zm0 3.2H12v1.2H7.5v-1.2z" fill="#ffffff" />
    <circle cx="15" cy="8.5" r="1.2" fill="#fcd116" />
    <circle cx="15" cy="11" r="1.2" fill="#003893" />
    <circle cx="15" cy="13.5" r="1.2" fill="#ce1126" />
  </svg>
);

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderCartItem[];
  onUpdateQuantity: (id: string, quantity: number, variant?: ProductVariant) => void;
  onRemoveItem: (id: string, variant?: ProductVariant) => void;
  onClearCart: () => void;
}

export default function Cart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll and close on Escape when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  const PAYMENT_METHODS = [
    { id: 'efectivo', label: 'Efectivo', logo: EfectivoLogo, color: 'emerald' },
    { id: 'nequi', label: 'Nequi', logo: NequiLogo, color: 'purple' },
    { id: 'daviplata', label: 'Daviplata', logo: DaviplataLogo, color: 'rose' },
    { id: 'bold', label: 'Bold', logo: BoldLogo, color: 'blue' },
    { id: 'tarjeta', label: 'Tarjeta', logo: TarjetaLogo, color: 'amber' },
    { id: 'transferencia', label: 'Transferencia', logo: TransferenciaLogo, color: 'cyan' },
  ];

  // Calculate order total
  const rawTotal = cartItems.reduce((acc, item) => {
    // Parse prices such as "$189.900" into numeric value 189900
    const priceStr = item.selectedVariant ? item.selectedVariant.price : item.price;
    const numericPrice = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
    return acc + (numericPrice * item.quantity);
  }, 0);

  // Apply defense-in-depth sanitization constraint
  const totalAmount = sanitizeTotalAmount(rawTotal);

  const formatCurrency = (val: number) => {
    return '$' + val.toLocaleString('es-CO');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Prevent submission on empty cart
    if (cartItems.length === 0) {
      setErrorMessage('Tu carrito está vacío.');
      return;
    }

    // Rate Limiting check (max 5 order creations per hour)
    const limitCheck = checkRateLimit('checkout', 5, 60 * 60 * 1000);
    if (limitCheck.limited) {
      const minutesLeft = Math.ceil((limitCheck.resetTime - Date.now()) / (60 * 1000));
      setErrorMessage(`Has superado el límite de pedidos permitidos. Por favor, espera ${minutesLeft} minuto(s) antes de intentar de nuevo.`);
      return;
    }

    // 1. Sanitize input fields to prevent SQL injection & XSS
    const sanitizedName = sanitizeString(customerName, 100);
    const sanitizedPhone = sanitizePhone(customerPhone);

    if (sanitizedName.length < 3) {
      setErrorMessage('Por favor ingresa un nombre válido (mínimo 3 caracteres).');
      return;
    }

    if (sanitizedPhone.length < 8) {
      setErrorMessage('Por favor ingresa un número de WhatsApp válido (mínimo 8 dígitos).');
      return;
    }

    const sanitizedAddress = sanitizeString(deliveryAddress, 300);
    if (sanitizedAddress.length < 10) {
      setErrorMessage('Por favor ingresa una dirección de entrega válida (mínimo 10 caracteres).');
      return;
    }

    if (!paymentMethod) {
      setErrorMessage('Por favor selecciona un método de pago.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Prepare order payload for Supabase database
      const orderPayload = {
        customer_name: sanitizedName,
        customer_phone: sanitizedPhone,
        delivery_address: sanitizedAddress,
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.selectedVariant ? item.selectedVariant.price : item.price,
          quantity: item.quantity,
          variant: item.selectedVariant ? { name: item.selectedVariant.name, price: item.selectedVariant.price } : null
        })),
        total_amount: totalAmount,
        status: 'pending' as const
      };

      // Write to Supabase database (or localStorage fallback in mockDb inside our proxy)
      const { error } = await supabase.from('orders').insert(orderPayload);

      if (error) {
        throw new Error(error.message || 'Error guardando pedido en base de datos.');
      }

      // Auto-register customer in vip_members table (repurposed as clients)
      try {
        const { data: existingClients } = await supabase
          .from('vip_members')
          .select('*')
          .eq('whatsapp', sanitizedPhone);

        if (!existingClients || existingClients.length === 0) {
          await supabase.from('vip_members').insert({
            name: sanitizedName,
            whatsapp: sanitizedPhone
          });
        }
      } catch (clientErr) {
        console.error('Error auto-registering client:', clientErr);
        // Do not fail checkout if client tracking fails
      }

      // Record successful attempt to prevent abuse
      recordAttempt('checkout', 60 * 60 * 1000);

      // 3. Format dynamic WhatsApp message
      const selectedMethodLabel = PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod;

      let message = `*¡Hola MarTemu!*\n`;
      message += `Quiero realizar un pedido con los siguientes detalles:\n\n`;
      message += `*Cliente:* ${sanitizedName}\n`;
      message += `*WhatsApp:* ${sanitizedPhone}\n`;
      message += `*Dirección de Entrega:* ${sanitizedAddress}\n`;
      message += `*Método de Pago:* ${selectedMethodLabel}\n\n`;
      message += `*Detalle de Productos:*\n`;

      cartItems.forEach((item) => {
        const variantText = item.selectedVariant ? ` (${item.selectedVariant.name})` : '';
        const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
        message += `- ${item.name}${variantText} x${item.quantity} - ${itemPrice}\n`;
      });

      message += `\n*Total del Pedido:* ${formatCurrency(totalAmount)}\n\n`;
      message += `---\n`;
      message += `_Pedido registrado de forma segura desde el catálogo MarTemu_`;

      const encodedMessage = encodeURIComponent(message);
      
      // Store WhatsApp phone number
      const storeWhatsApp = '+573042564311'; 
      const whatsAppLink = `https://api.whatsapp.com/send?phone=${storeWhatsApp.replace(/[^\d]/g, '')}&text=${encodedMessage}`;

      // Open WhatsApp immediately in a new tab
      window.open(whatsAppLink, '_blank', 'noreferrer');

      // Set checkout success state
      setCheckoutSuccess(true);
      onClearCart();
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setPaymentMethod('');

    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Ocurrió un error al procesar el checkout. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop mask */}
          <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md"
              id="drawer-shopping-cart"
            >
              <div className="flex h-full flex-col bg-white/90 backdrop-blur-md border-l border-white/30 shadow-2xl">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-linear-to-r from-brand-navy to-brand-purple text-white">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-brand-blue" />
                    <h2 className="text-lg font-bold">Tu Carrito de Compras</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full bg-white/10 p-1 hover:bg-white/20 transition active:scale-90"
                    aria-label="Cerrar carrito"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Steps Progress Indicator */}
                {!checkoutSuccess && cartItems.length > 0 && (
                  <div className="bg-slate-50 border-b border-gray-100 px-6 py-3 flex justify-between items-center text-[10px] font-bold text-gray-400">
                    <div className="flex items-center gap-1.5 text-brand-blue">
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-blue text-white text-[9px] font-black">1</span>
                      <span>Artículos</span>
                    </div>
                    <div className="h-0.5 w-6 bg-gray-200 flex-1 mx-2"></div>
                    <div className="flex items-center gap-1.5 text-brand-purple">
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-purple text-white text-[9px] font-black">2</span>
                      <span>Envío</span>
                    </div>
                    <div className="h-0.5 w-6 bg-gray-200 flex-1 mx-2"></div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gray-300 text-white text-[9px] font-black">3</span>
                      <span>WhatsApp</span>
                    </div>
                  </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  {checkoutSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4" id="success-checkout-screen">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle className="h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-bold text-brand-navy">¡Pedido Registrado con Éxito!</h3>
                      <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                        Hemos abierto el chat de WhatsApp con nuestro asesor para coordinar el pago y el envío de tus productos. Tu pedido también se guardó de forma segura en nuestro sistema.
                      </p>
                      <button
                        onClick={() => {
                          setCheckoutSuccess(false);
                          onClose();
                        }}
                        className="mt-6 rounded-lg bg-brand-blue text-white px-5 py-2.5 text-xs font-bold hover:bg-brand-blue/90 transition"
                      >
                        Seguir Explorando
                      </button>
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3" id="empty-cart-screen">
                      <ShoppingBag className="h-12 w-12 text-gray-300" />
                      <h3 className="text-sm font-bold text-brand-navy">Tu carrito está esperando por ti</h3>
                      <p className="text-xs text-gray-400 max-w-xs">
                        Explora las secciones exclusivas de MarTemu y agrega los artículos que más te encantan.
                      </p>
                      <button
                        onClick={onClose}
                        className="mt-4 rounded-lg border border-brand-blue text-brand-blue px-4 py-2 text-xs font-bold hover:bg-brand-blue/5 transition"
                      >
                        Ver Catálogo
                      </button>
                    </div>
                  ) : (
                    /* Cart items list */
                    <div className="space-y-4" id="cart-items-list">
                      <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Artículos Seleccionados</h3>
                      
                      <div className="divide-y divide-gray-100">
                        {cartItems.map((item, idx) => {
                          const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
                          return (
                            <div key={`${item.id}-${item.selectedVariant?.name || 'def'}`} className="flex py-4 gap-4 items-center">
                              {/* Quantity actions */}
                              <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                <button
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.selectedVariant)}
                                  className="p-1 hover:text-brand-blue transition"
                                  aria-label="Aumentar cantidad"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                                <span className="text-xs font-bold text-brand-navy">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1), item.selectedVariant)}
                                  disabled={item.quantity <= 1}
                                  className="p-1 disabled:opacity-35 hover:text-rose-600 transition"
                                  aria-label="Disminuir cantidad"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Thumbnail image */}
                              <div className="h-12 w-12 rounded-lg border border-gray-150 overflow-hidden bg-slate-50 shrink-0 shadow-xs flex items-center justify-center">
                                {item.image ? (
                                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <ShoppingBag className="h-5 w-5 text-gray-300" />
                                )}
                              </div>

                              {/* Info block */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-gray-800 truncate">{item.name}</h4>
                                {item.selectedVariant && (
                                  <p className="text-[10px] text-brand-purple font-semibold">
                                    Var: {item.selectedVariant.name}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 font-extrabold mt-1">{itemPrice}</p>
                              </div>

                              {/* Remove action */}
                              <button
                                onClick={() => onRemoveItem(item.id, item.selectedVariant)}
                                className="text-gray-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition"
                                aria-label="Eliminar producto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total pricing box */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-150 space-y-2 mt-6">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Subtotal de artículos</span>
                          <span>{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Envío (Acordar con asesor)</span>
                          <span className="font-semibold text-emerald-600 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Gratis</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-extrabold text-brand-navy border-t border-gray-200 pt-2 mt-2">
                          <span>Total Estimado</span>
                          <span className="text-base text-brand-purple">{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>

                      {/* Checkout Form */}
                      <form onSubmit={handleCheckout} className="space-y-4 pt-6 border-t border-gray-100" id="checkout-form">
                        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
                          <Smartphone className="h-4 w-4 text-brand-blue" />
                          <span>Datos para Envío</span>
                        </h3>

                        {errorMessage && (
                          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800">
                            {errorMessage}
                          </div>
                        )}

                        <div className="space-y-1">
                          <label htmlFor="customer-name" className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nombre Completo</label>
                          <input
                            id="customer-name"
                            type="text"
                            placeholder="Ej. Santiago Martínez"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-blue focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="customer-phone" className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">WhatsApp / Teléfono</label>
                          <input
                            id="customer-phone"
                            type="text"
                            placeholder="Ej. +573124567890"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-blue focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="delivery-address" className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Dirección de Entrega
                          </label>
                          <textarea
                            id="delivery-address"
                            placeholder="Ej. Cra 45 #26-85, Barrio El Poblado, Medellín"
                            required
                            rows={2}
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-blue focus:outline-hidden resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            Método de Pago
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map((method) => {
                              const LogoComponent = method.logo;
                              const isSelected = paymentMethod === method.id;
                              const colorMap: Record<string, { bg: string; border: string; text: string; iconColor: string }> = {
                                emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-400', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
                                purple: { bg: 'bg-purple-50/50', border: 'border-purple-400', text: 'text-purple-700', iconColor: 'text-purple-500' },
                                rose: { bg: 'bg-rose-50/50', border: 'border-rose-400', text: 'text-rose-700', iconColor: 'text-rose-500' },
                                blue: { bg: 'bg-blue-50/50', border: 'border-blue-400', text: 'text-blue-700', iconColor: 'text-blue-500' },
                                amber: { bg: 'bg-amber-50/50', border: 'border-amber-400', text: 'text-amber-700', iconColor: 'text-amber-500' },
                                cyan: { bg: 'bg-cyan-50/50', border: 'border-cyan-400', text: 'text-cyan-700', iconColor: 'text-cyan-500' },
                              };
                              const colors = colorMap[method.color] || colorMap.blue;

                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => setPaymentMethod(method.id)}
                                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-[10px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? `${colors.bg} ${colors.border} ${colors.text} shadow-sm scale-[1.02]`
                                      : 'border-gray-150 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <LogoComponent />
                                  <span>{method.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          {paymentMethod === 'bold' && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[10px] font-bold text-brand-purple bg-purple-50/60 border border-purple-100 rounded-lg p-2.5 mt-2 leading-relaxed text-center"
                            >
                              💳 Aceptamos cualquier tipo de tarjeta de crédito o débito (Visa, Mastercard, American Express, Codensa, Diners, etc.) de forma segura a través de Bold.
                            </motion.p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-purple to-brand-blue text-xs font-bold text-white transition-all hover:shadow-lg disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          <span>{isSubmitting ? 'Procesando...' : 'Confirmar y Enviar a WhatsApp'}</span>
                        </button>
                      </form>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
