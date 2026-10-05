import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, money } from './api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const CURRENCIES = ['GBP', 'USD', 'EUR', 'AED'];
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL NO PL PT RO SK SI ES SE CH'.split(' ');

// First visit: guess the currency from the browser region; the visitor can change it any time.
const guessCurrency = () => {
  const saved = read('cc_currency', null);
  if (CURRENCIES.includes(saved)) return saved;
  const region = (navigator.language || '').split('-')[1]?.toUpperCase();
  return region === 'US' ? 'USD' : region === 'AE' ? 'AED' : EU.includes(region) ? 'EUR' : 'GBP';
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [cart, setCart] = useState(() => read('cc_cart_v2', []));
  const [currency, setCurrencyState] = useState(guessCurrency);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => { api.get('/api/settings').then(setSettings).catch(() => {}); }, []);
  useEffect(() => { api.get('/api/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { try { localStorage.setItem('cc_cart_v2', JSON.stringify(cart)); } catch { /* storage blocked */ } }, [cart]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  const setCurrency = useCallback((c) => { setCurrencyState(c); try { localStorage.setItem('cc_currency', JSON.stringify(c)); } catch { /* ignore */ } }, []);
  const fmt = useCallback((n) => money(n, currency), [currency]);
  const priceOf = (x) => x.prices?.[currency] ?? 0;
  const market = settings?.markets?.currencies?.[currency] || { freeOver: 120 };

  const key = (i) => `${i.productId}|${i.color}|${i.size}`;
  const addToCart = useCallback((item, open = true) => {
    setCart((c) => {
      const found = c.find((x) => key(x) === key(item));
      return found ? c.map((x) => (key(x) === key(item) ? { ...x, qty: Math.min(10, x.qty + item.qty) } : x)) : [...c, item];
    });
    if (open) setBagOpen(true);
  }, []);
  const setQty = (item, qty) => setCart((c) => (qty < 1 ? c.filter((x) => key(x) !== key(item)) : c.map((x) => (key(x) === key(item) ? { ...x, qty: Math.min(10, qty) } : x))));
  const clearCart = () => setCart([]);

  const auth = useMemo(() => ({
    login: async (email, password) => setUser((await api.post('/api/auth/login', { email, password })).user),
    register: async (name, email, password) => setUser((await api.post('/api/auth/register', { name, email, password })).user),
    logout: async () => { await api.post('/api/auth/logout'); setUser(null); },
    toggleWish: async (id) => {
      if (!user) return setToast('Sign in to save favourites');
      const { wishlist } = await api.post(`/api/auth/wishlist/${id}`);
      setUser((u) => ({ ...u, wishlist }));
    },
  }), [user]);

  const count = cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = cart.reduce((n, i) => n + i.qty * priceOf(i), 0);

  return (
    <Ctx.Provider value={{ settings, setSettings, user, ...auth, cart, count, subtotal, addToCart, setQty, clearCart, bagOpen, setBagOpen, toast, setToast, currency, setCurrency, fmt, priceOf, market, currencies: CURRENCIES }}>
      {children}
    </Ctx.Provider>
  );
}
