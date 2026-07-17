/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Tag, Percent, Trash2, Edit2, Save, X, Sparkles, AlertCircle, TrendingDown, RefreshCw, ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { parseCOP, formatCOP, calculateDiscountPercent } from '../utils/promoHelpers';

interface AdminPromotionsProps {
  products: Product[];
  onRefresh: () => void;
}

export default function AdminPromotions({ products, onRefresh }: AdminPromotionsProps) {
  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [promoPriceInput, setPromoPriceInput] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Bulk actions states
  const [bulkCategory, setBulkCategory] = useState('Todos');
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number | ''>('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // Confirmation state for deleting all promos
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Search in products on promotion
  const [searchPromo, setSearchPromo] = useState('');

  // Handle active promo list filtering
  const promoProducts = products.filter(p => p.promo_price && parseCOP(p.promo_price) > 0);
  const filteredPromoProducts = promoProducts.filter(p => 
    p.name.toLowerCase().includes(searchPromo.toLowerCase()) || 
    p.id.toLowerCase().includes(searchPromo.toLowerCase())
  );

  // Handle individual product selection in the creation form
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Automatically calculate promo price from discount percentage
  const handleDiscountPercentChange = (percent: number | '') => {
    setDiscountPercentInput(percent);
    if (!selectedProduct) return;

    if (percent === '' || percent <= 0) {
      setPromoPriceInput('');
      return;
    }

    const originalVal = parseCOP(selectedProduct.price);
    const calculatedPromo = Math.round(originalVal * (1 - percent / 100));
    setPromoPriceInput(formatCOP(calculatedPromo));
  };

  // Automatically calculate discount percentage from promo price input
  const handlePromoPriceChange = (val: string) => {
    setPromoPriceInput(val);
    if (!selectedProduct) return;

    const numericPromo = parseCOP(val);
    const originalVal = parseCOP(selectedProduct.price);

    if (numericPromo <= 0 || originalVal <= 0 || numericPromo >= originalVal) {
      setDiscountPercentInput('');
      return;
    }

    const calculatedPercent = Math.round(((originalVal - numericPromo) / originalVal) * 100);
    setDiscountPercentInput(calculatedPercent);
  };

  // Initialize form when selecting a product
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.promo_price) {
        setPromoPriceInput(selectedProduct.promo_price);
        const orig = parseCOP(selectedProduct.price);
        const promo = parseCOP(selectedProduct.promo_price);
        setDiscountPercentInput(Math.round(((orig - promo) / orig) * 100));
      } else {
        setPromoPriceInput('');
        setDiscountPercentInput('');
      }
      setFormError('');
      setFormSuccess('');
    }
  }, [selectedProductId, products]);

  // Save individual promotion
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedProductId) {
      setFormError('Por favor selecciona un producto.');
      return;
    }

    const numericPromo = parseCOP(promoPriceInput);
    const originalVal = selectedProduct ? parseCOP(selectedProduct.price) : 0;

    if (numericPromo <= 0) {
      setFormError('Por favor ingresa un precio promocional válido.');
      return;
    }

    if (numericPromo >= originalVal) {
      setFormError('El precio promocional debe ser menor que el precio original.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPromo = formatCOP(numericPromo);
      const { error } = await supabase
        .from('products')
        .update({ promo_price: formattedPromo })
        .eq('id', selectedProductId);

      if (error) throw error;

      setFormSuccess(`Promoción guardada exitosamente para ${selectedProduct?.name}`);
      setSelectedProductId('');
      setPromoPriceInput('');
      setDiscountPercentInput('');
      setEditingProductId(null);
      onRefresh();
    } catch (err: any) {
      console.error('Error saving promotion:', err);
      setFormError(err.message || 'Error al guardar la promoción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick select percentage pills
  const PERCENTAGE_PILLS = [10, 15, 20, 25, 30, 40, 50];

  // Remove promotion from product
  const handleRemovePromo = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ promo_price: null })
        .eq('id', productId);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error removing promotion:', err);
    }
  };

  // Apply bulk discount to category
  const handleApplyBulkDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    setBulkSuccess('');

    if (!bulkDiscountPercent || bulkDiscountPercent <= 0 || bulkDiscountPercent >= 100) {
      setBulkError('Ingresa un porcentaje de descuento válido (1-99%).');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      // Filter products by selected category
      const targetProducts = products.filter(p => 
        bulkCategory === 'Todos' || p.category === bulkCategory
      );

      if (targetProducts.length === 0) {
        setBulkError('No hay productos en la categoría seleccionada.');
        setIsBulkSubmitting(false);
        return;
      }

      // Loop and update each product
      for (const prod of targetProducts) {
        const originalVal = parseCOP(prod.price);
        const calculatedPromo = Math.round(originalVal * (1 - (bulkDiscountPercent as number) / 100));
        const formattedPromo = formatCOP(calculatedPromo);

        const { error } = await supabase
          .from('products')
          .update({ promo_price: formattedPromo })
          .eq('id', prod.id);

        if (error) throw error;
      }

      setBulkSuccess(`¡Descuento del ${bulkDiscountPercent}% aplicado a ${targetProducts.length} productos!`);
      setBulkDiscountPercent('');
      onRefresh();
    } catch (err: any) {
      console.error('Error applying bulk discount:', err);
      setBulkError(err.message || 'Error al aplicar el descuento masivo.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Clear all promotions from the store
  const handleClearAllPromotions = async () => {
    setIsBulkSubmitting(true);
    try {
      const promoIds = products.filter(p => p.promo_price).map(p => p.id);
      
      for (const id of promoIds) {
        const { error } = await supabase
          .from('products')
          .update({ promo_price: null })
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setBulkSuccess('Se han eliminado todas las promociones del catálogo.');
      setShowClearAllConfirm(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error clearing promotions:', err);
      setBulkError('Error al eliminar las promociones.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Metrics calculations
  const totalProducts = products.length;
  const totalPromotions = promoProducts.length;
  const promoPercent = totalProducts > 0 ? Math.round((totalPromotions / totalProducts) * 100) : 0;
  
  const averageDiscount = totalPromotions > 0
    ? Math.round(
        promoProducts.reduce((acc, p) => acc + calculateDiscountPercent(p.price, p.promo_price), 0) / totalPromotions
      )
    : 0;

  return (
    <div className="space-y-6" id="admin-promotions-tab">
      {/* Title banner */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-5">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-brand-purple" />
          <h3 className="text-lg font-black text-brand-navy">Módulo de Promociones</h3>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-600 px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1 */}
        <div className="bg-linear-to-br from-brand-navy to-brand-blue rounded-2xl p-5 text-white shadow-xs relative overflow-hidden">
          <div className="absolute right-3 top-3 h-16 w-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Productos en Catálogo</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black">{totalProducts}</span>
            <span className="text-xs text-blue-200">productos</span>
          </div>
          <p className="text-[10px] text-blue-100 mt-2">Capacidad total disponible en la tienda</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-linear-to-br from-brand-purple to-pink-600 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden">
          <div className="absolute right-3 top-3 h-16 w-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-200">Ofertas Activas</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black">{totalPromotions}</span>
            <span className="text-xs text-pink-200">({promoPercent}% del catálogo)</span>
          </div>
          <p className="text-[10px] text-pink-100 mt-2">Artículos actualmente con precio rebajado</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-linear-to-br from-rose-500 to-amber-500 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden">
          <div className="absolute right-3 top-3 h-16 w-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100">Descuento Promedio</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black">{averageDiscount}%</span>
            <span className="text-xs text-rose-100">OFF Promedio</span>
          </div>
          <p className="text-[10px] text-rose-100 mt-2">Rebaja porcentual promedio de las promociones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Individual Promotion Form & Bulk Options */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* INDIVIDUAL FORM */}
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs">
            <h4 className="font-bold text-brand-navy text-sm flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-brand-purple" />
              <span>{editingProductId ? 'Editar Promoción' : 'Crear Promoción Individual'}</span>
            </h4>

            {formError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800 mb-3 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800 mb-3">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Seleccionar Producto</label>
                <select
                  disabled={!!editingProductId}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Elige un producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price}) {p.promo_price ? '🏷️' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Precio Original:</span>
                    <span className="font-extrabold text-brand-navy">{selectedProduct.price}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Descuento (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          placeholder="Ej. 20"
                          value={discountPercentInput}
                          onChange={(e) => handleDiscountPercentChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-1.5 text-xs text-gray-850 font-bold focus:border-brand-purple focus:outline-hidden"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-bold text-gray-400">%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Precio Promocional</label>
                      <input
                        type="text"
                        placeholder="Ej. $120.000"
                        value={promoPriceInput}
                        onChange={(e) => handlePromoPriceChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-850 font-bold focus:border-brand-purple focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Percentage pills for quick select */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Descuentos Rápidos</span>
                    <div className="flex flex-wrap gap-1">
                      {PERCENTAGE_PILLS.map((pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => handleDiscountPercentChange(pill)}
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                            discountPercentInput === pill
                              ? 'border-brand-purple bg-brand-purple text-white shadow-xs'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {pill}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId('');
                      setEditingProductId(null);
                      setPromoPriceInput('');
                      setDiscountPercentInput('');
                    }}
                    className="rounded-lg bg-gray-150 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-650 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedProductId}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-navy hover:bg-brand-blue text-white px-5 py-2 text-xs font-bold transition active:scale-95 shadow-md shadow-brand-navy/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Guardando...' : editingProductId ? 'Guardar Cambios' : 'Aplicar Promoción'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* BULK ACTIONS PANEL */}
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-brand-navy text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span>Descuentos Masivos</span>
            </h4>

            {bulkError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            {bulkSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800">
                {bulkSuccess}
              </div>
            )}

            {/* Bulk discount by category form */}
            <form onSubmit={handleApplyBulkDiscount} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Seleccionar Categoría</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden cursor-pointer"
                >
                  <option value="Todos">Todos los Productos</option>
                  <option value="Tecnología">Tecnología</option>
                  <option value="Hogar y Cocina">Hogar y Cocina</option>
                  <option value="Moda">Moda</option>
                  <option value="Belleza">Belleza</option>
                  <option value="Novedades">Novedades</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Porcentaje de Descuento</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    placeholder="Ej. 15"
                    value={bulkDiscountPercent}
                    onChange={(e) => setBulkDiscountPercent(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-200 bg-white pl-3 pr-7 py-2.5 text-xs text-gray-850 font-bold focus:border-brand-purple focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">%</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBulkSubmitting || bulkDiscountPercent === ''}
                className="w-full flex h-10 items-center justify-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition active:scale-95 shadow-sm shadow-orange-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Aplicar a la Categoría</span>
              </button>
            </form>

            {/* Clear all promotions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Zona de Peligro</span>
              
              {!showClearAllConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(true)}
                  className="w-full flex h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar Todas las Promociones</span>
                </button>
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-2 text-center">
                  <span className="text-[10px] font-bold text-rose-800 block">¿Confirmas que deseas borrar todos los descuentos?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClearAllConfirm(false)}
                      className="flex-1 rounded bg-white border border-gray-250 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleClearAllPromotions}
                      className="flex-1 rounded bg-rose-600 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                    >
                      Sí, Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Table of active promotions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
              <h4 className="font-bold text-brand-navy text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                <span>Ofertas y Promociones Activas ({totalPromotions})</span>
              </h4>

              {/* Mini Search box */}
              <input
                type="text"
                placeholder="Buscar promoción..."
                value={searchPromo}
                onChange={(e) => setSearchPromo(e.target.value)}
                className="w-full sm:w-60 h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 focus:border-brand-purple focus:outline-hidden"
              />
            </div>

            {filteredPromoProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-2">
                <Tag className="h-10 w-10 text-gray-300" />
                <p className="text-xs font-medium">No hay promociones activas que coincidan con la búsqueda.</p>
                <p className="text-[10px]">Crea una promoción en el panel lateral.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Categoría</th>
                      <th className="px-4 py-3 text-right">Precio Original</th>
                      <th className="px-4 py-3 text-right">Precio Promo</th>
                      <th className="px-4 py-3 text-center">Descuento</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-650">
                    {filteredPromoProducts.map((p) => {
                      const discount = calculateDiscountPercent(p.price, p.promo_price);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          {/* Product details */}
                          <td className="px-4 py-3.5 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md overflow-hidden border border-gray-150 bg-gray-50 shrink-0">
                              <img src={p.images?.[0] || ''} alt="" className="h-full w-full object-cover" />
                            </div>
                            <span className="font-bold text-gray-800 line-clamp-1">{p.name}</span>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600 uppercase">
                              {p.category}
                            </span>
                          </td>

                          {/* Original price */}
                          <td className="px-4 py-3.5 text-right font-medium text-gray-400 line-through">
                            {p.price}
                          </td>

                          {/* Promo price */}
                          <td className="px-4 py-3.5 text-right font-extrabold text-rose-600">
                            {p.promo_price}
                          </td>

                          {/* Calculated discount percent badge */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-100">
                              {discount}% OFF
                            </span>
                          </td>

                          {/* Action icons */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setEditingProductId(p.id);
                                }}
                                className="rounded-full p-1.5 text-brand-blue hover:bg-brand-blue/10 transition-colors"
                                title="Editar Promoción"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemovePromo(p.id)}
                                className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Quitar Promoción"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
