/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, XCircle, Trash2, AlertTriangle, MessageSquare, RefreshCw, MapPin, CreditCard, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Product } from '../types';
import { supabase } from '../lib/supabase';

interface AdminOrdersProps {
  orders: Order[];
  products: Product[];
  onRefresh: () => void;
}

export default function AdminOrders({ orders, products, onRefresh }: AdminOrdersProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'confirm_payment' | 'cancel_order' | 'delete_order' | null;
    orderId: string | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: null,
    orderId: null,
    title: '',
    description: ''
  });

  // Close confirmation modal with Escape key and lock body scroll when open
  useEffect(() => {
    if (confirmModal.isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setConfirmModal(prev => ({ ...prev, isOpen: false }));
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [confirmModal.isOpen]);

  const filteredOrders = orders.filter((o) => {
    // 1. Status Filter (activeFilter)
    const matchesStatus = activeFilter === 'all' || o.status === activeFilter;

    // 2. Search query filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      o.customer_name.toLowerCase().includes(searchLower) ||
      o.customer_phone.includes(searchTerm) ||
      o.id.toLowerCase().includes(searchLower) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(searchLower));

    // 3. Payment Method Filter
    const matchesPayment = paymentMethodFilter === 'all' || o.payment_method === paymentMethodFilter;

    return matchesStatus && matchesSearch && matchesPayment;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paymentMethodFilter, activeFilter]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenConfirm = (type: 'confirm_payment' | 'cancel_order' | 'delete_order', orderId: string) => {
    let title = '';
    let description = '';
    
    if (type === 'confirm_payment') {
      title = '¿Confirmar Pago de Pedido?';
      description = 'Esta acción registrará el pago, marcará el pedido como CONFIRMADO y descontará automáticamente las cantidades correspondientes del stock del catálogo.';
    } else if (type === 'cancel_order') {
      title = '¿Cancelar Pedido?';
      description = 'El pedido se marcará como CANCELADO. Esta acción no descontará existencias del catálogo.';
    } else if (type === 'delete_order') {
      title = '¿Eliminar Historial de Pedido?';
      description = 'El registro se eliminará permanentemente de la base de datos de Supabase. Esta operación es irreversible.';
    }

    setConfirmModal({
      isOpen: true,
      type,
      orderId,
      title,
      description
    });
  };

  const handleActionConfirm = async () => {
    const { type, orderId } = confirmModal;
    if (!type || !orderId) return;

    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      if (type === 'confirm_payment') {
        // 1. Fetch current order details
        const order = orders.find(o => o.id === orderId);
        if (!order) throw new Error('Pedido no encontrado');

        // 2. Decrement stock for each item
        for (const item of order.items) {
          // Fetch current product to check actual stock
          const { data: currentProduct, error: fetchErr } = await supabase
            .from('products')
            .select('stock, name')
            .eq('id', item.id)
            .single();

          if (!fetchErr && currentProduct) {
            const newStock = Math.max(0, currentProduct.stock - item.quantity);
            // Update stock in Supabase
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.id);
          }
        }

        // 3. Update order status to confirmed
        const { error: updateErr } = await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderId);

        if (updateErr) throw updateErr;

      } else if (type === 'cancel_order') {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);

        if (error) throw error;

      } else if (type === 'delete_order') {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) throw error;
      }

      onRefresh(); // Refresh orders list
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      console.error('Error executing admin order action:', err);
      setErrorMessage(err.message || 'Error al procesar la acción.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return '$' + val.toLocaleString('es-CO');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('es-CO', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6" id="admin-orders-tab">
      
      {/* Filters and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-brand-blue" />
          <h3 className="text-lg font-black text-brand-navy">Gestión de Pedidos</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onRefresh()}
            className="rounded-lg p-2 hover:bg-gray-100 transition mr-2"
            title="Sincronizar Pedidos"
          >
            <RefreshCw className="h-4 w-4 text-gray-500 hover:rotate-45 transition-transform" />
          </button>

          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeFilter === filter
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {filter === 'all' && 'Todos'}
              {filter === 'pending' && 'Pendientes'}
              {filter === 'confirmed' && 'Confirmados'}
              {filter === 'cancelled' && 'Cancelados'}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Payment Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-blue focus:outline-hidden"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex items-center gap-2 text-xs w-full md:w-auto justify-end">
          <span className="font-bold text-gray-500 uppercase text-[10px]">Método de Pago:</span>
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:border-brand-blue focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
            <option value="bold">Bold (Tarjeta)</option>
            <option value="contraentrega">Contra Entrega</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-center p-6">
          <ClipboardList className="h-10 w-10 text-gray-300 mb-3" />
          <h4 className="text-sm font-bold text-gray-700">No se encontraron pedidos</h4>
          <p className="text-xs text-gray-400 max-w-sm mt-1">
            Prueba cambiando los términos de búsqueda o selecciona otro filtro de estado/pago.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className={`rounded-2xl border bg-white p-5 shadow-xs transition-all flex flex-col md:flex-row justify-between gap-6 ${
                  order.status === 'confirmed' 
                    ? 'border-emerald-100 hover:border-emerald-200' 
                    : order.status === 'cancelled'
                    ? 'border-rose-100 hover:border-rose-200'
                    : 'border-amber-100 hover:border-amber-200'
                }`}
                id={`order-record-${order.id}`}
              >
                {/* Order Metadata and Client Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-mono text-gray-400">
                      ID: {order.id.slice(0, 8)}...
                    </span>
                    <span className="text-[10px] text-gray-550 font-semibold">
                      {formatDate(order.created_at)}
                    </span>
                    
                    {/* Status pills */}
                    {order.status === 'confirmed' && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                        Confirmado y Descontado
                      </span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 uppercase">
                        Cancelado
                      </span>
                    )}
                    {order.status === 'pending' && (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase animate-pulse">
                        Pendiente Pago
                      </span>
                    )}
                  </div>

                  {/* Client info */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{order.customer_name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <SmartphoneIcon className="h-3.5 w-3.5 text-gray-400" />
                      WhatsApp: <span className="font-mono font-bold text-gray-700">{order.customer_phone}</span>
                    </p>
                  </div>

                  {/* Delivery & Payment Info */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {order.delivery_address && (
                      <div className="flex items-start gap-1.5 bg-blue-50/50 rounded-lg px-3 py-2 border border-blue-100 flex-1 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">Dirección</span>
                          <p className="text-[11px] text-gray-700 font-medium leading-snug">{order.delivery_address}</p>
                        </div>
                      </div>
                    )}
                    {order.payment_method && (
                      <div className="flex items-center gap-1.5 bg-amber-50/50 rounded-lg px-3 py-2 border border-amber-100 shrink-0">
                        <CreditCard className="h-3.5 w-3.5 text-amber-500" />
                        <div>
                          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Pago</span>
                          <p className="text-[11px] text-gray-700 font-bold capitalize">{order.payment_method}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items Summary list */}
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-2 max-w-lg">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Artículos del Pedido</span>
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs py-1.5 text-gray-600">
                          <span>
                            {item.name} {item.selectedVariant ? `(${item.selectedVariant.name})` : ''} 
                            <strong className="text-gray-800 ml-1.5">x{item.quantity}</strong>
                          </span>
                          <span className="font-semibold text-gray-700">{item.selectedVariant ? item.selectedVariant.price : item.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs font-bold text-brand-navy border-t border-slate-200 pt-2 mt-2">
                      <span>Monto Total Cobrado</span>
                      <span className="text-brand-purple text-sm">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons side panel */}
                <div className="flex flex-row md:flex-col justify-end items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleOpenConfirm('confirm_payment', order.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition active:scale-95 shadow-sm shadow-emerald-600/10"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Confirmar Pago</span>
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleOpenConfirm('cancel_order', order.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-655 px-3 py-2 text-xs font-bold transition"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Cancelar</span>
                    </button>
                  )}

                  {/* Direct Contact */}
                  <a
                    href={`https://api.whatsapp.com/send?phone=${order.customer_phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-brand-blue text-brand-blue hover:bg-brand-blue/5 px-3 py-2 text-xs font-bold transition"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat Cliente</span>
                  </a>

                  {/* Delete button always available for historical cleaning */}
                  <button
                    onClick={() => handleOpenConfirm('delete_order', order.id)}
                    className="flex items-center gap-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 p-2 text-xs font-bold transition"
                    title="Eliminar Registro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 rounded-2xl mt-4">
              <div className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-800">{paginatedOrders.length}</span> de <span className="font-bold text-gray-800">{filteredOrders.length}</span> pedidos
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-655 px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>
                <span className="text-xs font-bold text-gray-650 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-150">
                  Pág. {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-655 px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CUSTOM REACT-STYLED CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
              id="confirm-action-modal"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  confirmModal.type === 'confirm_payment' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : confirmModal.type === 'cancel_order'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                
                <div>
                  <h4 className="text-sm font-black text-brand-navy">{confirmModal.title}</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    {confirmModal.description}
                  </p>
                </div>

                <div className="w-full flex gap-3 pt-3">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition"
                  >
                    Regresar
                  </button>
                  <button
                    onClick={handleActionConfirm}
                    disabled={isProcessing}
                    className={`flex-1 rounded-xl text-xs font-bold text-white px-4 py-2.5 transition-all ${
                      confirmModal.type === 'confirm_payment' 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : confirmModal.type === 'cancel_order'
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isProcessing ? 'Procesando...' : 'Confirmar'}
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

// Inline decorative Smartphone Icon
function SmartphoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}
