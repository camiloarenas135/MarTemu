/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Gift, Send, AlertTriangle, ShieldCheck, Check, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkRateLimit, recordAttempt } from '../utils/rateLimiter';
import { sanitizeString, sanitizePhone, writeSafeLocalStorage, readSafeLocalStorage } from '../utils/sanitize';
import { supabase } from '../lib/supabase';

interface VIPClubFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VIPClubForm({ isOpen, onClose }: VIPClubFormProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAlreadyVIP, setIsAlreadyVIP] = useState(false);

  // Check if already registered VIP from safe local storage
  useEffect(() => {
    const vipStatus = readSafeLocalStorage<boolean>('martemu_is_vip_member', false);
    setIsAlreadyVIP(vipStatus);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Check Rate Limit (Max 3 submissions per 24 hours)
    const actionKey = 'vip_club_registration';
    const limitCheck = checkRateLimit(actionKey, 3, 24 * 60 * 60 * 1000);
    
    if (limitCheck.limited) {
      const waitHours = Math.ceil((limitCheck.resetTime - Date.now()) / (1000 * 60 * 60));
      setErrorMessage(`Has excedido el límite de registros permitidos. Por favor, espera ${waitHours} horas para intentar de nuevo.`);
      return;
    }

    // 2. Sanitize Inputs
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedPhone = sanitizePhone(whatsapp);

    if (sanitizedName.length < 3) {
      setErrorMessage('Por favor, ingresa un nombre válido (mínimo 3 letras).');
      return;
    }

    if (sanitizedPhone.length < 8) {
      setErrorMessage('Por favor, ingresa un número de WhatsApp válido (mínimo 8 dígitos).');
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Write record to Supabase "vip_members" table
      const { error } = await supabase.from('vip_members').insert({
        name: sanitizedName,
        whatsapp: sanitizedPhone
      });

      if (error) {
        throw new Error(error.message || 'Error guardando registro VIP.');
      }

      // Record successful rate limiter attempt
      recordAttempt(actionKey);

      // Persist VIP status in safe local storage with a 30-day expiration check as requested
      writeSafeLocalStorage<boolean>('martemu_is_vip_member', true, 30);

      setSuccess(true);
      setIsAlreadyVIP(true);
      setName('');
      setWhatsapp('');
    } catch (err: any) {
      console.error('VIP registration error:', err);
      setErrorMessage(err.message || 'Error al procesar el registro. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribeMock = () => {
    // Allows clearing VIP status for testing
    writeSafeLocalStorage<boolean>('martemu_is_vip_member', false, -1); // Expire immediately
    setIsAlreadyVIP(false);
    setSuccess(false);
  };

  // Close VIP modal with Escape key and lock body scroll when open
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-purple-100"
            onClick={(e) => e.stopPropagation()}
            id="modal-vip-club"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-gray-100 text-gray-700 hover:bg-white transition shadow-sm active:scale-90"
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            {/* Glowing top section */}
            <div className="bg-linear-to-r from-brand-purple to-brand-blue px-6 py-8 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
              <UserPlus className="h-10 w-10 text-amber-300 mx-auto mb-3" />
              <h3 className="text-xl font-black tracking-tight uppercase">Club VIP MarTemu</h3>
              <p className="text-xs text-purple-100 mt-1 max-w-xs mx-auto">
                Desbloquea cupones exclusivos, envíos prioritarios gratis y acceso anticipado a novedades.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {isAlreadyVIP ? (
                <div className="text-center py-6 space-y-4" id="vip-active-screen">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-brand-navy">¡Ya eres un Miembro VIP MarTemu!</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Tu suscripción premium está activa y guardada de forma segura en tu navegador (válida por 30 días). Tienes acceso a todos los descuentos automáticos del catálogo.
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-[10px] text-gray-500 flex flex-col items-center">
                    <span>Beneficio Activo: <strong>10% OFF en tecnología</strong></span>
                    <button 
                      onClick={handleUnsubscribeMock}
                      className="mt-3 text-rose-500 hover:underline hover:text-rose-600 transition font-bold"
                    >
                      (Probar Registro Nuevamente)
                    </button>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full rounded-xl bg-linear-to-r from-brand-purple to-brand-blue text-xs font-bold text-white h-11 transition-all hover:shadow-md"
                  >
                    Cerrar y Ver Ofertas
                  </button>
                </div>
              ) : (
                /* VIP registration Form */
                <form onSubmit={handleSubmit} className="space-y-4" id="vip-registration-form">
                  {errorMessage && (
                    <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>¡Registro completado! Disfruta tus beneficios de inmediato.</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="vip-name" className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tu Nombre Completo</label>
                    <input
                      id="vip-name"
                      type="text"
                      placeholder="Ej. Laura Mendoza"
                      required
                      minLength={3}
                      maxLength={100}
                      aria-invalid={name.length > 0 && name.length < 3 ? 'true' : 'false'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-purple focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="vip-phone" className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">WhatsApp / Celular</label>
                    <input
                      id="vip-phone"
                      type="text"
                      placeholder="Ej. +573102345678"
                      required
                      pattern="[\+\-0-9\s]{8,20}"
                      aria-invalid={whatsapp.length > 0 && whatsapp.length < 8 ? 'true' : 'false'}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-purple focus:outline-hidden"
                    />
                  </div>

                  <div className="rounded-lg bg-purple-50/50 border border-purple-100 p-3 flex gap-2 items-start text-purple-900 text-[10px] leading-relaxed">
                    <Gift className="h-4 w-4 text-brand-purple shrink-0 mt-0.5" />
                    <div>
                      <strong>Regalo de bienvenida instantáneo:</strong> Recibirás un catálogo de cupones exclusivos directamente en tu WhatsApp para tu primera compra.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-purple to-brand-blue text-xs font-bold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? 'Inscribiendo...' : 'Inscribirse Gratis'}</span>
                  </button>
                </form>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
