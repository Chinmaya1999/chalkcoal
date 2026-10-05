import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { useSeo } from '../seo';

export default function Login({ register = false }) {
  useSeo({ title: 'Sign in', noindex: true });
  const { user, login, register: signup } = useApp();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/account';
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === 'admin' && !register ? '/admin' : from} replace />;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { register ? await signup(f.name, f.email, f.password) : await login(f.email, f.password); nav(from, { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form className="auth" onSubmit={submit}>
      <h1>{register ? 'Create account' : 'Sign in'}</h1>
      {register && <label className="field"><span>Name</span><input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></label>}
      <label className="field"><span>Email</span><input className="input" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
      <label className="field"><span>Password</span><input className="input" type="password" required minLength={8} value={f.password} onChange={set('password')} autoComplete={register ? 'new-password' : 'current-password'} /></label>
      {error && <p className="error" role="alert" style={{ margin: 0 }}>{error}</p>}
      <button className="btn block" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
      <p className="muted" style={{ textAlign: 'center', margin: 0 }}>{register ? <>Already a member? <Link to="/login" className="link">Sign in</Link></> : <>New here? <Link to="/register" className="link">Create an account</Link></>}</p>
    </form>
  );
}
