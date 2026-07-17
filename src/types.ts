/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductVariant {
  name: string;
  price: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  price: string; // e.g., "$15.000" or similar
  category: string; // e.g., "Tecnología", "Hogar y Cocina", "Moda", "Belleza", "Novedades"
  stock: number;
  description: string;
  images: string[]; // JSONB array of strings/URLs
  variants: ProductVariant[]; // JSONB array of variant objects
  created_at?: string;
  promo_price?: string;
}

export interface VIPMember {
  id: string;
  name: string;
  whatsapp: string;
  created_at?: string;
}

export interface OrderCartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
  selectedVariant?: ProductVariant;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  payment_method: string;
  items: OrderCartItem[]; // JSONB array of items
  total_amount: number; // numeric total
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at?: string;
}
