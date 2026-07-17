/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parses numeric value from a Colombian Peso (COP) price string.
 * Example: "$189.900" -> 189900
 */
export function parseCOP(priceStr: string | undefined | null): number {
  if (!priceStr) return 0;
  const numeric = parseInt(priceStr.replace(/[^\d]/g, ''), 10);
  return isNaN(numeric) ? 0 : numeric;
}

/**
 * Formats a numeric value into a COP price string.
 * Example: 189900 -> "$189.900"
 */
export function formatCOP(val: number): string {
  if (val < 0 || isNaN(val)) return '$0';
  return '$' + Math.round(val).toLocaleString('es-CO').replace(/,/g, '.');
}

/**
 * Calculates the discount percentage between original price and promotional price.
 * Example: original "$100.000", promo "$75.000" -> 25
 */
export function calculateDiscountPercent(originalPrice: string, promoPrice: string | undefined | null): number {
  if (!promoPrice) return 0;
  const orig = parseCOP(originalPrice);
  const promo = parseCOP(promoPrice);
  if (orig <= 0 || promo <= 0 || promo >= orig) return 0;
  return Math.round(((orig - promo) / orig) * 100);
}

/**
 * Calculates a proportional promotional price for a product variant.
 * Example: If base product has 20% discount, the variant's original price is discounted by 20% too.
 */
export function getVariantPromoPrice(originalPrice: string, promoPrice: string | undefined | null, variantPrice: string): string {
  if (!promoPrice) return variantPrice;
  const orig = parseCOP(originalPrice);
  const promo = parseCOP(promoPrice);
  const varOrig = parseCOP(variantPrice);
  
  if (orig <= 0 || promo <= 0 || promo >= orig || varOrig <= 0) {
    return variantPrice;
  }
  
  const ratio = promo / orig;
  const varPromo = Math.round(varOrig * ratio);
  return formatCOP(varPromo);
}
