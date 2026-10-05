import Setting from './models/Setting.js';
import { CURRENCIES, DEFAULT_RATES } from './config/markets.js';

let cache = { at: 0, rates: DEFAULT_RATES };

export async function getRates() {
  if (Date.now() - cache.at < 30_000) return cache.rates;
  const doc = await Setting.findOne({ key: 'site' }).lean();
  const stored = Object.fromEntries(Object.entries(doc?.rates || {}).filter(([, v]) => v > 0));
  cache = { at: Date.now(), rates: { ...DEFAULT_RATES, ...stored, GBP: 1 } };
  return cache.rates;
}
export const clearRatesCache = () => { cache.at = 0; };

export function priceIn(p, cur, rates) {
  const manual = p.priceOverrides?.[cur];
  if (cur === 'GBP') return p.price;
  if (manual) return manual;
  const step = CURRENCIES[cur].step;
  return Math.round((p.price * rates[cur]) / step) * step;
}

export function serialize(p, rates) {
  const j = p.toJSON();
  j.prices = Object.fromEntries(Object.keys(CURRENCIES).map((c) => [c, priceIn(p, c, rates)]));
  return j;
}
