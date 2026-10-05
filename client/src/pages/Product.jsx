import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Garment, { photosFor } from '../components/Garment';
import ProductCard from '../components/ProductCard';
import { useApp } from '../store';
import { api } from '../api';
import { useSeo } from '../seo';

export default function Product() {
  const { slug } = useParams();
  const { addToCart, user, toggleWish, fmt, priceOf, market } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [ci, setCi] = useState(0);
  const [size, setSize] = useState('');

  useEffect(() => {
    setData(null); setError(''); setCi(0); setSize('');
    api.get(`/api/products/${slug}`).then(setData).catch((e) => setError(e.message));
  }, [slug]);

  const p = data?.product;
  useSeo(p ? {
    title: `${p.name} — ${p.gender === 'men' ? "Men's" : "Women's"} ${p.type}`,
    description: `${p.gender === 'men' ? "Men's" : "Women's"} ${p.name}${p.gsm ? ` — ${p.gsm}gsm` : ''} in ${p.colors.map((c) => c.name).join(', ')}. ${p.description}`,
    image: photosFor(p, p.colors[0]?.name)[0],
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, description: p.description, image: photosFor(p, p.colors[0]?.name).map((u) => (u.startsWith('http') ? u : `${location.origin}${u}`)), brand: { '@type': 'Brand', name: 'Chalk&Coal' }, offers: { '@type': 'Offer', priceCurrency: 'GBP', price: String(p.prices.GBP), availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: location.href } }],
  } : { title: 'Product', noindex: true });
  const sizes = useMemo(() => (p ? [...new Set(p.variants.map((v) => v.size))] : []), [p]);
  if (error) return <div className="empty wrap"><h2>{error}</h2><Link to="/shop" className="link">Back to shop</Link></div>;
  if (!p) return <div className="empty muted">Loading…</div>;

  const color = p.colors[ci];
  const photos = photosFor(p, color.name);
  const stock = (s) => p.variants.find((v) => v.size === s && v.color === color.name)?.stock ?? 0;
  const left = size ? stock(size) : null;
  const add = () => addToCart({ productId: p._id, slug: p.slug, name: p.name, sku: p.sku, type: p.type, hex: color.hex, image: photosFor(p, color.name)[0], prices: p.prices, color: color.name, size, qty: 1 });
  const wished = user?.wishlist?.includes(p._id);

  return (
    <div className="wrap">
      <p className="eyebrow muted" style={{ paddingTop: 24 }}><Link to="/shop">Shop</Link> / <Link to={`/${p.gender}`}>{p.gender}</Link> / {p.name}</p>
      <div className="pdp">
        <div className="pdp-gallery">
          {photos.length ? photos.map((src, i) => <div key={src} className="card-img"><img src={src} alt={`${p.name} in ${color.name} — photo ${i + 1}`} width="1080" height="1350" decoding="async" loading={i === 0 ? 'eager' : 'lazy'} fetchpriority={i === 0 ? 'high' : 'auto'} /></div>) : (
            <>
              <div className="card-img"><Garment type={p.type} color={color.hex} /></div>
              {p.colors.map((c) => <div key={c.name} className="card-img"><Garment type={p.type} color={c.hex} /></div>)}
            </>
          )}
        </div>
        <div className="pdp-info">
          <div className="stack" style={{ gap: 10 }}>
            <span className="eyebrow muted">{p.sku}{p.gsm ? ` · ${p.gsm}GSM` : ''}{p.note ? ` · ${p.note}` : ''}</span>
            <h1>{p.name}</h1>
            <span className="pdp-price">{fmt(priceOf(p))}</span>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            <span className="eyebrow">Colour — {color.name}</span>
            <div className="swatches">{p.colors.map((c, i) => <button key={c.name} className={`swatch ${i === ci ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => { setCi(i); setSize(''); }} aria-label={c.name} />)}</div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            <span className="eyebrow">Size</span>
            <div className="sizes">{sizes.map((s) => <button key={s} className={`size ${size === s ? 'on' : ''}`} disabled={!stock(s)} onClick={() => setSize(s)}>{s}</button>)}</div>
            {left !== null && left <= 5 && left > 0 && <span className="error">Only {left} left</span>}
          </div>
          <div className="stack pdp-cta" style={{ gap: 10 }}>
            <button className="btn block" disabled={!size} onClick={add}>{size ? 'Add to bag' : 'Select a size'}</button>
            <button className="btn ghost block" onClick={() => toggleWish(p._id)}>{wished ? '♥ Saved' : '♡ Save for later'}</button>
          </div>
          <div>
            <details className="acc" open><summary>Description</summary><p>{p.description}</p></details>
            <details className="acc"><summary>Details</summary><ul>{p.details.map((d) => <li key={d}>{d}</li>)}</ul></details>
            <details className="acc"><summary>Delivery &amp; returns</summary><p>Delivering to the UK, Europe, USA and UAE. Free delivery over {fmt(market.freeOver)}. Returns within 30 days, unworn with tags.</p></details>
            <details className="acc"><summary>Packaging</summary><p>Sent in a recycled poly bag with a tonal hang tag. Care instructions are printed inside the garment.</p></details>
          </div>
        </div>
      </div>
      {data.related.length > 0 && (
        <section style={{ paddingBottom: 120 }}>
          <div className="sec-head"><h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.3em' }}>You may also like</h2></div>
          <div className="grid">{data.related.map((r) => <ProductCard key={r._id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
