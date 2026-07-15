/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BarChart3, AlertOctagon, Layers, BadgeDollarSign, ArrowUpRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface AdminStatsProps {
  products: Product[];
  onRedirectToEdit: (product: Product) => void;
}

export default function AdminStats({ products, onRedirectToEdit }: AdminStatsProps) {
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);

  // 1. CALCULATE KPIs DYNAMICALLY
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  
  const outOfStockItems = products.filter((p) => p.stock === 0);
  const outOfStockCount = outOfStockItems.length;

  const totalInventoryValue = products.reduce((acc, p) => {
    // Parse prices such as "$189.900" or "189900" into numeric 189900
    const numericPrice = parseInt(p.price.replace(/[^\d]/g, ''), 10) || 0;
    return acc + (numericPrice * p.stock);
  }, 0);

  // Group stock data by categories for table
  const categoryStats = products.reduce((acc: Record<string, { total: number; count: number; items: Product[] }>, p) => {
    if (!acc[p.category]) {
      acc[p.category] = { total: 0, count: 0, items: [] };
    }
    acc[p.category].total += p.stock;
    acc[p.category].count += 1;
    acc[p.category].items.push(p);
    return acc;
  }, {});

  const formatCurrency = (val: number) => {
    return '$' + val.toLocaleString('es-CO');
  };

  return (
    <div className="space-y-6" id="admin-stats-tab">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-150 pb-5">
        <BarChart3 className="h-5 w-5 text-brand-blue" />
        <h3 className="text-lg font-black text-brand-navy">Análisis de Inventario &amp; Estadísticas</h3>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="kpi-cards-grid">
        
        {/* Total Stock Units Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Existencias Totales</span>
            <span className="text-2xl font-black text-brand-navy">{totalStockUnits}</span>
            <span className="text-[10px] text-gray-500 block">Unidades físicas listas en tienda</span>
          </div>
          <div className="bg-blue-50 text-blue-600 rounded-xl p-3">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Inventory Valuation pesos Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Valorización del Catálogo</span>
            <span className="text-2xl font-black text-brand-purple">{formatCurrency(totalInventoryValue)}</span>
            <span className="text-[10px] text-gray-500 block">Monto total estimado de inventario</span>
          </div>
          <div className="bg-purple-50 text-purple-600 rounded-xl p-3">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Out of Stock Card (WARNING COLOR & TRIGGER CLICK) */}
        <div 
          onClick={() => {
            if (outOfStockCount > 0) setShowOutOfStockModal(true);
          }}
          className={`rounded-2xl border p-6 shadow-xs flex items-center justify-between transition-all ${
            outOfStockCount > 0 
              ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50 hover:border-rose-300 cursor-pointer' 
              : 'bg-white border-gray-100'
          }`}
          title={outOfStockCount > 0 ? "Haz clic para ver la lista de agotados y reponer stock" : ""}
          id="kpi-out-of-stock"
        >
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Artículos Agotados</span>
            <span className={`text-2xl font-black ${outOfStockCount > 0 ? 'text-rose-600' : 'text-brand-navy'}`}>
              {outOfStockCount}
            </span>
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              {outOfStockCount > 0 ? (
                <>
                  <span className="text-rose-600 font-bold underline">Hacer clic para reponer</span>
                  <ArrowUpRight className="h-3 w-3 text-rose-500" />
                </>
              ) : (
                'Catálogo saludable sin faltantes'
              )}
            </span>
          </div>
          <div className={`rounded-xl p-3 ${outOfStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
            <AlertOctagon className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* CATEGORY STOCK TABLE & SEMAPHORE */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
        <h4 className="text-xs font-black text-brand-navy uppercase tracking-wider">Salud de Stock por Categorías</h4>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Total Artículos</th>
                <th className="px-6 py-4">Existencias Totales</th>
                <th className="px-6 py-4">Semáforo de Salud</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
              {Object.keys(categoryStats).map((catName) => {
                const stat = categoryStats[catName];
                
                // Determine health semaphore category-wise
                const hasOutOfStock = stat.items.some(i => i.stock === 0);
                const hasCriticalStock = stat.items.some(i => i.stock > 0 && i.stock <= 3);
                
                let semaphoreText = 'Saludable';
                let semaphoreStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                
                if (hasOutOfStock) {
                  semaphoreText = 'Faltantes Críticos (Stock 0)';
                  semaphoreStyle = 'bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer';
                } else if (hasCriticalStock) {
                  semaphoreText = 'Alerta de Reposición (Stock <=3)';
                  semaphoreStyle = 'bg-amber-50 text-amber-700 border border-amber-200';
                }

                return (
                  <tr key={catName} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-gray-800">{catName}</td>
                    <td className="px-6 py-4">{stat.count} productos</td>
                    <td className="px-6 py-4 font-mono font-bold">{stat.total} unids.</td>
                    <td className="px-6 py-4">
                      <span 
                        onClick={() => {
                          if (hasOutOfStock) setShowOutOfStockModal(true);
                        }}
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${semaphoreStyle}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${
                          hasOutOfStock ? 'bg-rose-600' : hasCriticalStock ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span>{semaphoreText}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* OUT OF STOCK DETAIL MODAL (INTERACTIVE REDIRECT TO EDIT) */}
      <AnimatePresence>
        {showOutOfStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
              id="modal-out-of-stock-items"
            >
              {/* Modal Header */}
              <div className="bg-linear-to-r from-rose-600 to-brand-purple px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-rose-300" />
                  <h3 className="text-sm font-black uppercase">Artículos sin Existencias ({outOfStockCount})</h3>
                </div>
                <button 
                  onClick={() => setShowOutOfStockModal(false)}
                  className="rounded-full bg-white/10 p-1 hover:bg-white/20 text-white"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body: list */}
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                <p className="text-xs text-gray-500">
                  Haz clic en cualquiera de estos productos para ir directamente al catálogo, abrir su panel de edición y reponer existencias al instante:
                </p>

                <div className="divide-y divide-gray-150">
                  {outOfStockItems.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setShowOutOfStockModal(false);
                        onRedirectToEdit(prod);
                      }}
                      className="flex items-center gap-3 py-3 hover:bg-rose-50/50 rounded-lg px-2 cursor-pointer group transition"
                    >
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        <img src={prod.images?.[0] || ''} alt="" className="h-full w-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-800 block truncate group-hover:text-rose-600 transition">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-gray-400 block uppercase">
                          {prod.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                        <span>Reponer</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setShowOutOfStockModal(false)}
                  className="rounded-lg bg-gray-200 hover:bg-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition"
                >
                  Regresar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
