import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Fabric3D from '../components/Fabric3D';
import HeroSlider from '../components/HeroSlider';
import NewArrivals from '../components/NewArrivals';
import LoopVideo from '../components/LoopVideo';
import Reveal from '../components/Reveal';
import { DesignDetails, Packaging } from '../components/Details';
import { Newsletter } from '../components/Layout';
import { useApp } from '../store';
import { api } from '../api';
import { useSeo } from '../seo';

const COLOURS = [
  ['Chalk', '#ece8df', 'Clean. Modern. Versatile.'],
  ['Ash', '#8b8a87', 'Refined. Subtle. Timeless.'],
  ['Coal', '#151515', 'Bold. Classic. Always relevant.'],
];
const WORDS = ['Chalk', 'Ash', 'Coal', 'Designed in London', 'Heavyweight 240 – 420gsm', 'Minimal', 'Purposeful'];
const LOOKS = [
  ['look-1', '/men', 'Men', 'Black and white portrait of a man in a worn jacket'],
  ['look-2', '/women', 'Women', 'Black and white portrait of a woman in a knit and coat'],
  ['look-3', '/shop', 'Shop all', 'Monochrome concrete staircase and architecture'],
  ['look-5', '/women', 'Women', 'Backlit black and white portrait of a woman in a hat'],
];

function TrustBar() {
  const { fmt, market } = useApp();
  const items = [['Free delivery', `On orders over ${fmt(market.freeOver)}`], ['30-day returns', 'Unworn, with tags'], ['Designed in London', 'Made in India'], ['Secure checkout', 'Card or pay on delivery']];
  return <div className="trust">{items.map(([t, d]) => <div key={t}><b>{t}</b><span>{d}</span></div>)}</div>;
}

function Lookbook() {
  return (
    <section className="lookbook wrap">
      <Reveal className="sec-title"><h2>The lookbook</h2><small>AW26</small><hr /></Reveal>
      <div className="look-grid">
        {LOOKS.map(([f, to, label, alt], i) => (
          <Reveal key={f} mask delay={i * 90}>
            <Link to={to} className="look"><img src={`/editorial/${f}.jpg`} width="900" height="1125" loading="lazy" decoding="async" alt={alt} /><span className="eyebrow">{label} →</span></Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  useSeo({ title: 'Chalk&Coal — Minimal, Purposeful Everyday Essentials | Designed in London', description: 'Monochrome essentials in Chalk, Ash and Coal. Heavyweight tees, hoodies and joggers, 150–420gsm. Designed in London. Delivering to the UK, Europe and USA.' });
  const { fmt, priceOf } = useApp();
  const [feature, setFeature] = useState(null);
  useEffect(() => { api.get('/api/products?gender=men&category=sweats&limit=1&sort=popular').then((d) => setFeature(d.items[0])).catch(() => {}); }, []);

  return (
    <>
      <h1 className="sr-only">Chalk&amp;Coal — minimal, purposeful everyday essentials, designed in London</h1>
      <HeroSlider />
      <TrustBar />

      <div className="statement" aria-hidden><div className="marquee">{[...WORDS, ...WORDS, ...WORDS].map((w, i) => <span key={i}>{w}</span>)}</div></div>

      {/* Women | Men — two tall editorial panels */}
      <section className="cats" aria-label="Shop by collection">
        {[['women', 'Women', 'hero-women', '40% 25%', 'Black and white portrait of a woman in a coat'], ['men', 'Men', 'hero-men', '30% 30%', 'Black and white portrait of a man']].map(([to, label, img, pos, alt]) => (
          <Reveal key={to} mask>
            <Link to={`/${to}`} className="cat">
              <img src={`/editorial/${img}.jpg`} alt={alt} style={{ objectPosition: pos }} loading="lazy" decoding="async" />
              <div><h2>{label}</h2><span className="ulink">Shop {label.toLowerCase()} <i>→</i></span></div>
            </Link>
          </Reveal>
        ))}
      </section>

      <NewArrivals />

      {/* Campaign film — the essential */}
      <section className="campaign" aria-label="The Heavyweight Hoodie">
        <LoopVideo className="campaign-media" src="/media/feature-hoodie.mp4" poster="/media/feature-hoodie.jpg" style={{ objectPosition: '30% 40%' }} label="Black and white film of a woman in an oversized hoodie" />
        <div className="wrap campaign-copy">
          <Reveal><span className="eyebrow">The essential</span></Reveal>
          <Reveal delay={100}><h2>The heavyweight<br />hoodie</h2></Reveal>
          <Reveal delay={200} className="campaign-meta">
            <p>420gsm brushed fleece, twin-needle topstitch and a tonal badge. Cut to be worn all day, every day.</p>
            {feature && <span className="price">{fmt(priceOf(feature))}</span>}
            <Link to={feature ? `/product/${feature.slug}` : '/shop?category=sweats'} className="ulink">Discover <i>→</i></Link>
          </Reveal>
        </div>
      </section>

      {/* Chapter I — the story (also reachable at /#story) */}
      <section id="story" className="chapter">
        <Reveal mask className="chapter-art"><Fabric3D tone="coal" /></Reveal>
        <Reveal className="chapter-copy">
          <span className="numeral">I</span>
          <span className="eyebrow muted">The story</span>
          <h2 className="quote">Built for the <em>in-between.</em></h2>
          <p>Between the meeting and the gym. Between the flight and the first coffee. Most of life happens in the in-between — and almost nothing is made for it.</p>
          <p>So we made less, and made it properly: three colours, heavyweight fabric, a tonal badge and nothing that shouts.</p>
          <div className="cta-row">
            <Link to="/shop" className="btn">Shop the collection</Link>
            <Link to="/story" className="link">Read the story</Link>
          </div>
        </Reveal>
      </section>

      <Lookbook />

      {/* Macro fabric — a real cotton-jersey scan, CC0 (Poly Haven) */}
      <section className="macro" aria-label="Fabric detail">
        <div className="wrap">
          <Reveal><span className="eyebrow">Fabric</span></Reveal>
          <Reveal delay={100}><div className="big-num">420</div></Reveal>
          <Reveal delay={200} className="macro-copy">
            <h2>gsm heavyweight cotton.</h2>
            <p>Dense, brushed-back and cut with structure. Woven to keep its shape wash after wash — from 150gsm training jersey to 420gsm fleece.</p>
            <Link to="/shop" className="link">Feel the difference</Link>
          </Reveal>
        </div>
      </section>

      {/* Colour — three, nothing else */}
      <section className="colours">
        {COLOURS.map(([n, hex, d], i) => (
          <Link key={n} to={`/shop?color=${n}`} className={`colour ${i === 2 ? 'dark' : ''} ${i === 1 ? 'mid' : ''}`} style={{ background: hex }}>
            <span className="numeral">{['I', 'II', 'III'][i]}</span>
            <div><h3>{n}</h3><p>{d}</p><span className="eyebrow">Shop {n} →</span></div>
          </Link>
        ))}
      </section>

      <section className="section wrap">
        <Reveal className="sec-title"><h2>Key design details</h2><hr /></Reveal>
        <DesignDetails />
        <Reveal className="sec-title" style={{ marginTop: 72 }}><h2>Packaging &amp; branding</h2><hr /></Reveal>
        <Packaging />
      </section>

      <section className="final-cta" aria-label="Start shopping">
        <Reveal><span className="eyebrow">AW26</span></Reveal>
        <Reveal delay={100}><h2>Made for the in-between.</h2></Reveal>
        <Reveal delay={200}><p>Free delivery on orders over £120 across the UK. Easy returns.</p></Reveal>
        <Reveal delay={300} className="cta-row center">
          <Link to="/women" className="btn light">Shop women</Link>
          <Link to="/men" className="btn light">Shop men</Link>
        </Reveal>
      </section>

      <Newsletter />
    </>
  );
}
