/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, Trash2, Smartphone, AlertTriangle, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VIPMember } from '../types';
import { supabase } from '../lib/supabase';

interface AdminCustomersProps {
  vipMembers: VIPMember[];
  onRefresh: () => void;
}

export default function AdminCustomers({ vipMembers, onRefresh }: AdminCustomersProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredVIP = vipMembers.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return member.name.toLowerCase().includes(searchLower) ||
           member.whatsapp.includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredVIP.length / itemsPerPage);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedVIP = filteredVIP.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteVIP = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(true);
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('vip_members')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) {
        throw error;
      }

      onRefresh(); // Trigger data reload in parent
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error deleting client:', err);
      setErrorMessage(err.message || 'Error al eliminar el cliente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6" id="admin-vip-tab">
      
      {/* Title & Refresh */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-purple" />
          <h3 className="text-lg font-black text-brand-navy">Listado de Clientes</h3>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-lg p-2 hover:bg-gray-100 transition cursor-pointer"
          title="Sincronizar Clientes"
        >
          <RefreshCw className="h-4 w-4 text-gray-500 hover:rotate-45 transition-transform" />
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por nombre o WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-850 focus:border-brand-purple focus:outline-hidden font-medium"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* VIP Members list table */}
      {filteredVIP.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-center p-6" id="empty-vip-view">
          <Users className="h-10 w-10 text-brand-purple/45 mb-3" />
          <h4 className="text-sm font-bold text-gray-700">No se encontraron clientes</h4>
          <p className="text-xs text-gray-400 max-w-sm mt-1">
            Los datos de tus clientes se recopilarán automáticamente cuando realicen una compra en la tienda.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/70 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Número de WhatsApp</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Fecha de Registro</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                {paginatedVIP.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition">
                    {/* Name */}
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {member.name}
                    </td>
 
                    {/* WhatsApp */}
                    <td className="px-6 py-4 flex items-center gap-1.5 font-semibold text-gray-700">
                      <Smartphone className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`https://api.whatsapp.com/send?phone=${member.whatsapp.replace(/[^\d]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="hover:text-brand-blue hover:underline font-mono"
                      >
                        {member.whatsapp}
                      </a>
                    </td>
 
                    {/* Registration Date */}
                    <td className="px-6 py-4 text-gray-400 hidden sm:table-cell">
                      {formatDate(member.created_at)}
                    </td>
 
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteConfirmId(member.id)}
                        className="rounded-full p-2 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
              <div className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-800">{paginatedVIP.length}</span> de <span className="font-bold text-gray-800">{filteredVIP.length}</span> clientes
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-650 px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>
                <span className="text-xs font-bold text-gray-650 bg-gray-550/10 px-3 py-1.5 rounded-lg border border-gray-150">
                  Pág. {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-650 px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CUSTOM REACT CONFIRMATION MODAL FOR DELETION */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
              id="confirm-delete-vip"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                </div>
                
                <div>
                  <h4 className="text-sm font-black text-brand-navy">¿Eliminar Cliente?</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Esta acción eliminará de forma irreversible los datos de este cliente de la base de datos de Supabase.
                  </p>
                </div>

                <div className="w-full flex gap-3 pt-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition cursor-pointer"
                  >
                    Mantener
                  </button>
                  <button
                    onClick={handleDeleteVIP}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {isDeleting ? 'Borrando...' : 'Sí, Eliminar'}
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
