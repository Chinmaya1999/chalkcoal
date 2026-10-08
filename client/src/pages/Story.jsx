import { Link } from 'react-router-dom';
import { Newsletter } from '../components/Layout';
import Reveal from '../components/Reveal';
import Fabric3D from '../components/Fabric3D';
import { DesignDetails, Packaging } from '../components/Details';
import { useSeo } from '../seo';

const CHAPTERS = [
  ['I', 'The in-between', 'Between the meeting and the gym. Between the flight and the first coffee. Between who you were at nine and who you need to be by six. Most of life happens in the in-between — and almost nothing is made for it.'],
  ['II', 'Three colours', 'Chalk, Ash and Coal. Purely monochrome, with nothing to match and nothing to decide. No seasonal noise, no logos shouting across the street — only pieces that work harder the longer you wear them.'],
  ['III', 'Weight you can feel', 'From 150gsm training jersey to 420gsm heavyweight French terry — eight fabric platforms carry all twenty-three styles. Every style is finished with clean twin-needle or stretch coverstitch hems, and marked only by a tonal slash, a printed inside label and a subtle side flag.'],
  ['IV', 'Designed in London', 'Collection One, Autumn Winter 2026: nine unisex styles (S–XXL) and fourteen for women (XS–XL), forty-six style and colour options in all. Every pattern is drawn in London and developed with partner workshops in India; each piece ships in recycled packaging.'],
];

export default function Story() {
  useSeo({ title: 'Our Story — Designed in London', description: 'Three colours, heavyweight fabric and nothing that shouts. The story behind Chalk&Coal — designed in London, made in India.' });
  return (
    <>
      <section className="story-hero">
        <Fabric3D tone="coal" className="fab" />
        <div className="wrap"><span className="eyebrow">The story</span><h1 className="quote">Minimal. Purposeful.<br /><em>Everyday essentials.</em></h1></div>
      </section>
      <section className="wrap" style={{ paddingBlock: 'clamp(56px,9vw,130px)' }}>
        {CHAPTERS.map(([n, t, p], i) => (
          <Reveal key={n} className={`story-chapter ${i % 2 ? 'flip' : ''}`}>
            <span className="numeral big">{n}</span>
            <div><h2>{t}</h2><p>{p}</p></div>
          </Reveal>
        ))}
        <Reveal mask className="story-band" role="img" aria-label="Monochrome concrete staircase" />
        <Reveal style={{ textAlign: 'center', marginTop: 56 }}><Link to="/shop" className="btn">Shop the collection</Link></Reveal>
      </section>
      <section className="wrap" style={{ paddingBottom: 96 }}>
        <div className="sec-title"><h2>Key design details</h2><hr /></div>
        <DesignDetails />
        <div className="sec-title" style={{ marginTop: 64 }}><h2>Packaging &amp; branding</h2><hr /></div>
        <Packaging />
      </section>
      <Newsletter />
    </>
  );
}
