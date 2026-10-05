import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { api } from '../api';
import BagDrawer from './BagDrawer';
import Logo from './Logo';

const NOTES = ['Delivering to the UK, Europe & USA', 'Minimal. Purposeful. Everyday essentials.', 'Designed in London'];
const LINKS = [['/shop', 'Shop'], ['/men', 'Men'], ['/women', 'Women'], ['/story', 'Story']];
const SYMBOL = { GBP: '£ GBP', USD: '$ USD', EUR: '€ EUR', AED: 'AED' };

export default function Layout() {
  const { count, setBagOpen, user, toast, settings, currency, setCurrency, currencies } = useApp();
  const [menu, setMenu] = useState(false);
  const [hide, setHide] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hov, setHov] = useState(false);
  const loc = useLocation();
  const over = loc.pathname === '/' && !scrolled && !menu && !hov; // transparent header over the home hero
  const notes = settings?.announcements?.length ? settings.announcements : NOTES;

  // header slides away while reading down, returns the moment you scroll up (or reach the top)
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (Math.abs(y - last) < 8) return;
      setHide(y > 240 && y > last);
      last = y;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    setMenu(false);
    if (loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150); // e.g. /#story
    else window.scrollTo(0, 0);
  }, [loc.pathname, loc.hash]);

  return (
    <>
      <div className="announce"><div className="marquee">{[...notes, ...notes, ...notes, ...notes].map((n, i) => <span key={i}>{n}</span>)}</div></div>
      <header className={`header ${hide ? 'hide' : ''} ${over ? 'over' : ''}`} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div className="wrap header-in">
          <nav className="nav">{LINKS.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}</nav>
          <button className="burger" onClick={() => setMenu(true)}>Menu</button>
          <Link to="/" aria-label="Chalk&Coal home"><Logo tone={over ? 'chalk' : 'ink'} /></Link>
          <div className="tools">
            <select className="cur hide-sm" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
              {currencies.map((c) => <option key={c} value={c}>{SYMBOL[c]}</option>)}
            </select>
            <Link to={user ? '/account' : '/login'} className="hide-sm" aria-label={user ? 'Account' : 'Sign in'}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
            </Link>
            <button onClick={() => setBagOpen(true)} aria-label="Open bag">
              <svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
              ({count})
            </button>
          </div>
        </div>
      </header>
      {menu && (
        <div className="mobile-nav">
          <button className="eyebrow" onClick={() => setMenu(false)}>Close</button>
          {LINKS.map(([to, l]) => <Link key={to} to={to}>{l}</Link>)}
          <Link to={user ? '/account' : '/login'}>{user ? 'Account' : 'Sign in'}</Link>
          <div className="pills" style={{ marginTop: 12 }}>{currencies.map((c) => <button key={c} className={`pill ${c === currency ? 'on' : ''}`} onClick={() => setCurrency(c)}>{c}</button>)}</div>
        </div>
      )}
      <main key={loc.pathname} className="page"><Outlet /></main>
      <Footer />
      <BagDrawer />
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export function Newsletter() {
  const { setToast } = useApp();
  const [email, setEmail] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/api/newsletter', { email }); setToast('Welcome to CHALK / COAL.'); setEmail(''); }
    catch (err) { setToast(err.message); }
  };
  return (
    <section className="section news wrap">
      <span className="eyebrow">Join the list</span>
      <h2>New drops, first.</h2>
      <form onSubmit={submit}>
        <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
        <button className="eyebrow">Subscribe</button>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div><Logo tone="chalk" /><p className="muted" style={{ maxWidth: 320 }}>Minimal. Purposeful. Everyday essentials. Designed in London.</p></div>
          <div><h4 className="eyebrow">Shop</h4><ul><li><Link to="/men">Men</Link></li><li><Link to="/women">Women</Link></li><li><Link to="/shop?category=training">Training</Link></li></ul></div>
          <div><h4 className="eyebrow">Help</h4><ul><li><Link to="/account">Track an order</Link></li><li>Delivery &amp; returns</li><li>Size guide</li></ul></div>
          <div><h4 className="eyebrow">House</h4><ul><li><Link to="/story">Our story</Link></li><li>Designed in London</li><li>Made in India</li></ul></div>
        </div>
        <Logo tone="chalk" className="mega" />
        <div className="footer-bottom"><span>© 2026 CHALK / COAL. All rights reserved.</span><span>Delivering to the UK, Europe, USA &amp; UAE</span></div>
      </div>
    </footer>
  );
}
