// Ready-made festival themes. `effect` picks the falling/rising particles, `art` the illustration on the banner.
export const THEMES = {
  diwali:   { label: 'Diwali', country: 'India', bg: '#1a0b05', bg2: '#5a2208', accent: '#f6b73c', text: '#fff4de', effect: 'embers', art: 'diya', title: 'Happy Diwali', message: 'May the festival of lights bring warmth to your home. Festive picks, now in store.', cta: 'Shop the festive edit' },
  holi:     { label: 'Holi', country: 'India', bg: '#2a0f3f', bg2: '#c2185b', accent: '#ffd23f', text: '#fff', effect: 'petals', art: 'splash', title: 'Happy Holi', message: 'Colour the day. Fresh arrivals to celebrate in.', cta: 'Shop now' },
  independence: { label: 'Independence Day', country: 'India', bg: '#0e3b1c', bg2: '#e8730c', accent: '#ffffff', text: '#ffffff', effect: 'confetti', art: 'chakra', title: 'Happy Independence Day', message: 'Celebrate with 15% off sitewide.', cta: 'Shop the sale' },
  eid:      { label: 'Eid', country: 'Middle East · UAE · UK', bg: '#06241d', bg2: '#0f5c46', accent: '#e6c46b', text: '#f6efdc', effect: 'stars', art: 'crescent', title: 'Eid Mubarak', message: 'Wishing you joy and peace. Dress for the celebration.', cta: 'Shop Eid styles' },
  christmas: { label: 'Christmas', country: 'UK · Europe · USA', bg: '#0c2a1a', bg2: '#8c1c1c', accent: '#f4d37a', text: '#fff', effect: 'snow', art: 'tree', title: 'Merry Christmas', message: 'Heavyweight gifts they will actually wear. Order by 15 Dec for delivery.', cta: 'Shop gifts' },
  newyear:  { label: 'New Year', country: 'Worldwide', bg: '#0b0b12', bg2: '#2b2350', accent: '#e9c46a', text: '#f5f1e6', effect: 'confetti', art: 'fireworks', title: 'Happy New Year', message: 'New year, new essentials. Start 2027 in Chalk & Coal.', cta: 'Shop new arrivals' },
  valentines: { label: "Valentine's Day", country: 'UK · USA · Europe', bg: '#2a0a14', bg2: '#8e1c3d', accent: '#ffb3c1', text: '#fff0f3', effect: 'hearts', art: 'heart', title: "Valentine's Day", message: 'Give something that lasts.', cta: 'Shop gifts' },
  halloween: { label: 'Halloween', country: 'USA · UK', bg: '#0d0b0a', bg2: '#5b2a05', accent: '#ff8a1f', text: '#fff1e0', effect: 'embers', art: 'pumpkin', title: 'Happy Halloween', message: 'All-black everything. Our Coal range, made for the night.', cta: 'Shop Coal' },
  blackfriday: { label: 'Black Friday', country: 'USA · UK · Worldwide', bg: '#050505', bg2: '#1c1c1c', accent: '#ffffff', text: '#ffffff', effect: 'confetti', art: 'tag', title: 'Black Friday', message: 'Our biggest sale of the year. While stock lasts.', cta: 'Shop the sale' },
};
export const EFFECTS = ['embers', 'snow', 'confetti', 'stars', 'petals', 'hearts'];

export const BLANK = { enabled: false, theme: '', title: '', message: '', cta: '', link: '/shop', start: '', end: '', sitewide: true, showLogo: true, image: '' };

// Resolve what to show: theme defaults filled in by anything the admin typed.
export function resolveFestival(f) {
  if (!f?.theme && !f?.image) return null;
  const t = THEMES[f.theme] || { bg: '#151515', bg2: '#2b2b28', accent: '#f3f1ec', text: '#f3f1ec', effect: 'confetti', art: '', label: '' };
  return { ...t, ...f, title: f.title || t.title || '', message: f.message || t.message || '', cta: f.cta || t.cta || 'Shop now' };
}

export function isLive(f) {
  if (!f?.enabled) return false;
  const today = new Date().toLocaleDateString('en-CA');
  return (!f.start || today >= f.start) && (!f.end || today <= f.end);
}
