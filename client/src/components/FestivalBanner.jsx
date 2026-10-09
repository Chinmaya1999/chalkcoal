import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import Logo from './Logo';
import { resolveFestival, isLive } from '../festivals';

// ---------- illustrations (simple SVG, drawn with the theme's accent colour) ----------
const ART = {
  diya: (a) => (
    <g>
      {[[40, 70, 0.8], [100, 62, 1], [160, 70, 0.8]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <circle cx="0" cy="-12" r="34" fill={a} opacity="0.12" />
          <path d="M-30 4h60c0 16-13 26-30 26S-30 20-30 4Z" fill={a} />
          <path d="M0-40c10 12 14 20 7 31-3 4-11 4-14 0-7-11-3-19 7-31Z" fill="#ffd27a" />
          <path d="M0-24c4 6 6 9 3 14-1 2-5 2-6 0-3-5-1-8 3-14Z" fill="#ff7a1a" />
        </g>
      ))}
    </g>
  ),
  crescent: (a) => (
    <g fill={a}>
      <path d="M118 12a50 50 0 1 0 0 96 40 40 0 1 1 0-96Z" />
      <path d="M150 38l4 11 12 1-9 8 3 12-10-7-10 7 3-12-9-8 12-1Z" />
      <circle cx="40" cy="30" r="2.5" /><circle cx="170" cy="90" r="2" /><circle cx="26" cy="86" r="2" />
    </g>
  ),
  tree: (a) => (
    <g>
      <path d="M100 14l12 22 -6 0 18 26 -8 0 22 32H62l22-32h-8l18-26h-6Z" fill="#1f6b3a" />
      <rect x="95" y="94" width="10" height="14" fill="#6b4423" />
      <path d="M100 4l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill={a} />
      {[[88, 62], [112, 74], [96, 84], [76, 94]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={i % 2 ? a : '#e0443e'} />)}
    </g>
  ),
  fireworks: (a) => (
    <g stroke={a} strokeWidth="3" strokeLinecap="round">
      {[[55, 50, 1], [140, 40, 0.8], [105, 85, 0.6]].map(([x, y, s], k) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
          {Array.from({ length: 12 }).map((_, i) => <line key={i} x1="0" y1="-12" x2="0" y2="-34" transform={`rotate(${i * 30})`} />)}
          <circle r="4" fill={a} stroke="none" />
        </g>
      ))}
    </g>
  ),
  heart: (a) => <g><path d="M100 100C40 62 50 20 80 22c12 0 20 8 20 16 0-8 8-16 20-16 30-2 40 40-20 78Z" fill={a} /><path d="M150 30c-8-8-20 4-8 14 8-4 14-10 8-14Z" fill={a} opacity="0.6" /></g>,
  splash: () => (
    <g>
      {[['#ff3d81', 70, 55, 34], ['#ffd23f', 115, 45, 28], ['#2ec4b6', 100, 80, 30], ['#7b2ff7', 145, 70, 24], ['#ff8a1f', 55, 85, 20]].map(([c, x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={c} opacity="0.85" />)}
    </g>
  ),
  chakra: () => (
    <g>
      <rect x="40" y="22" width="120" height="25" fill="#ff9933" /><rect x="40" y="47" width="120" height="25" fill="#fff" /><rect x="40" y="72" width="120" height="25" fill="#138808" />
      <g stroke="#000080" strokeWidth="1" fill="none"><circle cx="100" cy="59.5" r="11" />{Array.from({ length: 12 }).map((_, i) => <line key={i} x1="100" y1="59.5" x2="100" y2="48.5" transform={`rotate(${i * 30} 100 59.5)`} />)}</g>
    </g>
  ),
  pumpkin: () => (
    <g>
      <ellipse cx="100" cy="68" rx="52" ry="40" fill="#f26a0c" /><ellipse cx="78" cy="68" rx="24" ry="38" fill="#ff8a1f" opacity="0.7" /><ellipse cx="122" cy="68" rx="24" ry="38" fill="#ff8a1f" opacity="0.7" />
      <path d="M96 30c0-12 6-18 14-20" stroke="#4a7a2b" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M78 60l10 10-14 2Zm44 0l-10 10 14 2ZM82 84q18 14 36 0l-6-4-6 4-6-4-6 4Z" fill="#1a0b00" />
    </g>
  ),
  tag: (a) => (
    <g>
      <path d="M50 28h60l40 40-48 48-52-52Z" fill={a} /><circle cx="76" cy="50" r="7" fill="#050505" />
      <text x="118" y="82" fontSize="34" fontWeight="700" fill="#050505" transform="rotate(45 118 82)">%</text>
    </g>
  ),
};

// ---------- falling / rising particles ----------
export function Particles({ effect = 'confetti', count = 16, colors }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, delay: -Math.random() * 14, dur: 9 + Math.random() * 9, size: 5 + Math.random() * 9, drift: (Math.random() - 0.5) * 120, i,
  })), [count]);
  return (
    <div className={`fx fx-${effect}`} aria-hidden>
      {items.map((p) => <i key={p.i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, '--s': `${p.size}px`, '--dx': `${p.drift}px`, '--c': colors?.[p.i % colors.length] }} />)}
    </div>
  );
}
const PALETTE = { confetti: ['#f6d365', '#fff', '#e9c46a', '#f4a261'], petals: ['#ff3d81', '#ffd23f', '#2ec4b6', '#7b2ff7', '#ff8a1f'] };

// ---------- the banner itself (also used for the live preview in admin) ----------
export function BannerView({ f, preview = false, onClose }) {
  const t = resolveFestival(f);
  if (!t) return null;
  const colors = PALETTE[t.effect];
  const style = { '--f-bg': t.bg, '--f-bg2': t.bg2, '--f-accent': t.accent, '--f-text': t.text, ...(t.image ? { '--f-img': `url(${t.image})` } : {}) };
  return (
    <section className={`festival ${t.image ? 'has-img' : ''}`} style={style} aria-label={t.title}>
      <Particles effect={t.effect} count={14} colors={colors} />
      <div className="festival-in">
        {t.showLogo && <div className="festival-logo"><Logo tone="chalk" /></div>}
        <div className="festival-copy">
          {t.label && <span className="eyebrow">{t.label}{t.country ? ` · ${t.country.split('·')[0].trim()}` : ''}</span>}
          <h2>{t.title}</h2>
          {t.message && <p>{t.message}</p>}
          {preview ? <span className="btn light">{t.cta}</span> : (t.link?.startsWith('http') ? <a className="btn light" href={t.link}>{t.cta}</a> : <Link className="btn light" to={t.link || '/shop'}>{t.cta}</Link>)}
        </div>
        {!t.image && ART[t.art] && <svg className="festival-art" viewBox="0 0 200 120" aria-hidden>{ART[t.art](t.accent)}</svg>}
      </div>
      {!preview && <button className="festival-x" onClick={onClose} aria-label="Dismiss">×</button>}
    </section>
  );
}

// ---------- storefront wiring: banner under the ticker + optional site-wide effect ----------
export default function FestivalBanner() {
  const { settings } = useApp();
  const f = settings?.festival;
  const [closed, setClosed] = useState(() => { try { return sessionStorage.getItem('cc_festival_x') === '1'; } catch { return false; } });
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!f || !isLive(f)) return null;
  const t = resolveFestival(f);
  if (!t) return null;
  return (
    <>
      {!closed && <BannerView f={f} onClose={() => { setClosed(true); try { sessionStorage.setItem('cc_festival_x', '1'); } catch {} }} />}
      {f.sitewide && !reduced && <div className="fx-site"><Particles effect={t.effect} count={14} colors={PALETTE[t.effect]} /></div>}
    </>
  );
}
