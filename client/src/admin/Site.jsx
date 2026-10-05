import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../store';
import Media from '../components/Media';

const EMPTY = { type: '', url: '' };

export default function Site() {
  const { settings, setSettings, setToast } = useApp();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (settings) setF({ collections: { men: settings.collections?.men || EMPTY, women: settings.collections?.women || EMPTY }, rates: { USD: settings.rates.USD, EUR: settings.rates.EUR, AED: settings.rates.AED }, announcements: settings.announcements || [] });
  }, [settings]);
  if (!f) return <p className="muted">Loading…</p>;

  const upload = async (file, done) => {
    const fd = new FormData(); fd.append('images', file);
    try { const { urls } = await api.post('/api/admin/upload', fd); done({ url: urls[0], type: file.type.startsWith('video') ? 'video' : 'image' }); } catch (e) { setToast(e.message); }
  };
  const save = async () => {
    setBusy(true);
    try {
      await api.put('/api/admin/settings', { ...f, rates: { USD: +f.rates.USD, EUR: +f.rates.EUR, AED: +f.rates.AED } });
      setSettings(await api.get('/api/settings')); setToast('Site updated');
    } catch (e) { setToast(e.message); }
    setBusy(false);
  };
  const setCol = (g, m) => setF({ ...f, collections: { ...f.collections, [g]: m } });

  return (
    <>
      <div className="a-top"><h1>Site content</h1><button className="btn sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      <div className="stack">
        <div className="a-card">
          <h3>Homepage hero — replace the women's and men's slides</h3>
          <p className="muted" style={{ marginTop: 0 }}>Upload a photo (jpg, png, webp) or a short looping video (mp4, webm, under 60 MB, landscape works best) to replace the women's or men's hero slide. With nothing uploaded, the default black-and-white films are shown.</p>
          <div className="a-actions" style={{ alignItems: 'start', gap: 24 }}>
            {[['men', "Men's collection"], ['women', "Women's collection"]].map(([g, label]) => (
              <div key={g} className="stack" style={{ width: 220 }}>
                <label className="drop" style={{ padding: 16 }}>{label} — upload
                  <input type="file" accept="image/*,video/mp4,video/webm" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0], (m) => setCol(g, m))} />
                </label>
                {f.collections[g].url && <div style={{ position: 'relative', aspectRatio: '3/4', background: '#000' }}>
                  <Media media={f.collections[g]} className="" />
                  <button className="btn sm danger" style={{ position: 'absolute', bottom: 6, left: 6, height: 28, padding: '0 10px' }} onClick={() => setCol(g, EMPTY)}>Remove</button>
                </div>}
              </div>
            ))}
          </div>
        </div>
        <div className="a-card">
          <h3>Exchange rates (per £1)</h3>
          <p className="muted" style={{ marginTop: 0 }}>Used to convert £ prices to $, € and AED. Products with a fixed price for a currency ignore these. Check them against the market regularly.</p>
          <div className="a-actions">
            {['USD', 'EUR', 'AED'].map((c) => <label className="field" key={c}><span>£1 = {c}</span><input className="input" style={{ width: 120 }} type="number" step="0.01" min="0" value={f.rates[c]} onChange={(e) => setF({ ...f, rates: { ...f.rates, [c]: e.target.value } })} /></label>)}
          </div>
        </div>
        <div className="a-card">
          <h3>Announcement ticker (one line each)</h3>
          <textarea className="input" rows={4} value={f.announcements.join('\n')} onChange={(e) => setF({ ...f, announcements: e.target.value.split('\n').filter(Boolean).slice(0, 8) })} />
        </div>
      </div>
    </>
  );
}
