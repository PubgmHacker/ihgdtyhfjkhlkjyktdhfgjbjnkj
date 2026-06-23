/**
 * SOULDAWN — промокоды (серверная валидация). Совпадает с PROMO_CODES бота.
 * Процент скидки по коду.
 */
export const PROMO_CODES: Record<string, number> = {
  SOULDAWN10: 10,
  WELCOME15: 15,
  DROP20: 20,
};

export interface PromoResult {
  valid: boolean;
  code?: string;
  discount_percent?: number;
  discount_kopecks?: number;
  total_after_discount?: number;
  error?: string;
}

/** total — в копейках. */
export function applyPromo(rawCode: string, total: number): PromoResult {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { valid: false, error: "Введите промокод" };
  const pct = PROMO_CODES[code];
  if (pct === undefined) return { valid: false, error: "Промокод не найден" };
  const discount = Math.floor((total * pct) / 100);
  return {
    valid: true,
    code,
    discount_percent: pct,
    discount_kopecks: discount,
    total_after_discount: total - discount,
  };
}
