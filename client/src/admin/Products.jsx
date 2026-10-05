import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { ProductVisual } from '../components/Garment';
import { useApp } from '../store';

export default function Products() {
  const { setToast } = useApp();
  const [sp] = useSearchParams();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const [low, setLow] = useState(sp.get('low') === '1');
  const load = () => api.get('/api/admin/products').then(setItems);
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => (items || []).filter((p) => (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())) && (!low || p.variants.some((v) => v.stock <= 5))), [items, q, low]);
  const patch = async (p, body) => { try { const u = await api.put(`/api/admin/products/${p._id}`, body); setItems((l) => l.map((x) => (x._id === u._id ? u : x))); } catch (e) { setToast(e.message); } };
  const remove = async (p) => { if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return; await api.del(`/api/admin/products/${p._id}`); load(); };

  return (
    <>
      <div className="a-top"><h1>Products</h1><Link to="/admin/products/new" className="btn sm">+ New product</Link></div>
      <div className="a-actions" style={{ marginBottom: 14 }}>
        <input className="input" style={{ maxWidth: 320, background: '#fff' }} placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="switch"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> Low stock only</label>
      </div>
      <div className="a-card scroll-x" style={{ padding: 0 }}>
        {!items ? <p style={{ padding: 22 }} className="muted">Loading…</p> : (
          <table className="tbl">
            <thead><tr><th></th><th>Product</th><th>SKU</th><th>Price (£)</th><th>Stock</th><th>Sold</th><th>Live</th><th></th></tr></thead>
            <tbody>{shown.map((p) => (
              <tr key={p._id}>
                <td><div className="thumb-s"><ProductVisual product={p} /></div></td>
                <td><Link to={`/admin/products/${p._id}`} className="link" style={{ letterSpacing: 0 }}>{p.name}</Link><div className="muted" style={{ fontSize: 12 }}>{p.gender} · {p.category} · {p.type}</div></td>
                <td>{p.sku}</td>
                <td>
                  <input className="stock-input" style={{ width: 80 }} defaultValue={p.price} type="number" min="0" step="1" aria-label={`Price for ${p.name}`}
                    onBlur={(e) => +e.target.value !== p.price && patch(p, { price: +e.target.value })} />
                </td>
                <td style={{ color: p.stock <= 10 ? 'var(--bad)' : 'inherit' }}>{p.stock}</td>
                <td>{p.sold}</td>
                <td><input type="checkbox" checked={p.active} onChange={(e) => patch(p, { active: e.target.checked })} aria-label="Visible in store" /></td>
                <td><div className="a-actions"><Link to={`/admin/products/${p._id}`} className="btn ghost sm">Edit</Link><button className="btn ghost sm" onClick={() => remove(p)}>Delete</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
