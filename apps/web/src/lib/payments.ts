/**
 * Card and bank account checks for the "Add payment method" form.
 * These run in the browser for quick feedback only; the payment processor does the real validation.
 */

export type CardBrand = "Visa" | "Mastercard" | "Amex";

export const digits = (v: string) => v.replace(/\D/g, "");

export function cardBrand(number: string): CardBrand | null {
  const n = digits(number);
  if (/^4/.test(n)) return "Visa";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720))/.test(n)) return "Mastercard";
  return null;
}

/** Luhn checksum used by all card numbers. */
export function luhn(number: string): boolean {
  const n = digits(number);
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return n.length > 0 && sum % 10 === 0;
}

export function validCardNumber(number: string): string | null {
  const n = digits(number);
  const brand = cardBrand(n);
  if (!brand) return "We accept Visa, Mastercard and American Express";
  const len = brand === "Amex" ? 15 : 16;
  if (n.length !== len) return `${brand} numbers have ${len} digits`;
  if (!luhn(n)) return "Check the card number; it doesn't look right";
  return null;
}

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(v: string): string {
  const n = digits(v).slice(0, 19);
  const groups = cardBrand(n) === "Amex" ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const out: string[] = [];
  let i = 0;
  for (const g of groups) { if (i >= n.length) break; out.push(n.slice(i, i + g)); i += g; }
  return out.join(" ");
}

/** "0828" → "08/28" */
export function formatExpiry(v: string): string {
  const n = digits(v).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

export function validExpiry(v: string, now = new Date()): string | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return "Use MM/YY";
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "Month must be 01 to 12";
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  if (endOfMonth < now) return "This card has expired";
  if (year > now.getFullYear() + 20) return "Check the expiry year";
  return null;
}

export const validCvc = (cvc: string, brand: CardBrand | null) =>
  new RegExp(brand === "Amex" ? "^\\d{4}$" : "^\\d{3}$").test(cvc) ? null : `Enter the ${brand === "Amex" ? 4 : 3}-digit security code`;

/** Canadian postal code (A1A 1A1) or US ZIP (12345 or 12345-6789). */
export const validPostal = (v: string) =>
  /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.trim()) || /^\d{5}(-\d{4})?$/.test(v.trim()) ? null : "Enter a postal code (A1A 1A1) or ZIP code";

export const last4 = (v: string) => digits(v).slice(-4);
