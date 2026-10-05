import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useApp } from '../store';
import { useSeo } from '../seo';
import { api, money } from '../api';

export default function Account() {
  useSeo({ title: 'Your account', noindex: true });
  const { user, logout } = useApp();
  const [orders, setOrders] = useState([]);
  const [wish, setWish] = useState([]);
  useEffect(() => {
    if (!user) return;
    api.get('/api/orders/mine').then(setOrders).catch(() => {});
    if (user.wishlist?.length) api.get('/api/products?limit=100').then((d) => setWish(d.items.filter((p) => user.wishlist.includes(p._id)))).catch(() => {});
    else setWish([]);
  }, [user]);

  if (user === undefined) return <div className="empty muted">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />;

  return (
    <div className="wrap" style={{ paddingBlock: '56px 120px' }}>
      <div className="sec-head"><div><span className="eyebrow muted">Welcome back</span><h1 style={{ fontSize: 'clamp(28px,4vw,56px)' }}>{user.name}</h1></div>
        <div className="a-actions">{user.role === 'admin' && <Link to="/admin" className="btn ghost sm">Admin</Link>}<button className="btn ghost sm" onClick={logout}>Sign out</button></div></div>
      <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.3em', marginBottom: 18 }}>Orders</h2>
      {orders.length === 0 ? <p className="muted">No orders yet. <Link to="/shop" className="link">Start shopping</Link></p> : (
        <div className="scroll-x"><table className="tbl">
          <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o._id}><td><Link to={`/order/${o.number}`} className="link">{o.number}</Link></td><td>{new Date(o.createdAt).toLocaleDateString()}</td><td><span className={`status ${o.status}`}>{o.status}</span></td><td>{money(o.total, o.currency)}</td></tr>
          ))}</tbody>
        </table></div>
      )}
      {wish.length > 0 && <><h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.3em', margin: '64px 0 24px' }}>Saved</h2><div className="grid">{wish.map((p) => <ProductCard key={p._id} product={p} />)}</div></>}
    </div>
  );
}
