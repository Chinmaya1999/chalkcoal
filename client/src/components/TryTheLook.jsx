import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductVisual, photosFor } from './Garment';
import { useApp } from '../store';

// Curated outfits: [name, gender, cut-out model (public/looks, background removed), [[sku, colour], …]].
const LOOKS = [
  ['Everyday', 'men', 'CC-U01_chalk', [['CC-U01', 'Chalk'], ['CC-U06', 'Coal'], ['CC-U05', 'Ash']]],
  ['Heavyweight', 'men', 'CC-U04_coal', [['CC-U04', 'Coal'], ['CC-U06', 'Coal'], ['CC-U01', 'Chalk']]],
  ['Off duty', 'women', 'CC-W07_ash', [['CC-W07', 'Ash'], ['CC-W01', 'Coal'], ['CC-W04', 'Chalk']]],
  ['Soft layers', 'women', 'CC-W02_ash', [['CC-W02', 'Ash'], ['CC-W08', 'Coal'], ['CC-W06', 'Coal']]],
  ['Train', 'men', 'CC-U08_coal', [['CC-U08', 'Coal'], ['CC-U09', 'Coal'], ['CC-U07', 'Chalk']]],
  ['Studio', 'women', 'CC-W11_coal', [['CC-W11', 'Chalk'], ['CC-W14', 'Coal'], ['CC-W10', 'Coal']]],
];
const BUNDLE_OFF = 0.1;

export default function TryTheLook({ products, gender = '' }) {
  const { addToCart, fmt, priceOf } = useApp();
  const [i, setI] = useState(0);
  const [size, setSize] = useState('M');
  const drag = useRef(null);

  const looks = useMemo(() => {
    const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));
    return LOOKS.filter(([, g]) => !gender || g === gender).map(([name, g, cut, parts]) => ({
      name, gender: g, cut,
      items: parts.map(([sku, colour]) => bySku[sku] && { p: bySku[sku], colour }).filter(Boolean),
    })).filter((l) => l.items.length >= 2);
  }, [products, gender]);

  useEffect(() => { setI(0); }, [gender]);
  const n = looks.length;
  const go = (d) => setI((x) => (x + d + n) % n);
  useEffect(() => {
    if (n < 2) return undefined;
    const key = (e) => { if (e.target.closest?.('input, select, textarea')) return; if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [n]);
  if (n === 0) return null;

  const look = looks[Math.min(i, n - 1)];
  const sizeFor = (p) => {
    const sizes = [...new Set(p.variants.map((v) => v.size))];
    return sizes.includes(size) ? size : sizes[Math.floor(sizes.length / 2)];
  };
  const colourOf = (p, name) => p.colors.find((c) => c.name === name) || p.colors[0];
  const total = look.items.reduce((s, { p }) => s + priceOf(p), 0);
  const bundle = Math.round(total * (1 - BUNDLE_OFF));
  const addLook = () => look.items.forEach(({ p, colour }, k) => {
    const c = colourOf(p, colour);
    addToCart({ productId: p._id, slug: p.slug, name: p.name, sku: p.sku, type: p.type, hex: c.hex, image: photosFor(p, c.name)[0], prices: p.prices, color: c.name, size: sizeFor(p), qty: 1 }, k === look.items.length - 1);
  });

  const onDown = (e) => { drag.current = e.clientX; };
  const onUp = (e) => {
    if (drag.current == null) return;
    const dx = e.clientX - drag.current; drag.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  return (
    <section className="trylook" aria-label="Try the look">
      <div className="look-stage">
        <div className="look-head">
          <h2>Try the Look.</h2>
          <p className="muted">Pick a look, then bag the whole outfit in one go. {Math.round(BUNDLE_OFF * 100)}% off when you buy all {look.items.length} pieces.</p>
        </div>
        <div className="look-track" onPointerDown={onDown} onPointerUp={onUp} onPointerLeave={() => { drag.current = null; }}>
          {looks.map((l, k) => {
            const off = ((k - i + n + Math.floor(n / 2)) % n) - Math.floor(n / 2); // shortest signed distance from the active look
            return (
              <button
                key={l.name}
                type="button"
                className={`look-fig ${off === 0 ? 'on' : ''}`}
                style={{ '--o': off, '--abs': Math.abs(off) }}
                onClick={() => setI(k)}
                aria-label={`${l.name} look`}
                aria-current={off === 0}
                tabIndex={Math.abs(off) > 2 ? -1 : 0}
              >
                <span className="look-img">
                  <img src={`/looks/${l.cut}.webp`} alt={`${l.name} look`} loading="lazy" decoding="async" draggable="false" />
                </span>
                <span className="look-name">{l.name}</span>
              </button>
            );
          })}
        </div>
        <div className="look-ctl">
          <span className="look-count">{String(i + 1).padStart(2, '0')}<i /> {String(n).padStart(2, '0')}</span>
          <span className="look-bar"><b style={{ width: `${((i + 1) / n) * 100}%` }} /></span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous look">←</button>
          <button type="button" onClick={() => go(1)} aria-label="Next look">→</button>
        </div>
      </div>

      <aside className="look-panel">
        <span className="look-label muted">In this look</span>
        <ol className="look-items">
          {look.items.map(({ p, colour }, k) => {
            const c = colourOf(p, colour);
            const src = photosFor(p, c.name)[0];
            return (
              <li key={p._id}>
                <Link to={`/product/${p.slug}`} className="look-thumb" aria-label={p.name}>
                  {src ? <img src={src} alt="" loading="lazy" /> : <ProductVisual product={p} colorIndex={p.colors.indexOf(c)} />}
                  <sup>{k + 1}</sup>
                </Link>
                <div>
                  <small className="muted">Chalk &amp; Coal · {c.name}</small>
                  <Link to={`/product/${p.slug}`} className="name">{p.name}</Link>
                  <span>{fmt(priceOf(p))}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="look-foot">
          <label className="look-size">
            <span className="muted">Size</span>
            <select className="select" value={size} onChange={(e) => setSize(e.target.value)} aria-label="Size for the whole look">
              {['XS', 'S', 'M', 'L', 'XL'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="look-price"><span className="muted">Complete the look</span><span><s className="muted">{fmt(total)}</s> <b>{fmt(bundle)}</b></span></div>
          <button type="button" className="btn" onClick={addLook}>Add full look to bag <span aria-hidden>→</span></button>
        </div>
      </aside>
    </section>
  );
}
