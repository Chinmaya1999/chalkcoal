import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, money, qs } from '../api';
import { useApp } from '../store';

const STATUSES = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];
const NEXT = { pending: 'paid', paid: 'packed', packed: 'shipped', shipped: 'delivered' };

export default function Orders() {
  const { setToast } = useApp();
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const [q, setQ] = useState(sp.get('q') || '');
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  const load = () => api.get(`/api/admin/orders?${qs({ status, q })}`).then(setData);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [status, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async (o, body) => {
    try { const u = await api.patch(`/api/admin/orders/${o._id}`, body); setData((d) => ({ ...d, items: d.items.map((x) => (x._id === u._id ? u : x)) })); setOpen(u); setToast('Order updated'); }
    catch (e) { setToast(e.message); }
  };

  return (
    <>
      <div className="a-top"><h1>Orders</h1></div>
      <div className="a-actions" style={{ marginBottom: 14 }}>
        <input className="input" style={{ maxWidth: 280, background: '#fff' }} placeholder="Order # or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={`pill ${!status ? 'on' : ''}`} onClick={() => setSp({})}>All</button>
        {STATUSES.map((s) => <button key={s} className={`pill ${status === s ? 'on' : ''}`} onClick={() => setSp({ status: s })}>{s}</button>)}
      </div>
      <div className={`a-form ${open ? 'with-detail' : 'list-only'}`}>
        <div className="a-card scroll-x" style={{ padding: 0 }}>
          {!data ? <p style={{ padding: 22 }} className="muted">Loading…</p> : data.items.length === 0 ? <p style={{ padding: 22 }} className="muted">No orders found.</p> : (
            <table className="tbl">
              <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Status</th><th>Total</th><th></th></tr></thead>
              <tbody>{data.items.map((o) => (
                <tr key={o._id} className="click" onClick={() => setOpen(o)} style={{ background: open?._id === o._id ? '#faf9f6' : undefined }}>
                  <td><strong>{o.number}</strong></td><td>{new Date(o.createdAt).toLocaleDateString()}</td><td>{o.email}</td>
                  <td><span className={`status ${o.status}`}>{o.status}</span></td><td>{money(o.total, o.currency)}</td>
                  <td onClick={(e) => e.stopPropagation()}>{NEXT[o.status] && <button className="btn sm" onClick={() => update(o, { status: NEXT[o.status] })}>Mark {NEXT[o.status]}</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        {open && (
          <div className="a-card stack" style={{ position: 'sticky', top: 20 }}>
            <div className="row"><h3 style={{ margin: 0 }}>{open.number}</h3><button onClick={() => setOpen(null)} aria-label="Close">✕</button></div>
            <span className={`status ${open.status}`} style={{ justifySelf: 'start' }}>{open.status}</span>
            {open.items.map((i) => <div className="row" key={i._id}><span>{i.name} <span className="muted">{i.color}/{i.size} × {i.qty}</span></span><span>{money(i.price * i.qty, open.currency)}</span></div>)}
            <div className="row"><span className="muted">Shipping</span><span>{money(open.shippingCost, open.currency)}</span></div>
            {open.discount > 0 && <div className="row"><span className="muted">Discount {open.coupon}</span><span>−{money(open.discount, open.currency)}</span></div>}
            <div className="row"><strong>Total</strong><strong>{money(open.total, open.currency)}</strong></div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              {open.shipping.name}<br />{open.shipping.line1} {open.shipping.line2}<br />{open.shipping.city} {open.shipping.state} {open.shipping.zip}<br />{open.shipping.country}<br />{open.shipping.phone}<br />
              Payment: {open.payment.method} · {open.payment.paid ? 'paid' : 'unpaid'}
            </div>
            <label className="field"><span>Status</span><select className="input" value={open.status} onChange={(e) => update(open, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="field"><span>Tracking number</span><input className="input" defaultValue={open.tracking} onBlur={(e) => e.target.value !== (open.tracking || '') && update(open, { tracking: e.target.value })} /></label>
            <label className="field"><span>Internal note</span><textarea className="input" rows={2} defaultValue={open.note} onBlur={(e) => e.target.value !== (open.note || '') && update(open, { note: e.target.value })} /></label>
          </div>
        )}
      </div>
    </>
  );
}
