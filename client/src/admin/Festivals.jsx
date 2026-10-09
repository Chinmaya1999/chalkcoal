import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../store';
import { THEMES, BLANK } from '../festivals';
import { BannerView } from '../components/FestivalBanner';

const COUNTRIES = ['All', 'India', 'UK', 'USA', 'Middle East'];

export default function Festivals() {
  const { settings, setSettings, setToast } = useApp();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [country, setCountry] = useState('All');
  useEffect(() => { if (settings) setF({ ...BLANK, ...(settings.festival || {}) }); }, [settings]);
  if (!f) return <p className="muted">Loading…</p>;

  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  // picking a theme fills in its greeting; anything typed afterwards overrides it
  const pick = (key) => { const t = THEMES[key]; set({ theme: key, title: t.title, message: t.message, cta: t.cta }); };
  const upload = async (file) => {
    const fd = new FormData(); fd.append('images', file);
    try { const { urls } = await api.post('/api/admin/upload', fd); set({ image: urls[0] }); } catch (e) { setToast(e.message); }
  };
  const save = async () => {
    setBusy(true);
    try {
      await api.put('/api/admin/settings', { festival: { ...f, link: f.link || '/shop' } });
      setSettings(await api.get('/api/settings')); setToast(f.enabled ? 'Festival theme is live' : 'Saved (festival theme is off)');
    } catch (e) { setToast(e.message); }
    setBusy(false);
  };
  const shown = Object.entries(THEMES).filter(([, t]) => country === 'All' || t.country.includes(country) || t.country.includes('Worldwide'));

  return (
    <>
      <div className="a-top"><h1>Festivals</h1><button className="btn sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      <div className="stack">
        <div className="a-card">
          <h3>1 · Pick a festival design</h3>
          <div className="pills" style={{ marginBottom: 14 }}>{COUNTRIES.map((c) => <button key={c} className={`pill ${c === country ? 'on' : ''}`} onClick={() => setCountry(c)}>{c}</button>)}</div>
          <div className="fest-grid">
            {shown.map(([k, t]) => (
              <button key={k} className={`fest-card ${f.theme === k ? 'on' : ''}`} onClick={() => pick(k)}>
                <span className="sw" style={{ '--b1': t.bg, '--b2': t.bg2 }} />
                <span className="meta"><strong>{t.label}</strong><small>{t.country}</small></span>
              </button>
            ))}
          </div>
        </div>

        <div className="a-card">
          <h3>2 · Message</h3>
          <div className="stack">
            <label className="field"><span>Heading</span><input className="input" maxLength={80} value={f.title} onChange={(e) => set({ title: e.target.value })} /></label>
            <label className="field"><span>Message</span><textarea className="input" rows={2} maxLength={220} value={f.message} onChange={(e) => set({ message: e.target.value })} /></label>
            <div className="a-actions">
              <label className="field"><span>Button text</span><input className="input" style={{ width: 200 }} maxLength={30} value={f.cta} onChange={(e) => set({ cta: e.target.value })} /></label>
              <label className="field"><span>Button link</span><input className="input" style={{ width: 260 }} value={f.link} onChange={(e) => set({ link: e.target.value })} placeholder="/shop?category=sweats" /></label>
            </div>
          </div>
        </div>

        <div className="a-card">
          <h3>3 · Your own design (optional)</h3>
          <p className="muted" style={{ marginTop: 0 }}>Upload a wide banner image (jpg, png, webp — about 2400×500). It replaces the built-in illustration; your logo and the message stay on top.</p>
          <div className="a-actions" style={{ alignItems: 'center' }}>
            <label className="drop" style={{ padding: 16, width: 240 }}>Upload banner design
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
            </label>
            {f.image && <><img src={f.image} alt="" style={{ height: 60 }} /><button className="btn ghost sm" onClick={() => set({ image: '' })}>Remove</button></>}
          </div>
        </div>

        <div className="a-card">
          <h3>4 · When &amp; how</h3>
          <div className="a-actions" style={{ alignItems: 'end' }}>
            <label className="field"><span>Start date</span><input className="input" type="date" value={f.start} onChange={(e) => set({ start: e.target.value })} /></label>
            <label className="field"><span>End date</span><input className="input" type="date" value={f.end} onChange={(e) => set({ end: e.target.value })} /></label>
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            <label><input type="checkbox" checked={f.showLogo} onChange={(e) => set({ showLogo: e.target.checked })} /> Show the Chalk&amp;Coal logo on the banner</label>
            <label><input type="checkbox" checked={f.sitewide} onChange={(e) => set({ sitewide: e.target.checked })} /> Falling effect (lights, snow, confetti…) over the whole site</label>
            <label><strong><input type="checkbox" checked={f.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Festival theme is ON</strong> <span className="muted">— shows between the dates above; leave dates empty to show until switched off</span></label>
          </div>
        </div>

        <div className="a-card">
          <h3>Live preview</h3>
          {f.theme || f.image ? <div className="fest-prev"><BannerView f={f} preview /></div> : <p className="muted">Pick a design above to see it here.</p>}
        </div>
      </div>
    </>
  );
}
