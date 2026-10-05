import { useEffect, useState } from 'react';
import { api, money } from '../api';

export default function Customers() {
  const [users, setUsers] = useState(null);
  const [subs, setSubs] = useState([]);
  useEffect(() => { api.get('/api/admin/customers').then(setUsers); api.get('/api/admin/subscribers').then(setSubs); }, []);
  const csv = () => {
    const blob = new Blob([['email,joined', ...subs.map((s) => `${s.email},${s.createdAt}`)].join('\n')], { type: 'text/csv' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'subscribers.csv' }).click();
  };
  return (
    <>
      <div className="a-top"><h1>Customers</h1></div>
      <div className="a-card scroll-x" style={{ padding: 0, marginBottom: 14 }}>
        {!users ? <p style={{ padding: 22 }} className="muted">Loading…</p> : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Orders</th><th>Spent (£)</th></tr></thead>
            <tbody>{users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td><td>{u.orders}</td><td>{money(u.spent)}</td></tr>)}</tbody>
          </table>
        )}
      </div>
      <div className="a-card">
        <div className="row"><h3>Newsletter subscribers ({subs.length})</h3><button className="btn ghost sm" onClick={csv} disabled={!subs.length}>Export CSV</button></div>
        <div className="a-actions">{subs.map((s) => <span key={s._id} className="tag">{s.email}</span>)}</div>
      </div>
    </>
  );
}
