import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LoopVideo from './LoopVideo';
import { useApp } from '../store';

const SLIDE_MS = 8500;
const DEFAULTS = [
  { key: 'women', ms: 30000, src: '/media/hero-women.mp4', poster: '/media/hero-women.jpg', pos: '52% 30%', eyebrow: "AW26 · Women's collection", title: 'The in\u2011between', cta: 'Shop women', to: '/women', alt: 'Black and white film of a woman in a hat adjusting a scarf' },
  { key: 'street', src: '/media/hero-street.mp4', poster: '/media/hero-men.jpg', pos: '50% 35%', eyebrow: 'AW26 · The collection', title: 'Monochrome, on the street', cta: 'Shop all', to: '/shop', alt: 'Models wearing monochrome streetwear' },
  { key: 'hoodie', src: '/media/feature-hoodie.mp4', poster: '/media/feature-hoodie.jpg', pos: '35% 40%', eyebrow: 'The essential · 420gsm', title: 'Heavyweight hoodie', cta: 'Discover', to: '/shop?category=sweats', alt: 'Black and white film of a woman in an oversized hoodie' },
];

export default function HeroSlider() {
  const { settings } = useApp();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(reduced);
  const timer = useRef(null);

  // Photos or videos uploaded in Admin → Site content replace the first two slides
  const slides = DEFAULTS.map((s) => {
    const m = settings?.collections?.[s.key];
    return m?.url ? { ...s, upload: m } : s;
  });

  const go = useCallback((n) => setIdx((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (paused) return;
    timer.current = setTimeout(() => go(idx + 1), slides[idx].ms || SLIDE_MS);
    return () => clearTimeout(timer.current);
  }, [idx, paused, go]);

  useEffect(() => {
    const onVis = () => setPaused((p) => (document.hidden ? true : reduced));
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reduced]);

  return (
    <section className="hero-full" aria-roledescription="carousel" aria-label="Featured collections">
      {slides.map((s, i) => (
        <div key={s.key} className={`slide ${i === idx ? 'on' : ''}`} aria-hidden={i !== idx} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
          {s.upload?.type === 'image' ? (
            <img className="slide-media" src={s.upload.url} alt={s.alt} style={{ objectPosition: s.pos }} fetchpriority={i === 0 ? 'high' : 'auto'} />
          ) : (
            <LoopVideo className="slide-media" src={s.upload?.url || s.src} poster={s.poster} style={{ objectPosition: s.pos }} active={i === idx} eager={i === 0} label={s.alt} />
          )}
          <div className="slide-copy">
            <span className="eyebrow">{s.eyebrow}</span>
            <h2>{s.title}</h2>
            <Link to={s.to} className="ulink" tabIndex={i === idx ? 0 : -1}>{s.cta} <i>→</i></Link>
          </div>
        </div>
      ))}
      <div className="hero-ctl">
        <span className="count">0{idx + 1} / 0{slides.length}</span>
        <div className="hbars" role="tablist" aria-label="Choose slide">
          {slides.map((s, i) => (
            <button key={s.key} role="tab" aria-selected={i === idx} aria-label={`Show slide ${i + 1}`} className={`hbar ${i === idx ? 'on' : ''} ${paused ? 'paused' : ''}`} onClick={() => go(i)}>
              <i key={`${idx}-${i}`} style={i === idx && !paused ? { animationDuration: `${s.ms || SLIDE_MS}ms` } : undefined} />
            </button>
          ))}
        </div>
        <button className="pp" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>{paused ? '▶' : '❚❚'}</button>
      </div>
    </section>
  );
}
