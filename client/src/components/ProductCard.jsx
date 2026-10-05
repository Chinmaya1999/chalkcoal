import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ProductVisual, photosFor } from './Garment';
import { useApp } from '../store';

export default function ProductCard({ product: p, index }) {
  const { addToCart, user, toggleWish, fmt, priceOf } = useApp();
  const [ci, setCi] = useState(0);
  const color = p.colors[ci];
  const inWish = user?.wishlist?.includes(p._id);
  const sizes = [...new Set(p.variants.map((v) => v.size))];
  const stockOf = (size) => p.variants.find((v) => v.size === size && v.color === color?.name)?.stock ?? 0;
  const soldOut = p.stock === 0;

  return (
    <div className="card">
      <button className="wish" onClick={() => toggleWish(p._id)} aria-label={inWish ? 'Remove from favourites' : 'Save to favourites'}>{inWish ? '♥' : '♡'}</button>
      <Link to={`/product/${p.slug}`} className="card-img" aria-label={p.name}>
        <ProductVisual product={p} colorIndex={ci} />
        <span className="card-tag">{soldOut ? 'Sold out' : ''}</span>
      </Link>
      {!soldOut && (
        <div className="card-quick">
          {sizes.map((s) => (
            <button key={s} disabled={!stockOf(s)} onClick={() => addToCart({ productId: p._id, slug: p.slug, name: p.name, sku: p.sku, type: p.type, hex: color.hex, image: photosFor(p, color.name)[0], prices: p.prices, color: color.name, size: s, qty: 1 })}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="card-meta">
        <Link to={`/product/${p.slug}`} className="name">{index ? `${index}. ` : ''}{p.name}</Link>
        <div className="dots">
          {p.colors.map((c, i) => (
            <button key={c.name} className="dot" style={{ background: c.hex, outline: i === ci ? '1px solid var(--coal)' : 'none', outlineOffset: 2 }} onClick={() => setCi(i)} aria-label={c.name} />
          ))}
        </div>
        <span className="gsm">{p.gsm ? `${p.gsm}GSM` : p.note}</span>
        <span className="price">{fmt(priceOf(p))}</span>
      </div>
    </div>
  );
}
