import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../store';
import Logo from '../components/Logo';
import { useSeo } from '../seo';

const NAV = [['/admin', 'Dashboard', true], ['/admin/orders', 'Orders'], ['/admin/products', 'Products'], ['/admin/customers', 'Customers'], ['/admin/coupons', 'Discounts'], ['/admin/site', 'Site content']];

export default function AdminLayout() {
  const { user, logout, toast } = useApp();
  useSeo({ title: 'Admin', noindex: true });
  if (user === undefined) return <div className="empty muted">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  if (user.role !== 'admin') return <div className="empty"><h2>Admins only</h2><Link to="/" className="link">Back to store</Link></div>;
  return (
    <div className="admin">
      <aside className="a-side">
        <Logo tone="chalk" />
        {NAV.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}
        <div style={{ marginTop: 'auto', display: 'grid', gap: 4 }}>
          <Link to="/">View store ↗</Link>
          <button style={{ padding: '11px 12px', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#bdbbb1', textAlign: 'left' }} onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="a-main"><Outlet /></div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
