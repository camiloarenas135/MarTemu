/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Instagram, Facebook } from 'lucide-react';

interface FooterProps {
  onNavigateShop: () => void;
}

export default function Footer({ onNavigateShop }: FooterProps) {
  return (
    <footer className="bg-brand-navy text-gray-300 pb-16 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          
          {/* Acerca de MarTemu */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-blue font-heading">
              Acerca de MarTemu
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={onNavigateShop}
                  className="hover:text-white transition-colors duration-200"
                >
                  Nuestra Tienda
                </button>
              </li>
              <li>
                <span className="text-gray-400">Garantía de Calidad</span>
              </li>
            </ul>
          </div>

          {/* Atención al Cliente */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-blue font-heading">
              Atención al Cliente
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://wa.me/573042564311"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200"
                >
                  Contacto
                </a>
              </li>
              <li>
                <span className="text-gray-400">Política de Devolución</span>
              </li>
              <li>
                <span className="text-gray-400">Envíos</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-blue font-heading">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-gray-400">Términos y Condiciones</span>
              </li>
              <li>
                <span className="text-gray-400">Política de Privacidad</span>
              </li>
              <li>
                <span className="text-gray-400">Cookies</span>
              </li>
            </ul>
          </div>

          {/* Síguenos */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-blue font-heading">
              Síguenos
            </h4>
            <div className="flex items-center gap-5">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/martemushop?igsh=YjR5cHh3MGZ5dGQw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#e1306c] transition-all duration-200 hover:scale-110 active:scale-95"
                title="Instagram"
              >
                <Instagram className="h-5.5 w-5.5" />
              </a>
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@martemu0?_r=1&_t=ZS-97jXK9KdBlV"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
                title="TikTok"
              >
                <svg className="h-5.5 w-5.5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.7a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.13z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://www.facebook.com/miguel.angelsoto.731"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#1877f2] transition-all duration-200 hover:scale-110 active:scale-95"
                title="Facebook"
              >
                <Facebook className="h-5.5 w-5.5" />
              </a>
              {/* WhatsApp */}
              <a
                href="https://wa.me/573042564311"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#25d366] transition-all duration-200 hover:scale-110 active:scale-95"
                title="WhatsApp"
              >
                <svg className="h-5.5 w-5.5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </a>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-50">
              Lo que buscas, lo que te encanta.
            </p>
          </div>

        </div>

      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} MarTemu. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
