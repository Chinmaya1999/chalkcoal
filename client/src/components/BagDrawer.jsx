import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import Garment from './Garment';

export default function BagDrawer() {
  const { bagOpen, setBagOpen, cart, subtotal, setQty, count, fmt, priceOf, market } = useApp();
  const nav = useNavigate();
  if (!bagOpen) return null;
  const left = Math.max(0, market.freeOver - subtotal);
  return (
    <>
      <div className="scrim" onClick={() => setBagOpen(false)} />
      <aside className="drawer" role="dialog" aria-label="Shopping bag">
        <div className="drawer-head">
          <span className="eyebrow">Bag ({count})</span>
          <button className="eyebrow" onClick={() => setBagOpen(false)}>Close</button>
        </div>
        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty"><h3 style={{ fontSize: 18 }}>Your bag is empty</h3><Link to="/shop" className="link" onClick={() => setBagOpen(false)}>Shop all</Link></div>
          ) : cart.map((i) => (
            <div className="line" key={`${i.productId}${i.color}${i.size}`}>
              <div className="thumb">{i.image ? <img src={i.image} alt="" /> : <Garment type={i.type} color={i.hex} />}</div>
              <div className="stack" style={{ gap: 6, alignContent: 'start' }}>
                <div className="row"><Link to={`/product/${i.slug}`} onClick={() => setBagOpen(false)} className="eyebrow">{i.name}</Link><span>{fmt(priceOf(i) * i.qty)}</span></div>
                <span className="muted" style={{ fontSize: 12 }}>{i.color} · {i.size}</span>
                <div className="row" style={{ alignItems: 'center', marginTop: 6 }}>
                  <div className="qty"><button onClick={() => setQty(i, i.qty - 1)} aria-label="Decrease">−</button><span>{i.qty}</span><button onClick={() => setQty(i, i.qty + 1)} aria-label="Increase">+</button></div>
                  <button className="muted" style={{ fontSize: 12, textDecoration: 'underline' }} onClick={() => setQty(i, 0)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="ship-bar"><i style={{ width: `${Math.min(100, (subtotal / market.freeOver) * 100)}%` }} /></div>
            <span className="muted" style={{ fontSize: 12 }}>{left ? `${fmt(left)} away from free delivery` : 'You have unlocked free delivery'}</span>
            <div className="row"><span className="eyebrow">Subtotal</span><span>{fmt(subtotal)}</span></div>
            <button className="btn block" onClick={() => { setBagOpen(false); nav('/checkout'); }}>Checkout</button>
          </div>
        )}
      </aside>
    </>
  );
}
