import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Garment from '../components/Garment';
import { useApp } from '../store';
import { useSeo } from '../seo';
import { api } from '../api';

const blank = { name: '', line1: '', line2: '', city: '', state: '', zip: '', country: '', phone: '' };
const HOME = { GBP: 'United Kingdom', USD: 'United States', AED: 'United Arab Emirates' };

export default function Checkout() {
  useSeo({ title: 'Checkout', noindex: true });
  const { cart, user, clearCart, fmt, priceOf, currency, setCurrency, settings, setToast } = useApp();
  const countries = settings?.markets?.countries || [];
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [ship, setShip] = useState(blank);
  const [method, setMethod] = useState('cod');
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Prefill from the signed-in account — fewer fields to type
  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email);
    setShip((s) => ({ ...blank, ...user.address, name: user.name, ...Object.fromEntries(Object.entries(s).filter(([, v]) => v)) }));
  }, [user]);

  useEffect(() => { setShip((s) => (s.country || !HOME[currency] ? s : { ...s, country: HOME[currency] })); }, [currency]);

  const items = cart.map(({ productId, size, color, qty }) => ({ productId, size, color, qty }));
  useEffect(() => {
    if (!cart.length) return;
    api.post('/api/orders/quote', { items, currency, coupon: applied || undefined }).then((q) => { setQuote(q); setError(''); }).catch((e) => { setError(e.message); setApplied(''); });
  }, [cart, applied, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cart.length) return <div className="empty wrap" style={{ minHeight: '50vh' }}><h2>Your bag is empty</h2><Link to="/shop" className="link">Continue shopping</Link></div>;
  const f = (k) => ({ value: ship[k], onChange: (e) => setShip({ ...ship, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await api.post('/api/orders', { items, currency, coupon: applied || undefined, email, paymentMethod: method, shipping: ship });
      clearCart();
      if (r.payUrl) window.location.href = r.payUrl;
      else nav(`/order/${r.number}?email=${encodeURIComponent(email)}`);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <form className="wrap co" onSubmit={submit}>
      <div className="stack" style={{ gap: 34 }}>
        <div className="stack">
          <h2>Contact</h2>
          <label className="field"><span>Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          {!user && <span className="muted" style={{ fontSize: 13 }}><Link to="/login" className="link">Sign in</Link> to save your details for next time.</span>}
        </div>
        <div className="stack">
          <h2>Delivery address</h2>
          <label className="field"><span>Full name</span><input className="input" required {...f('name')} autoComplete="name" /></label>
          <label className="field"><span>Address</span><input className="input" required {...f('line1')} autoComplete="address-line1" /></label>
          <label className="field"><span>Apartment, suite (optional)</span><input className="input" {...f('line2')} autoComplete="address-line2" /></label>
          <div className="grid2">
            <label className="field"><span>City</span><input className="input" required {...f('city')} autoComplete="address-level2" /></label>
            <label className="field"><span>State / region</span><input className="input" {...f('state')} autoComplete="address-level1" /></label>
          </div>
          <div className="grid2">
            <label className="field"><span>Postcode</span><input className="input" required {...f('zip')} autoComplete="postal-code" /></label>
            <label className="field"><span>Country</span>
              <select className="input" required value={ship.country} autoComplete="country-name" onChange={(e) => {
                const c = countries.find((x) => x.name === e.target.value);
                setShip({ ...ship, country: e.target.value });
                if (c && c.currency !== currency) { setCurrency(c.currency); setToast(`Prices now shown in ${c.currency}`); }
              }}>
                <option value="" disabled>Select…</option>
                {countries.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <label className="field"><span>Phone (for the courier)</span><input className="input" type="tel" {...f('phone')} autoComplete="tel" /></label>
        </div>
        <div className="stack">
          <h2>Payment</h2>
          <label className={`radio ${method === 'cod' ? 'on' : ''}`}><input type="radio" checked={method === 'cod'} onChange={() => setMethod('cod')} /> Pay on delivery</label>
          <label className={`radio ${method === 'card' ? 'on' : ''}`}><input type="radio" checked={method === 'card'} onChange={() => setMethod('card')} /> Card — secure checkout by Stripe</label>
        </div>
      </div>

      <aside className="sum">
        <h2>Order summary</h2>
        {cart.map((i) => (
          <div key={`${i.productId}${i.color}${i.size}`} className="row" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="thumb-s" style={{ background: '#fff' }}>{i.image ? <img src={i.image} alt="" /> : <Garment type={i.type} color={i.hex} />}</div>
              <div><div>{i.name} × {i.qty}</div><div className="muted" style={{ fontSize: 12 }}>{i.color} · {i.size}</div></div>
            </div>
            <span>{fmt(priceOf(i) * i.qty)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Discount code" />
          <button type="button" className="btn ghost" style={{ padding: '0 20px' }} onClick={() => setApplied(code.trim())}>Apply</button>
        </div>
        {quote && (
          <div className="stack" style={{ gap: 8, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div className="row"><span>Subtotal</span><span>{fmt(quote.subtotal)}</span></div>
            {quote.discount > 0 && <div className="row"><span>Discount ({applied.toUpperCase()})</span><span>−{fmt(quote.discount)}</span></div>}
            <div className="row"><span>Delivery</span><span>{quote.shippingCost ? fmt(quote.shippingCost) : 'Free'}</span></div>
            <div className="row" style={{ fontSize: 22, fontWeight: 300 }}><span>Total</span><span>{fmt(quote.total)}</span></div>
          </div>
        )}
        {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button className="btn block" disabled={busy || !quote}>{busy ? 'Placing order…' : method === 'card' ? 'Continue to payment' : 'Place order'}</button>
      </aside>
    </form>
  );
}
