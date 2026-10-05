import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { ProductVisual } from '../components/Garment';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/api/admin/stats').then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error">{error}</p>;
  if (!s) return <p className="muted">Loading…</p>;

  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  const toDo = (st) => s.byStatus.find((x) => x._id === st)?.n || 0;
  return (
    <>
      <div className="a-top"><h1>Overview</h1><Link to="/admin/products/new" className="btn sm">+ New product</Link></div>
      <div className="kpis">
        {[['Revenue (GBP)', money(Math.round(s.revenue))], ['Orders', s.orders], ['Avg. order (GBP)', money(Math.round(s.aov))], ['Customers', s.customers]].map(([l, v]) => (
          <div className="a-card kpi" key={l}><div className="l">{l}</div><div className="v">{v}</div></div>
        ))}
      </div>
      <div className="a-grid">
        <div className="a-card">
          <h3>Revenue — last 14 days (GBP)</h3>
          <div className="chart">{s.daily.map((d) => <div className="b" key={d._id} title={`${d._id}: ${money(Math.round(d.revenue))} · ${d.orders} orders`}><i style={{ height: `${(d.revenue / max) * 100}%` }} /><span>{d._id.slice(8)}</span></div>)}</div>
        </div>
        <div className="a-card">
          <h3>Needs attention</h3>
          <div className="stack">
            <Link to="/admin/orders?status=pending" className="row"><span>Pending orders</span><strong>{toDo('pending')}</strong></Link>
            <Link to="/admin/orders?status=paid" className="row"><span>Paid · to pack</span><strong>{toDo('paid')}</strong></Link>
            <Link to="/admin/orders?status=packed" className="row"><span>Packed · to ship</span><strong>{toDo('packed')}</strong></Link>
            <Link to="/admin/products?low=1" className="row"><span>Low stock variants</span><strong style={{ color: s.lowStock.length ? 'var(--bad)' : 'inherit' }}>{s.lowStock.length}</strong></Link>
          </div>
        </div>
      </div>
      <div className="a-grid">
        <div className="a-card scroll-x">
          <h3>Recent orders</h3>
          <table className="tbl"><tbody>{s.recent.map((o) => (
            <tr key={o._id}><td><Link to={`/admin/orders?q=${o.number}`} className="link">{o.number}</Link></td><td>{o.email}</td><td><span className={`status ${o.status}`}>{o.status}</span></td><td style={{ textAlign: 'right' }}>{money(o.total, o.currency)}</td></tr>
          ))}</tbody></table>
        </div>
        <div className="a-card">
          <h3>Best sellers</h3>
          <div className="stack">{s.top.map((p) => (
            <div className="row" key={p._id} style={{ alignItems: 'center' }}><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div className="thumb-s"><ProductVisual product={{ ...p, type: 'Tee', colors: [{ hex: '#151515' }] }} /></div>{p.name}</div><span className="muted">{p.sold} sold</span></div>
          ))}</div>
        </div>
      </div>
      {s.lowStock.length > 0 && (
        <div className="a-card">
          <h3>Low stock</h3>
          <div className="a-actions">{s.lowStock.map((v, i) => <span key={i} className="tag">{v.name} · {v.color}/{v.size} — <strong style={{ color: 'var(--bad)' }}>{v.stock}</strong></span>)}</div>
        </div>
      )}
    </>
  );
}
