/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Product, Order, VIPMember } from '../types';

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Retrieve credentials from Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Real Supabase Client (only instantiated if credentials exist)
const realSupabase = isRealSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

/**
 * INITIAL MOCK DATA
 * We populate high-quality default items to ensure a visually rich initial catalog state.
 */
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Audífonos Bluetooth Premium ANC',
    price: '$189.900',
    category: 'Tecnología',
    stock: 12,
    description: 'Experimenta un sonido de alta fidelidad con cancelación activa de ruido (ANC) inteligente, diseño ergonómico de cuero proteico y hasta 40 horas de autonomía continua. Ideal para tus viajes o jornadas de trabajo.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { name: 'Negro Estelar', price: '$189.900' },
      { name: 'Plata Glaciar', price: '$199.900' }
    ],
    promo_price: '$149.900'
  },
  {
    id: 'prod-2',
    name: 'Cafetera de Goteo Minimalista',
    price: '$124.900',
    category: 'Hogar y Cocina',
    stock: 8,
    description: 'Prepara el café de tus sueños con esta cafetera de goteo de diseño escandinavo. Cuenta con jarra de vidrio de borosilicato resistente al calor, filtro reutilizable de acero inoxidable y regulador de temperatura exacto.',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { name: 'Blanco Mate', price: '$124.900' },
      { name: 'Negro Carbón', price: '$124.900' }
    ]
  },
  {
    id: 'prod-3',
    name: 'Chaqueta Impermeable Urbana',
    price: '$159.900',
    category: 'Ropa',
    stock: 15,
    description: 'Chaqueta de corte aerodinámico, impermeable y cortavientos con costuras termoselladas. Diseñada para protegerte de climas lluviosos sin perder la transpirabilidad ni el estilo urbano característico.',
    images: [
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { name: 'Talla M - Azul Marino', price: '$159.900' },
      { name: 'Talla L - Azul Marino', price: '$159.900' },
      { name: 'Talla L - Verde Oliva', price: '$169.900' }
    ]
  },
  {
    id: 'prod-4',
    name: 'Sérum Hidratante Ácido Hialurónico',
    price: '$79.900',
    category: 'Belleza',
    stock: 3,
    description: 'Sérum facial ultra concentrado de absorción rápida que restaura la barrera natural de la piel. Con ácido hialurónico puro de tres pesos moleculares y vitamina B5 para un efecto de relleno hidratante inmediato.',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { name: 'Frasco 30ml', price: '$79.900' }
    ],
    promo_price: '$59.900'
  },
  {
    id: 'prod-5',
    name: 'Lámpara de Luna Flotante Magnética',
    price: '$249.900',
    category: 'Novedades',
    stock: 0, // Out of stock to test indicators and stats!
    description: 'Asombrosa lámpara decorativa lunar que flota e imita la gravedad flotando en el aire. Cuenta con luz LED táctil regulable en 3 tonalidades y utiliza tecnología de levitación electromagnética patentada.',
    images: [
      'https://images.unsplash.com/photo-1532009877282-3340270e0529?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { name: 'Estándar Levitante', price: '$249.900' }
    ]
  },
  {
    id: 'prod-6',
    name: 'Reloj Inteligente ActiveFit Pro',
    price: '$199.900',
    category: 'Tecnología',
    stock: 2, // Critical stock! (<= 3)
    description: 'Smartwatch avanzado con sensor de frecuencia cardíaca continuo, saturación de oxígeno, GPS autónomo y resistencia al agua de hasta 5 ATM. Incluye 24 modos deportivos y batería de larga duración (14 días).',
    images: [
      'https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { name: 'Correa Silicona Negra', price: '$199.900' },
      { name: 'Correa Silicona Verde', price: '$199.900' }
    ]
  }
];

const DEFAULT_VIP: VIPMember[] = [
  { id: 'vip-1', name: 'Laura Mendoza', whatsapp: '+573102345678', created_at: '2026-06-30T10:00:00.000Z' },
  { id: 'vip-2', name: 'Carlos Andrés Gómez', whatsapp: '+573159876543', created_at: '2026-07-01T15:30:00.000Z' }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-1',
    customer_name: 'Santiago Martínez',
    customer_phone: '3124567890',
    delivery_address: 'Cra 45 #26-85, Barrio El Poblado, Medellín',
    payment_method: 'Nequi',
    items: [
      {
        id: 'prod-1',
        name: 'Audífonos Bluetooth Premium ANC',
        price: '$189.900',
        quantity: 1,
        selectedVariant: { name: 'Negro Estelar', price: '$189.900' }
      }
    ],
    total_amount: 189900,
    status: 'pending',
    created_at: '2026-07-02T18:45:00.000Z'
  },
  {
    id: 'ord-2',
    customer_name: 'Diana Marcela Castro',
    customer_phone: '3201234567',
    delivery_address: 'Calle 100 #15-20, Apto 502, Bogotá',
    payment_method: 'Efectivo',
    items: [
      {
        id: 'prod-4',
        name: 'Sérum Hidratante Ácido Hialurónico',
        price: '$79.900',
        quantity: 2,
        selectedVariant: { name: 'Frasco 30ml', price: '$79.900' }
      }
    ],
    total_amount: 159800,
    status: 'confirmed',
    created_at: '2026-07-03T09:15:00.000Z'
  }
];

// LocalStorage Helper for simulated database
const getStorageData = <T>(key: string, initial: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initial;
  }
};

const setStorageData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

/**
 * SIMULATED DB ENGINE (Strictly mirrors Supabase tables in LocalStorage)
 */
export const mockDb = {
  getProducts: () => getStorageData<Product[]>('martemu_products', DEFAULT_PRODUCTS),
  setProducts: (products: Product[]) => setStorageData('martemu_products', products),
  
  getVIP: () => getStorageData<VIPMember[]>('martemu_vip', DEFAULT_VIP),
  setVIP: (vip: VIPMember[]) => setStorageData('martemu_vip', vip),
  
  getOrders: () => getStorageData<Order[]>('martemu_orders', DEFAULT_ORDERS),
  setOrders: (orders: Order[]) => setStorageData('martemu_orders', orders),
};

/**
 * SUPABASE MOCK CLIENT PROXY
 * This acts as a drop-in replacement for Supabase client when real API keys aren't provided.
 */
export const mockSupabaseClient = {
  from: (table: string) => {
    return {
      select: (columns = '*') => {
        return {
          then: (callback: (result: { data: any[] | null; error: any }) => void) => {
            let data: any[] = [];
            if (table === 'products') data = mockDb.getProducts();
            else if (table === 'orders') data = mockDb.getOrders();
            else if (table === 'vip_members') data = mockDb.getVIP();
            
            // Return sorted by created_at desc or ID
            data = [...data].reverse();
            
            callback({ data, error: null });
            return Promise.resolve({ data, error: null });
          }
        };
      },
      insert: (record: any) => {
        return {
          then: (callback: (result: { data: any | null; error: any }) => void) => {
            const newRecord = { ...record, id: record.id || `gen-${Math.random().toString(36).substr(2, 9)}`, created_at: new Date().toISOString() };
            if (table === 'products') {
              const current = mockDb.getProducts();
              mockDb.setProducts([...current, newRecord]);
            } else if (table === 'orders') {
              const current = mockDb.getOrders();
              mockDb.setOrders([...current, newRecord]);
            } else if (table === 'vip_members') {
              const current = mockDb.getVIP();
              mockDb.setVIP([...current, newRecord]);
            }
            callback({ data: newRecord, error: null });
            return Promise.resolve({ data: newRecord, error: null });
          }
        };
      },
      update: (updates: any) => {
        return {
          eq: (field: string, val: any) => {
            return {
              then: (callback: (result: { data: any | null; error: any }) => void) => {
                let updatedRecord: any = null;
                if (table === 'products') {
                  const current = mockDb.getProducts();
                  const updated = current.map((p) => {
                    if (p[field as keyof Product] === val) {
                      updatedRecord = { ...p, ...updates };
                      return updatedRecord;
                    }
                    return p;
                  });
                  mockDb.setProducts(updated);
                } else if (table === 'orders') {
                  const current = mockDb.getOrders();
                  const updated = current.map((o) => {
                    if (o[field as keyof Order] === val) {
                      updatedRecord = { ...o, ...updates };
                      return updatedRecord;
                    }
                    return o;
                  });
                  mockDb.setOrders(updated);
                } else if (table === 'vip_members') {
                  const current = mockDb.getVIP();
                  const updated = current.map((v) => {
                    if (v[field as keyof VIPMember] === val) {
                      updatedRecord = { ...v, ...updates };
                      return updatedRecord;
                    }
                    return v;
                  });
                  mockDb.setVIP(updated);
                }
                callback({ data: updatedRecord, error: null });
                return Promise.resolve({ data: updatedRecord, error: null });
              }
            };
          }
        };
      },
      delete: () => {
        return {
          eq: (field: string, val: any) => {
            return {
              then: (callback: (result: { data: any | null; error: any }) => void) => {
                if (table === 'products') {
                  const current = mockDb.getProducts();
                  mockDb.setProducts(current.filter((p) => p[field as keyof Product] !== val));
                } else if (table === 'orders') {
                  const current = mockDb.getOrders();
                  mockDb.setOrders(current.filter((o) => o[field as keyof Order] !== val));
                } else if (table === 'vip_members') {
                  const current = mockDb.getVIP();
                  mockDb.setVIP(current.filter((v) => v[field as keyof VIPMember] !== val));
                }
                callback({ data: true, error: null });
                return Promise.resolve({ data: true, error: null });
              }
            };
          }
        };
      }
    };
  },
  auth: {
    getSession: () => {
      const storedSession = localStorage.getItem('martemu_admin_session');
      if (storedSession) {
        return Promise.resolve({ data: { session: JSON.parse(storedSession) }, error: null });
      }
      return Promise.resolve({ data: { session: null }, error: null });
    },
    signInWithPassword: ({ email, password }: any) => {
      // For mock authentication, allow standard demo emails or is_admin match.
      // Let's create a user structure that looks exactly like Supabase User.
      if (email.includes('admin') || email === 'camiloarenas135@gmail.com') {
        const mockSession = {
          user: {
            id: 'admin-usr-uuid',
            email,
            user_metadata: { role: 'admin' },
          },
          access_token: 'mock-jwt-token'
        };
        localStorage.setItem('martemu_admin_session', JSON.stringify(mockSession));
        return Promise.resolve({ data: mockSession, error: null });
      }
      return Promise.resolve({ data: null, error: { message: 'Credenciales inválidas. Usa un correo que contenga "admin" o el correo autorizado para probar.' } });
    },
    signInWithOAuth: ({ provider, options }: any) => {
      if (provider === 'google') {
        const mockSession = {
          user: {
            id: 'admin-usr-uuid',
            email: 'camiloarenas135@gmail.com',
            user_metadata: { role: 'admin' },
          },
          access_token: 'mock-jwt-token'
        };
        localStorage.setItem('martemu_admin_session', JSON.stringify(mockSession));
        // Return success and reload to trigger session pickup
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return Promise.resolve({ data: { provider: 'google', url: '#' }, error: null });
      }
      return Promise.resolve({ data: null, error: { message: 'Provider no soportado' } });
    },
    signOut: () => {
      localStorage.removeItem('martemu_admin_session');
      return Promise.resolve({ error: null });
    },
    onAuthStateChange: (callback: any) => {
      // In simulated mode, trigger the callback with current session on subscribe
      const storedSession = localStorage.getItem('martemu_admin_session');
      const session = storedSession ? JSON.parse(storedSession) : null;
      callback('SIGNED_IN', session);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  storage: {
    from: (bucket: string) => {
      return {
        upload: (path: string, file: File) => {
          // Mock uploading by returning a local mock URL (dataURL or Unsplash random matching)
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                data: { path },
                error: null,
                publicUrl: reader.result as string
              });
            };
            reader.readAsDataURL(file);
          });
        },
        getPublicUrl: (path: string) => {
          // If the path is a dataURI or full URL, return it directly
          if (path.startsWith('data:') || path.startsWith('http')) {
            return { data: { publicUrl: path } };
          }
          // Return a placeholder matching product image
          return { data: { publicUrl: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80` } };
        }
      };
    }
  }
};

/**
 * UNIFIED SUPABASE EXPORT
 * Automatically selects real client if configured, or fallback mock client otherwise.
 */
export const supabase = realSupabase || (mockSupabaseClient as any);
export default supabase;
