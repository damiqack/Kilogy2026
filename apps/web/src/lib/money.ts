/**
 * The AI engine prices in USD; the dashboard displays CAD (spec 3.3).
 * Fixed prototype rate. Replace with a live FX feed in the Pricing Service.
 */
export const USD_TO_CAD = 1.37;

export const cad = (usd: number) =>
  (usd * USD_TO_CAD).toLocaleString("en-CA", { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol" });
