import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import { api, qs } from '../api';
import { useSeo } from '../seo';

const CATS = [['', 'All'], ['tees', 'Tees'], ['sweats', 'Sweats & hoodies'], ['bottoms', 'Bottoms'], ['training', 'Training']];
const COLOURS = [['Chalk', '#ece8df'], ['Ash', '#8b8a87'], ['Coal', '#151515']];
const TITLES = { men: "Men's collection", women: "Women's collection" };

export default function Shop({ gender: fixed = '' }) {
  const [sp, setSp] = useSearchParams();
  const gender = fixed || sp.get('gender') || '';
  const category = sp.get('category') || '';
  const sort = sp.get('sort') || 'new';
  const color = sp.get('color') || '';
  const q = sp.get('q') || '';
  const [data, setData] = useState({ items: [], total: 0 });
  useSeo({ title: `${TITLES[gender] || 'Shop All'}${category ? ` — ${CATS.find((c) => c[0] === category)?.[1] || ''}` : ''}`, description: `${TITLES[gender] || 'All products'}: heavyweight essentials in Chalk, Ash and Coal. 150–420gsm. Designed in London.`, image: data.items[0]?.images?.[0] });
  const [loading, setLoading] = useState(true);
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };

  useEffect(() => {
    setLoading(true);
    api.get(`/api/products?${qs({ gender, category, sort, color, q, limit: 100 })}`).then(setData).catch(() => setData({ items: [], total: 0 })).finally(() => setLoading(false));
  }, [gender, category, sort, color, q]);

  return (
    <div className="wrap">
      <div className="page-head">
        <span className="eyebrow muted">{data.total} styles</span>
        <h1 style={{ marginTop: 10 }}>{TITLES[gender] || 'All products'}</h1>
      </div>
      <div className="bar">
        <div className="pills">{CATS.map(([v, l]) => <button key={v} className={`pill ${category === v ? 'on' : ''}`} onClick={() => set('category', v)}>{l}</button>)}</div>
        <div className="pills">
          {COLOURS.map(([n, hex]) => <button key={n} className={`dotbtn ${color === n ? 'on' : ''}`} style={{ background: hex }} onClick={() => set('color', color === n ? '' : n)} aria-label={`Filter ${n}`} title={n} />)}
          <input className="select" placeholder="Search" value={q} onChange={(e) => set('q', e.target.value)} aria-label="Search products" style={{ width: 140 }} />
          <select className="select" value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort">
            <option value="new">Newest</option><option value="popular">Most popular</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>
      {loading ? <div className="empty muted">Loading…</div> : data.items.length === 0 ? (
        <div className="empty"><h3 style={{ fontSize: 18 }}>Nothing here</h3><button className="link" onClick={() => setSp({})}>Clear filters</button></div>
      ) : (
        <div className="grid" style={{ paddingBottom: 120 }}>{data.items.map((p, i) => <Reveal key={p._id} delay={(i % 4) * 60}><ProductCard product={p} index={gender ? i + 1 : undefined} /></Reveal>)}</div>
      )}
    </div>
  );
}
