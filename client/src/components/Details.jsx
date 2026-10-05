import Reveal from './Reveal';

const S = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' };
const Slashes = ({ w = 2.4 }) => <path d="M42 22 L30 58 M58 22 L46 58" {...S} strokeWidth={w} />;

const DETAILS = [
  ['dark', '18mm rubberised badge', 'Left chest (tonal)', <svg viewBox="0 0 100 80" key="a"><rect x="30" y="14" width="40" height="40" rx="6" fill="#222" stroke="#444" /><g transform="translate(14 0)"><Slashes /></g></svg>],
  ['dark', 'Printed neck label', 'No woven tag', <svg viewBox="0 0 100 80" key="b"><text x="50" y="34" textAnchor="middle" fontSize="7.5" letterSpacing="2.4" fill="currentColor" fontFamily="Jost, sans-serif">CHALK / COAL</text><text x="50" y="46" textAnchor="middle" fontSize="6" fill="currentColor" fontFamily="Jost, sans-serif">M</text><text x="50" y="58" textAnchor="middle" fontSize="3.4" letterSpacing="1.4" fill="currentColor" opacity=".6" fontFamily="Jost, sans-serif">MADE IN INDIA</text></svg>],
  ['light', 'Woven hem flag', '10mm, left side seam (6cm up)', <svg viewBox="0 0 100 80" key="c"><path d="M10 40 H90" stroke="#aaa" strokeDasharray="2 2" /><rect x="44" y="26" width="12" height="30" fill="#151515" /><g transform="translate(14 -3) scale(.9)" stroke="#f3f1ec"><path d="M36 38 L33 48 M42 38 L39 48" {...S} strokeWidth="1.2" /></g></svg>],
  ['dark', 'Matte black drawcord tips', 'Metal, flat 8mm', <svg viewBox="0 0 100 80" key="d"><rect x="22" y="30" width="56" height="9" rx="4.5" fill="#2a2a2a" stroke="#555" /><rect x="22" y="46" width="56" height="9" rx="4.5" fill="#1f1f1f" stroke="#555" /></svg>],
  ['mid', 'Twin-needle topstitch', 'Straight hem', <svg viewBox="0 0 100 80" key="e"><path d="M10 38 H90 M10 46 H90" stroke="currentColor" strokeDasharray="4 3" strokeWidth="1.4" /></svg>],
  ['light', 'Premium fabric weights', '240gsm / 400gsm / 420gsm', <svg viewBox="0 0 100 80" key="f"><g fontFamily="Jost, sans-serif" fill="currentColor" textAnchor="middle"><text x="22" y="46" fontSize="14" fontWeight="300">240</text><text x="50" y="46" fontSize="14" fontWeight="300">400</text><text x="78" y="46" fontSize="14" fontWeight="300">420</text><text x="50" y="60" fontSize="4.4" letterSpacing="2">GSM</text></g></svg>],
];
const PACK = [
  ['dark', 'Eco-friendly poly bag', 'Recycled material', <svg viewBox="0 0 100 80" key="p1"><rect x="18" y="12" width="64" height="58" rx="3" fill="#202020" stroke="#444" /><text x="50" y="44" textAnchor="middle" fontSize="6" letterSpacing="2" fill="currentColor" fontFamily="Jost, sans-serif">CHALK / COAL</text></svg>],
  ['mid', 'Tonal hang tag', 'With texture', <svg viewBox="0 0 100 80" key="p2"><rect x="32" y="8" width="36" height="64" rx="2" fill="#2b2b2b" stroke="#888" /><circle cx="50" cy="16" r="2.4" fill="#6f6e6b" /><g transform="translate(14 14) scale(.5)"><Slashes w={3} /></g><text x="50" y="58" textAnchor="middle" fontSize="3.6" letterSpacing="1.2" fill="currentColor" fontFamily="Jost, sans-serif">CHALK / COAL</text></svg>],
  ['light', 'Minimal branded box', 'Optional for premium orders', <svg viewBox="0 0 100 80" key="p3"><path d="M20 28 L50 14 L80 28 V60 L50 72 L20 60 Z M20 28 L50 42 L80 28 M50 42 V72" fill="#cfcdc8" stroke="#151515" strokeWidth="1" /><g transform="translate(15 4) scale(.3)"><Slashes w={3} /></g></svg>],
  ['mid', 'Inside print label', 'Care instructions', <svg viewBox="0 0 100 80" key="p4"><rect x="14" y="30" width="72" height="20" fill="#8b8a87" stroke="#d6d4ce" /><text x="50" y="43" textAnchor="middle" fontSize="5.4" letterSpacing="2" fill="currentColor" fontFamily="Jost, sans-serif">CHALK / COAL</text></svg>],
];

const Grid = ({ rows, four }) => (
  <div className={`tiles ${four ? 'four' : ''}`}>
    {rows.map(([tone, t, c, art], i) => (
      <Reveal key={t} delay={i * 60} className="tile">
        <figure className={tone}>{art}</figure>
        <figcaption><b>{t}</b>{c}</figcaption>
      </Reveal>
    ))}
  </div>
);

export const DesignDetails = () => <Grid rows={DETAILS} />;
export const Packaging = () => <Grid rows={PACK} four />;
