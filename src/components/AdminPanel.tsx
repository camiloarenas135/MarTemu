/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, ClipboardList, Package, LogOut, RefreshCw, Users, Percent } from 'lucide-react';
import { supabase, isRealSupabaseConfigured } from '../lib/supabase';
import { Product, Order, VIPMember } from '../types';
import AdminOrders from './AdminOrders';
import AdminCatalog from './AdminCatalog';
import AdminStats from './AdminStats';
import AdminCustomers from './AdminCustomers';
import AdminPromotions from './AdminPromotions';

interface AdminPanelProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export default function AdminPanel({ products, onRefreshProducts }: AdminPanelProps) {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Tab Management
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'orders' | 'catalog' | 'vip' | 'promotions'>(() => {
    const saved = sessionStorage.getItem('admin_active_subtab');
    return (saved as any) || 'stats';
  });

  useEffect(() => {
    sessionStorage.setItem('admin_active_subtab', activeSubTab);
  }, [activeSubTab]);
  
  // Database data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [vipMembers, setVipMembers] = useState<VIPMember[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Redirection states
  const [forceEditProduct, setForceEditProduct] = useState<Product | null>(null);

  // Check auth session on load & setup auth state listener
  useEffect(() => {
    const allowedEmails = ['camiloarenas135@gmail.com', 'martemushop@gmail.com'];
    
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        const userEmail = data.session.user?.email;
        if (allowedEmails.includes(userEmail)) {
          setSession(data.session);
        } else {
          await supabase.auth.signOut();
          setSession(null);
          setErrorMsg('Acceso denegado: Tu cuenta no está autorizada para administrar esta tienda.');
        }
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession) {
        const userEmail = currentSession.user?.email;
        if (allowedEmails.includes(userEmail)) {
          setSession(currentSession);
          setErrorMsg('');
        } else {
          await supabase.auth.signOut();
          setSession(null);
          setErrorMsg('Acceso denegado: Tu cuenta no está autorizada para administrar esta tienda.');
        }
      } else {
        setSession(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch admin data on session load
  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session]);

  const fetchAdminData = async () => {
    setIsDataLoading(true);
    try {
      // 1. Fetch Orders from Supabase
      const { data: ordersData } = await supabase.from('orders').select('*');
      if (ordersData) setOrders(ordersData);

      // 2. Fetch VIP members from Supabase
      const { data: vipData } = await supabase.from('vip_members').select('*');
      if (vipData) setVipMembers(vipData);

      // 3. Refresh parent products list
      onRefreshProducts();
    } catch (err) {
      console.error('Error loading admin tables:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(err.message || 'Error al iniciar sesión con Google.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Cross-tab redirection handler: clicks Out of Stock item and redirects to Catalog Edit
  const handleRedirectToEdit = (product: Product) => {
    setForceEditProduct(product);
    setActiveSubTab('catalog');
  };

  if (!session) {
    // Elegant Admin Login UI
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f8f9fa] px-4 py-12" id="admin-login-screen">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-gray-150 shadow-xl relative overflow-hidden">
          
          {/* Decorative design corner */}
          <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-brand-purple via-brand-blue to-brand-navy"></div>

          <div className="text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-white">
              <Shield className="h-6 w-6 text-brand-blue" />
            </div>
            <h2 className="text-2xl font-black text-brand-navy tracking-tight font-heading">Panel de Control MarTemu</h2>
            <p className="text-xs text-gray-400">
              Acceso exclusivo para administradores autorizados.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all flex items-center justify-center gap-3 border border-gray-250 shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{isLoading ? 'Iniciando sesión...' : 'Continuar con Google'}</span>
            </button>

            {!isRealSupabaseConfigured && (
              <p className="text-[10px] text-amber-600 text-center font-medium bg-amber-50 rounded-lg p-2.5 border border-amber-100 leading-relaxed">
                <strong>Modo Simulado Activo:</strong> El botón iniciará sesión automáticamente como <code className="bg-white/70 px-1 rounded font-mono">camiloarenas135@gmail.com</code> para pruebas locales.
              </p>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Dashboard layout
  return (
    <div className="bg-gray-50 min-h-screen py-8" id="admin-dashboard-container">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
         {/* Simplified Admin Dashboard Header & Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-xs mb-8" id="admin-header-nav">
          
          {/* Left: Navigation tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubTab('stats')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeSubTab === 'stats'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => setActiveSubTab('orders')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeSubTab === 'orders'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Pedidos ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('catalog')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeSubTab === 'catalog'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-gray-550 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Catálogo ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('promotions')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeSubTab === 'promotions'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-gray-555 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <Percent className="h-4 w-4" />
              <span>Promociones ({products.filter(p => p.promo_price).length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('vip')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeSubTab === 'vip'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Clientes ({vipMembers.length})</span>
            </button>
          </div>

          {/* Right: Actions and user session info */}
          <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
            <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 font-medium">
              Admin: <strong className="text-gray-700 font-semibold">{session.user?.email}</strong>
            </span>
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            
            <button
              onClick={fetchAdminData}
              disabled={isDataLoading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-gray-600 px-3.5 py-2 text-xs font-bold transition cursor-pointer"
              title="Sincronizar Datos"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isDataLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-3.5 py-2 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
        
        {/* Active Tab Screen render */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs min-h-[50vh]">
          {isDataLoading && (
            <div className="flex items-center justify-center h-64">
              <span className="text-xs font-bold text-gray-400 animate-pulse">Sincronizando tablas...</span>
            </div>
          )}

          {!isDataLoading && activeSubTab === 'stats' && (
            <AdminStats products={products} onRedirectToEdit={handleRedirectToEdit} />
          )}

          {!isDataLoading && activeSubTab === 'orders' && (
            <AdminOrders orders={orders} products={products} onRefresh={fetchAdminData} />
          )}

          {!isDataLoading && activeSubTab === 'catalog' && (
            <AdminCatalog 
              products={products} 
              onRefresh={fetchAdminData} 
              forceEditProduct={forceEditProduct}
              onClearForceEdit={() => setForceEditProduct(null)}
            />
          )}

          {!isDataLoading && activeSubTab === 'promotions' && (
            <AdminPromotions 
              products={products} 
              onRefresh={fetchAdminData} 
            />
          )}

          {!isDataLoading && activeSubTab === 'vip' && (
            <AdminCustomers vipMembers={vipMembers} onRefresh={fetchAdminData} />
          )}
        </div>

      </div>
    </div>
  );
}
