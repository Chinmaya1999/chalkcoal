import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../store';

const blank = { code: '', type: 'percent', value: 10, minSubtotal: 0, usageLimit: 0 };

export default function Coupons() {
  const { setToast } = useApp();
  const [list, setList] = useState(null);
  const [f, setF] = useState(blank);
  const load = () => api.get('/api/admin/coupons').then(setList);
  useEffect(() => { load(); }, []);
  const add = async (e) => {
    e.preventDefault();
    try { await api.post('/api/admin/coupons', { ...f, value: +f.value, minSubtotal: +f.minSubtotal, usageLimit: +f.usageLimit }); setF(blank); load(); } catch (err) { setToast(err.message); }
  };
  const toggle = async (c) => { await api.put(`/api/admin/coupons/${c._id}`, { active: !c.active }); load(); };
  const del = async (c) => { if (confirm(`Delete ${c.code}?`)) { await api.del(`/api/admin/coupons/${c._id}`); load(); } };
  return (
    <>
      <div className="a-top"><h1>Discounts</h1><span className="muted">Amounts are in £ and convert automatically to $, € and AED.</span></div>
      <form className="a-card a-actions" style={{ marginBottom: 14, alignItems: 'end' }} onSubmit={add}>
        <label className="field"><span>Code</span><input className="input" required style={{ width: 150 }} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></label>
        <label className="field"><span>Type</span><select className="input" style={{ width: 120 }} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">% off</option><option value="fixed">£ off</option></select></label>
        <label className="field"><span>Value</span><input className="input" type="number" min="0" required style={{ width: 90 }} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label>
        <label className="field"><span>Min. spend (£)</span><input className="input" type="number" min="0" style={{ width: 110 }} value={f.minSubtotal} onChange={(e) => setF({ ...f, minSubtotal: e.target.value })} /></label>
        <label className="field"><span>Max uses (0 = ∞)</span><input className="input" type="number" min="0" style={{ width: 130 }} value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} /></label>
        <button className="btn sm" style={{ height: 48 }}>Create</button>
      </form>
      <div className="a-card scroll-x" style={{ padding: 0 }}>
        {!list ? <p style={{ padding: 22 }} className="muted">Loading…</p> : (
          <table className="tbl">
            <thead><tr><th>Code</th><th>Discount</th><th>Min. spend</th><th>Used</th><th>Active</th><th></th></tr></thead>
            <tbody>{list.map((c) => (
              <tr key={c._id}><td><strong>{c.code}</strong></td><td>{c.type === 'percent' ? `${c.value}%` : `£${c.value}`}</td><td>{c.minSubtotal ? `£${c.minSubtotal}` : '—'}</td><td>{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td><input type="checkbox" checked={c.active} onChange={() => toggle(c)} aria-label="Active" /></td><td><button className="btn ghost sm" onClick={() => del(c)}>Delete</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
