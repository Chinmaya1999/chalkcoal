import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../seo';
import STYLES from '../data/styles.json';

const COLOURS = [
  ['Chalk', 'CH', '#EFEBE2', 'Warm off-white. Trim contrast and opacity assessed after wash.'],
  ['Ash', 'AS', '#93958F', 'Lifestyle: melange only after fibre and shade approval. Performance: solid-dyed flint, never melange.'],
  ['Coal', 'CO', '#252626', 'The anchor. Body, rib, cord and branding stay tonally aligned.'],
];

const PLATFORMS = [
  ['100% cotton compact single jersey', 'CC-U01'],
  ['100% cotton single jersey', 'CC-U02 · CC-U03 · CC-W01 · CC-W02'],
  ['100% cotton loopback French terry', 'CC-U04 · CC-U05 · CC-U06 · CC-W04 · CC-W05 · CC-W06 · CC-W07'],
  ['92% polyester / 8% elastane jersey', 'CC-U07 · CC-U08 · CC-W10 · CC-W11 · CC-W12'],
  ['90% polyester / 10% elastane stretch woven', 'CC-U09 · CC-W13'],
  ['95% cotton / 5% elastane single jersey', 'CC-W03'],
  ['95% cotton / 5% elastane compact interlock', 'CC-W08'],
  ['75% nylon / 25% elastane interlock', 'CC-W09 · CC-W14'],
];

const SHEETS = [
  ['Offset Slash', 'Selected direction', 'Compact directional mark; tonal embroidery and hem flags. Oversized tee, hoodie, cropped tee, tonal embroidery, inside neck label, hem flag and hangtag.'],
  ['Paired Corners', 'Alternative explored', 'Geometric signature; understated chest and thigh placements. Sweatshirt, cropped hoodie, joggers, tonal embroidery, inside neck label, hem flag and hangtag.'],
  ['Signature Ampersand', 'Alternative explored', 'Expressive identity; premium neck labels and hangtags. Polo, relaxed tee, sweatshirt, contrast embroidery, inside neck label, premium label options.'],
  ['Premium Label Options', 'Labels & trims', 'Inside-neck labels, size tabs, tagless print and packaging: ivory woven, black damask, soft cotton, hem flag, tagless print, textured hangtag.'],
  ['Embroidery Details', 'Finishes', 'Tonal stitching and contrasting Chalk / Coal finishes: tonal slash, tonal corners, chalk on coal, coal on chalk.'],
  ['Collection Applications', 'Concepts', 'Branded casualwear and performancewear concepts: cropped hoodie, relaxed tee, jogger, cycling short, train tank, train long sleeve.'],
];

const GUIDE = [
  ['Choose one primary mark', 'The three marks are alternatives, not a combined identity. Apply the selected symbol consistently across garments, neck labels and hangtags. Keep CHALK & COAL as the supporting wordmark.'],
  ['Cotton tees and fleece', 'Explore tonal embroidery first; use contrast as a second option. Start around 15–25 mm wide for chest or hem marks and 18–25 mm for upper-thigh placements. Confirm position on every silhouette.'],
  ['Performancewear', 'Explore smooth heat-transfer marks and tagless inside-neck branding. Keep placements away from high-stretch zones and friction points. Validate adhesion, stretch recovery, hand feel and wash performance.'],
  ['Labels and hangtags', 'Explore soft woven labels around 45 × 25 mm with a separate size tab. Use a small folded hem flag around 10–15 mm visible width. Keep care, fibre content and origin on a separate approved care label.'],
  ['Sample review', 'Review stitch definition, puckering, reverse-side comfort and label edges. Approve the artwork, placement, shade and construction on real samples. Confirm these proposals with the factory before production.'],
];

const TABS = [['overview', 'Overview'], ['colour', 'Colour'], ['fabrics', 'Fabrics'], ['styles', 'All 23 styles'], ['branding', 'Branding'], ['guide', 'Guide']];
const SIZES_NOTE = { unisex: 'S–XXL', women: 'XS–XL' };
const initialTab = () => { try { const h = location.hash.slice(1); return TABS.some(([k]) => k === h) ? h : 'overview'; } catch { return 'overview'; } };

const Stat = ({ n, l }) => <div><b className="numeral">{n}</b><span className="eyebrow muted">{l}</span></div>;
const Dots = ({ cs }) => <span className="cc-dots">{cs.map((c) => <i key={c.name} title={c.name} style={{ background: c.hex }} />)}</span>;

function Acc({ title, children, open }) {
  return <details className="acc" open={open}><summary>{title}</summary>{children}</details>;
}

function StyleModal({ list, i, setI }) {
  const s = list[i];
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') setI(null);
      if (e.key === 'ArrowRight') setI((i + 1) % list.length);
      if (e.key === 'ArrowLeft') setI((i - 1 + list.length) % list.length);
    };
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [i, list.length, setI]);
  return (
    <div className="cc-modal" role="dialog" aria-modal="true" aria-label={s.name} onClick={(e) => e.target === e.currentTarget && setI(null)}>
      <div className="cc-sheet">
        <button className="cc-x" onClick={() => setI(null)} aria-label="Close">✕</button>
        <img src={`/collection/${s.sku}.jpg`} alt={`${s.name} (${s.sku})`} />
        <div className="cc-info">
          <span className="eyebrow muted">{s.unisex ? 'Unisex' : 'Women'} · {s.sku}</span>
          <h2>{s.name}</h2>
          <p className="muted">{s.desc}</p>
          <dl>
            <dt>Fabric</dt><dd>{s.fabric}</dd>
            <dt>Weight</dt><dd>{s.gsm} gsm</dd>
            <dt>Sizes</dt><dd>{s.sizes.join(' / ')}</dd>
          </dl>
          <div className="coll-chips">{s.colours.map((c) => <span key={c.name}><i style={{ background: c.hex }} />{c.name}<small>{c.code}</small></span>)}</div>
          <span className="eyebrow muted">Signature details</span>
          <ol>{s.det.map((d, k) => <li key={d}><b className="numeral">0{k + 1}</b>{d}</li>)}</ol>
          <div className="cc-nav">
            <button className="btn ghost" onClick={() => setI((i - 1 + list.length) % list.length)}>← Prev</button>
            <span className="muted">{i + 1} / {list.length}</span>
            <button className="btn ghost" onClick={() => setI((i + 1) % list.length)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Styles() {
  const [seg, setSeg] = useState('all');
  const [col, setCol] = useState('all');
  const [open, setOpen] = useState(null);
  const list = STYLES.filter((s) => (seg === 'all' || (seg === 'unisex') === s.unisex) && (col === 'all' || s.colours.some((c) => c.name === col)));
  useEffect(() => setOpen(null), [seg, col]);
  const Chip = ({ v, cur, set, children }) => <button className={`cc-chip ${cur === v ? 'on' : ''}`} onClick={() => set(v)}>{children}</button>;
  return (
    <>
      <div className="cc-filters">
        <div>{[['all', 'All 23'], ['unisex', 'Unisex 9'], ['women', 'Women 14']].map(([v, l]) => <Chip key={v} v={v} cur={seg} set={setSeg}>{l}</Chip>)}</div>
        <div>{['all', 'Chalk', 'Ash', 'Coal'].map((v) => <Chip key={v} v={v} cur={col} set={setCol}>{v === 'all' ? 'Any colour' : v}</Chip>)}</div>
      </div>
      <p className="muted cc-hint">{seg === 'women' ? 'Women’s styles run XS–XL on their own grade rule.' : seg === 'unisex' ? 'Unisex styles run S–XXL on a single grade rule.' : 'Unisex runs S–XXL; women XS–XL.'} Tap a style for full details. Draft for sampling — not bulk approved.</p>
      <div className="cc-grid">
        {list.map((s, i) => (
          <button key={s.sku} className="cc-card" onClick={() => setOpen(i)}>
            <img src={`/collection/${s.sku}.jpg`} alt="" loading="lazy" />
            <span className="cc-meta"><small className="muted">{s.sku}</small><b>{s.name}</b><span className="muted">{s.gsm} gsm</span><Dots cs={s.colours} /></span>
          </button>
        ))}
        {!list.length && <p className="muted">No styles match.</p>}
      </div>
      {open !== null && list[open] && <StyleModal list={list} i={open} setI={setOpen} />}
    </>
  );
}

function Branding() {
  const [k, setK] = useState(0);
  const [t, tag, p] = SHEETS[k];
  return (
    <div className="cc-brand">
      <div className="cc-brand-nav">{SHEETS.map(([n], i) => <button key={n} className={`cc-chip ${i === k ? 'on' : ''}`} onClick={() => setK(i)}>{n}</button>)}</div>
      <div className="cc-brand-view">
        <div><span className="eyebrow muted">{tag}</span><h2>{t}</h2><p>{p}</p>
          {k === 0 && <p className="muted">Chosen for the range: tonal slash embroidery, printed inside identity and a subtle side flag.</p>}
          <p className="muted small">Concept visuals for review. Mockup garments illustrate branding; the 23-style range is unchanged.</p></div>
        <img src={`/collection/brand-${k + 1}.jpg`} alt={`${t} — branding concept sheet`} />
      </div>
    </div>
  );
}

export default function Collection() {
  useSeo({ title: 'Collection One — Autumn Winter 2026', description: 'The Chalk&Coal Collection One catalogue: twenty-three styles, eight fabric platforms, three colours, construction details and branding.' });
  const [tab, setTab] = useState(initialTab);
  const go = (k) => { setTab(k); try { history.replaceState(null, '', `#${k}`); } catch { /* ignore */ } };
  return (
    <div className="cc">
      <section className="wrap cc-top">
        <span className="eyebrow muted">Collection One · Autumn Winter 2026</span>
        <h1 className="quote">Nothing to hide <em>behind.</em></h1>
        <nav className="cc-tabs" role="tablist">
          {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => go(k)}>{l}</button>)}
        </nav>
      </section>

      <section className="wrap cc-panel">
        {tab === 'overview' && (
          <div className="cc-ov">
            <div>
              <p className="coll-lede">Three colours across every style, every season. No print, no graphic, no seasonal palette. What is left is fabric weight, silhouette and the quality of a hem — the only ground worth competing on.</p>
              <p className="muted">Every style carries a design concept, fabric platform, fit direction and signature construction points. Graded measurements and full construction sheets are issued separately as tech packs and govern production.</p>
              <div className="coll-stats"><Stat n="23" l="Styles" /><Stat n="46" l="Colour options" /><Stat n="8" l="Fabric bases" /><Stat n="3" l="Colours" /><Stat n="150–420" l="GSM" /></div>
              <table className="coll-table">
                <thead><tr><th>Range</th><th>Styles</th><th>Options</th><th>Sizes</th></tr></thead>
                <tbody>
                  <tr><td>Unisex</td><td className="numeral">9</td><td className="numeral">18</td><td>{SIZES_NOTE.unisex}</td></tr>
                  <tr><td>Women</td><td className="numeral">14</td><td className="numeral">28</td><td>{SIZES_NOTE.women}</td></tr>
                  <tr className="total"><td>Total</td><td className="numeral">23</td><td className="numeral">46</td><td>150–420 gsm</td></tr>
                </tbody>
              </table>
              <div className="coll-links"><button className="btn" onClick={() => go('styles')}>Browse the 23 styles</button><Link to="/shop" className="btn ghost">Shop</Link></div>
            </div>
            <img className="cc-cover" src="/collection/cover.jpg" alt="Chalk & Coal Collection One" />
          </div>
        )}

        {tab === 'colour' && (
          <>
            <div className="coll-colours">
              {COLOURS.map(([n, code, hex, note]) => (
                <div key={n} className="coll-swatch"><i style={{ background: hex }} /><h3>{n}</h3><span className="eyebrow muted">{code} · {hex.slice(1)}</span><p>{note}</p></div>
              ))}
            </div>
            <div className="cc-acc">
              <Acc title="Lifestyle & performance Ash" open><p>Lifestyle Ash: melange permitted only after fibre content and shade approval. Performance Ash: solid-dyed flint, never melange. No white training or cycling shorts.</p></Acc>
              <Acc title="Chalk"><p>Warm off-white direction. Assess trim contrast and opacity after wash. Women’s Flared Pant in Chalk is conditional on stretch and damp-opacity trials — approve Coal first if Chalk cannot meet the coverage target.</p></Acc>
              <Acc title="Branding colour"><p>Tonal slash only, no contrast graphics. Printed inside identity, subtle side flag.</p></Acc>
              <Acc title="Colour standards"><p>Digital swatches are indicative, not textile colour standards. Approve physical lab dips against a signed master standard in daylight and store lighting. Body, rib, cord and branding must stay tonally aligned.</p></Acc>
            </div>
          </>
        )}

        {tab === 'fabrics' && (
          <>
            <p className="coll-lede">Eight bases carry twenty-three styles. Fewer platforms shorten the approval path, consolidate yarn buying and mean one shade correction fixes several styles.</p>
            <div className="cc-plat">
              {PLATFORMS.map(([f, s]) => (
                <div key={f} className="cc-plat-row"><b className="numeral">{s.split('·').length}</b><div><span>{f}</span><small className="muted">{s}</small></div></div>
              ))}
            </div>
          </>
        )}

        {tab === 'styles' && <Styles />}
        {tab === 'branding' && <Branding />}

        {tab === 'guide' && (
          <div className="cc-acc">
            <p className="coll-lede">Quiet by design. Proposed starting points for the first physical samples.</p>
            {GUIDE.map(([t, p], i) => <Acc key={t} title={t} open={i === 0}><p>{p}</p></Acc>)}
            <Acc title="Important notice"><p>This catalogue is a development document issued for sampling. Visuals are indicative renders, not approved samples. Measurements, construction, trims and colour standards are governed by the tech packs and signed sealing samples. Nothing here authorises bulk production. Collection One · Development Edition · 05 October 2026.</p></Acc>
          </div>
        )}
      </section>
    </div>
  );
}
