import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../api';
import { useApp } from '../store';

const SIZE_SETS = { Men: ['S', 'M', 'L', 'XL', 'XXL'], Women: ['XS', 'S', 'M', 'L', 'XL'], 'One size': ['One Size'] };
const COLOURS = [{ name: 'Chalk', hex: '#ECE8DF' }, { name: 'Ash', hex: '#8B8A87' }, { name: 'Coal', hex: '#151515' }];
const TYPES = ['Tee', 'Boxy Tee', 'Crop Tee', 'Long Sleeve', 'Tank', 'Bra', 'Hoodie', 'Crop Hoodie', 'Crewneck', 'Jogger', 'Flared Pant', 'Short', 'Cycling Short'];
const CATS = [['tees', 'Tees'], ['sweats', 'Sweats & hoodies'], ['bottoms', 'Bottoms'], ['training', 'Training']];
const DETAILS = ['18mm rubberised badge, left chest (tonal)', 'Printed neck label — no woven tag', 'Woven hem flag, 10mm, left side seam (6cm up)', 'Twin-needle topstitch, straight hem', 'Designed in London · Made in India', 'Packed in a recycled poly bag'];
const blank = { name: '', sku: '', description: 'Minimal. Purposeful. Everyday essentials.', details: DETAILS, gender: 'men', category: 'tees', type: 'Tee', gsm: 240, note: '', price: '', priceOverrides: {}, colors: COLOURS, images: [], variants: [], featured: false, active: true };

// Rebuild the size × colour matrix while keeping any stock the admin already entered.
const buildVariants = (colors, sizes, old, fill) =>
  colors.flatMap((c) => sizes.map((s) => ({ size: s, color: c.name, stock: old.find((v) => v.size === s && v.color === c.name)?.stock ?? fill })));

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { setToast, settings } = useApp();
  const [p, setP] = useState(null);
  const [sizes, setSizes] = useState(SIZE_SETS.Men);
  const [fill, setFill] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rates = settings?.rates || {};

  useEffect(() => {
    if (id) api.get(`/api/admin/products/${id}`).then((d) => { setP(d); setSizes([...new Set(d.variants.map((v) => v.size))]); }).catch((e) => setError(e.message));
    else api.get('/api/admin/products').then((all) => {
      const n = Math.max(0, ...all.filter((x) => x.gender === 'men').map((x) => +x.sku.replace(/\D/g, '') || 0)) + 1;
      setP({ ...blank, sku: `CC-M-${String(n).padStart(3, '0')}`, variants: buildVariants(blank.colors, SIZE_SETS.Men, [], 10) });
    });
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!p) return <p className="muted">Loading…</p>;
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const regen = (colors, sz) => set({ colors, variants: buildVariants(colors, sz, p.variants, fill) });
  const toggleColor = (c) => { const has = p.colors.some((x) => x.name === c.name); regen(has ? p.colors.filter((x) => x.name !== c.name) : COLOURS.filter((x) => x.name === c.name || p.colors.some((y) => y.name === x.name)), sizes); };
  const pickSizes = (sz) => { setSizes(sz); regen(p.colors, sz); };
  const setGender = (gender) => { set({ gender }); pickSizes(SIZE_SETS[gender === 'men' ? 'Men' : 'Women']); };
  const setStock = (v, stock) => set({ variants: p.variants.map((x) => (x === v ? { ...x, stock } : x)) });
  const auto = (cur) => Math.round(((+p.price || 0) * (rates[cur] || 1)) / (cur === 'AED' ? 5 : 1)) * (cur === 'AED' ? 5 : 1);

  const upload = async (files) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    try { const { urls } = await api.post('/api/admin/upload', fd); set({ images: [...p.images, ...urls] }); } catch (e) { setToast(e.message); }
  };

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const overrides = Object.fromEntries(['USD', 'EUR', 'AED'].map((c) => [c, +p.priceOverrides?.[c] || null]));
    const body = { ...p, price: +p.price, gsm: +p.gsm || 0, priceOverrides: overrides, variants: p.variants.map((v) => ({ ...v, stock: +v.stock || 0 })) };
    for (const k of ['_id', '__v', 'createdAt', 'updatedAt', 'slug', 'sold', 'id', 'stock']) delete body[k];
    try {
      await (id ? api.put(`/api/admin/products/${id}`, body) : api.post('/api/admin/products', body));
      setToast('Product saved'); nav('/admin/products');
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <form onSubmit={save}>
      <div className="a-top"><div><Link to="/admin/products" className="muted">← Products</Link><h1 style={{ fontSize: 28 }}>{id ? p.name : 'New product'}</h1></div>
        <div className="a-actions"><button className="btn sm" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button></div></div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="a-form">
        <div className="stack">
          <div className="a-card stack">
            <h3>Basics</h3>
            <label className="field"><span>Name</span><input className="input" required value={p.name} onChange={(e) => set({ name: e.target.value })} /></label>
            <div className="grid2">
              <label className="field"><span>Fabric weight (gsm)</span><input className="input" type="number" min="0" value={p.gsm} onChange={(e) => set({ gsm: e.target.value })} /></label>
              <label className="field"><span>Note (e.g. Medium support)</span><input className="input" value={p.note} onChange={(e) => set({ note: e.target.value })} /></label>
            </div>
            <label className="field"><span>Description</span><textarea className="input" rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} /></label>
          </div>

          <div className="a-card stack">
            <h3>Price</h3>
            <label className="field" style={{ maxWidth: 220 }}><span>Price in £ (base)</span><input className="input" type="number" min="0" step="1" required value={p.price} onChange={(e) => set({ price: e.target.value })} /></label>
            <div className="grid2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {['USD', 'EUR', 'AED'].map((c) => (
                <label className="field" key={c}><span>{c} — auto {p.price ? money(auto(c), c) : ''}</span>
                  <input className="input" type="number" min="0" placeholder="Auto" value={p.priceOverrides?.[c] || ''} onChange={(e) => set({ priceOverrides: { ...p.priceOverrides, [c]: e.target.value } })} />
                </label>
              ))}
            </div>
            <span className="muted" style={{ fontSize: 12 }}>Leave $, € and AED empty to convert from £ using the rates in Site content. Fill one in to set a fixed price for that currency.</span>
          </div>

          <div className="a-card stack">
            <h3>Colours &amp; sizes</h3>
            <div className="a-actions">{COLOURS.map((c) => <button type="button" key={c.name} className={`pill ${p.colors.some((x) => x.name === c.name) ? 'on' : ''}`} onClick={() => toggleColor(c)}>{c.name}</button>)}</div>
            <div className="a-actions">{Object.entries(SIZE_SETS).map(([n, s]) => <button type="button" key={n} className={`pill ${s.join() === sizes.join() ? 'on' : ''}`} onClick={() => pickSizes(s)}>{n}</button>)}</div>
            <label className="field" style={{ maxWidth: 220 }}><span>Starting stock per variant</span>
              <input className="input" type="number" min="0" value={fill} onChange={(e) => setFill(+e.target.value)} onBlur={() => set({ variants: p.variants.map((v) => ({ ...v, stock: fill })) })} />
            </label>
            <div className="scroll-x"><table className="tbl">
              <thead><tr><th>Colour</th>{sizes.map((s) => <th key={s}>{s}</th>)}</tr></thead>
              <tbody>{p.colors.map((c) => (
                <tr key={c.name}><td>{c.name}</td>{sizes.map((s) => { const v = p.variants.find((x) => x.size === s && x.color === c.name); return v && <td key={s}><input className={`stock-input ${v.stock <= 5 ? 'low' : ''}`} type="number" min="0" value={v.stock} onChange={(e) => setStock(v, e.target.value)} aria-label={`${c.name} ${s} stock`} /></td>; })}</tr>
              ))}</tbody>
            </table></div>
          </div>

          <div className="a-card stack">
            <h3>Details (one per line)</h3>
            <textarea className="input" rows={6} value={p.details.join('\n')} onChange={(e) => set({ details: e.target.value.split('\n').filter(Boolean) })} />
          </div>
        </div>

        <div className="stack">
          <div className="a-card stack">
            <h3>Organise</h3>
            <label className="field"><span>Collection</span><select className="input" value={p.gender} onChange={(e) => setGender(e.target.value)}><option value="men">Men</option><option value="women">Women</option></select></label>
            <label className="field"><span>Category</span><select className="input" value={p.category} onChange={(e) => set({ category: e.target.value })}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="field"><span>Type (sets the illustration)</span><select className="input" value={p.type} onChange={(e) => set({ type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="field"><span>SKU</span><input className="input" required value={p.sku} onChange={(e) => set({ sku: e.target.value })} /></label>
            <label className="switch"><input type="checkbox" checked={p.featured} onChange={(e) => set({ featured: e.target.checked })} /> Feature on homepage</label>
            <label className="switch"><input type="checkbox" checked={p.active} onChange={(e) => set({ active: e.target.checked })} /> Visible in store</label>
          </div>
          <div className="a-card">
            <h3>Photos</h3>
            <label className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
              Drop images here or click to upload
              <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
            </label>
            <div className="imgs">{p.images.map((src) => <div key={src}><img src={src} alt="" /><button type="button" aria-label="Remove image" onClick={() => set({ images: p.images.filter((x) => x !== src) })}>×</button></div>)}</div>
            <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>The first photo is the cover. Without photos the store shows a silhouette in the product colour.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
