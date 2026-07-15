/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sanitizes a string by removing HTML tags, angle brackets, and capping length to prevent XSS.
 */
export function sanitizeString(str: string, maxLength = 500): string {
  if (!str) return '';
  // Remove HTML tags
  let sanitized = str.replace(/<[^>]*>/g, '');
  // Remove individual angle brackets and replace with safe characters or empty
  sanitized = sanitized.replace(/[<>]/g, '');
  // Trim and limit length
  return sanitized.substring(0, maxLength).trim();
}

/**
 * Sanitizes a phone number, allowing only numbers, spaces, plus '+', and hyphen '-' characters.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  // Remove any character that is not a digit, space, '+' or '-'
  return phone.replace(/[^\d\s\+\-]/g, '').substring(0, 20).trim();
}

/**
 * Caps the total amount of an order to a maximum safe limit (e.g., $50,000,000 COP)
 * to prevent numerical overflow or malicious pricing manipulations.
 */
export function sanitizeTotalAmount(amount: number, maxLimit = 50000000): number {
  if (isNaN(amount) || amount < 0) return 0;
  return Math.min(amount, maxLimit);
}

interface SafeStorageEnvelope<T> {
  value: T;
  expiresAt: number | null; // null means no expiration
}

/**
 * Writes data safely to localStorage with an optional expiration time in days.
 */
export function writeSafeLocalStorage<T>(key: string, value: T, expireInDays?: number): void {
  try {
    const expiresAt = expireInDays ? Date.now() + expireInDays * 24 * 60 * 60 * 1000 : null;
    const envelope: SafeStorageEnvelope<T> = { value, expiresAt };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (e) {
    console.error('Error writing to safe localStorage:', e);
  }
}

/**
 * Reads and validates data from localStorage, ensuring it has not expired,
 * and recursively sanitizes any string fields inside to protect against manual DevTools injection.
 */
export function readSafeLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;

    const envelope: SafeStorageEnvelope<T> = JSON.parse(raw);

    // Check expiration
    if (envelope.expiresAt && Date.now() > envelope.expiresAt) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    // Apply sanitization recursively to strings in the returned value
    return deepSanitize(envelope.value) as T;
  } catch (e) {
    console.error('Error reading from safe localStorage:', e);
    return defaultValue;
  }
}

/**
 * Recursively scans and sanitizes strings inside objects or arrays.
 */
function deepSanitize(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    return sanitizeString(val);
  }
  if (Array.isArray(val)) {
    return val.map(deepSanitize);
  }
  if (typeof val === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      sanitizedObj[key] = deepSanitize(val[key]);
    }
    return sanitizedObj;
  }
  return val;
}

export const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  'Tecnología': 'Experimenta la mejor tecnología con este producto diseñado para ofrecerte un alto rendimiento, durabilidad excepcional y la última innovación en su categoría. Ideal para uso diario o profesional.',
  'Hogar y Cocina': 'El complemento perfecto para tu hogar. Combina funcionalidad, diseño moderno y materiales de alta calidad para facilitar tus tareas diarias y darle un toque especial a tus espacios.',
  'Moda': 'Prenda o accesorio de diseño exclusivo y actual. Fabricado con materiales cómodos y duraderos, ideales para complementar tu estilo en cualquier ocasión con total comodidad.',
  'Belleza': 'Fórmula premium e ingredientes seleccionados especialmente para el cuidado personal. Diseñado para realzar tu belleza natural y ofrecerte una experiencia de cuidado única y saludable.',
  'Novedades': 'Descubre el artículo más innovador y sorprendente del momento. Un producto único y práctico que no encontrarás en ningún otro lugar, perfecto para regalar o consentirte.'
};

