import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, money } from '../api';
import { useSeo } from '../seo';

const STEPS = ['pending', 'paid', 'packed', 'shipped', 'delivered'];

export default function Order() {
  useSeo({ title: 'Your order', noindex: true });
  const { number } = useParams();
  const [sp] = useSearchParams();
  const [o, setO] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/api/orders/lookup/${number}?email=${encodeURIComponent(sp.get('email') || '')}`).then(setO).catch((e) => setError(e.message)); }, [number, sp]);

  if (error) return <div className="empty wrap" style={{ minHeight: '50vh' }}><h2>{error}</h2><Link to="/account" className="link">Go to account</Link></div>;
  if (!o) return <div className="empty muted">Loading…</div>;
  const reached = STEPS.findIndex((s) => s === o.status);
  const dead = ['cancelled', 'refunded'].includes(o.status);

  return (
    <div className="wrap" style={{ maxWidth: 820, paddingBlock: '64px 120px' }}>
      <span className="eyebrow muted">Thank you</span>
      <h1 style={{ fontSize: 'clamp(26px,4vw,48px)', margin: '8px 0 24px' }}>Order {o.number}</h1>
      <p>We have sent a confirmation to <strong>{o.email}</strong>. <span className={`status ${o.status}`}>{o.status}</span></p>
      {!dead && <div className="timeline">{STEPS.map((s, i) => <div key={s} className={i <= reached ? 'done' : ''}>{s}</div>)}</div>}
      {o.tracking && <p>Tracking: <strong>{o.tracking}</strong></p>}
      <div className="stack" style={{ marginBlock: 32 }}>
        {o.items.map((i) => <div className="row" key={i._id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}><span>{i.name} <span className="muted">· {i.color} / {i.size} × {i.qty}</span></span><span>{money(i.price * i.qty, o.currency)}</span></div>)}
        <div className="row"><span>Delivery</span><span>{o.shippingCost ? money(o.shippingCost, o.currency) : 'Free'}</span></div>
        {o.discount > 0 && <div className="row"><span>Discount</span><span>−{money(o.discount, o.currency)}</span></div>}
        <div className="row display" style={{ fontSize: 30 }}><span>Total</span><span>{money(o.total, o.currency)}</span></div>
      </div>
      <p className="muted">Delivering to {o.shipping.name}, {o.shipping.line1}, {o.shipping.city}, {o.shipping.country}</p>
      <Link to="/shop" className="btn">Keep shopping</Link>
    </div>
  );
}
