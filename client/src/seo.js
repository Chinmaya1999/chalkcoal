import { useEffect } from 'react';

const BRAND = 'Chalk&Coal';
const set = (selector, create, attrs) => {
  let el = document.head.querySelector(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
};
const meta = (key, val, content) => set(`meta[${key}="${val}"]`, () => Object.assign(document.createElement('meta'), {}), { [key]: val, content });

// Keeps <head> correct as the visitor navigates (crawlers get the same tags from the server on first load).
export function useSeo({ title, description, image, noindex = false, jsonld } = {}) {
  useEffect(() => {
    const full = title ? (title.includes(BRAND) ? title : `${title} | ${BRAND}`) : `${BRAND} — Minimal, Purposeful Everyday Essentials`;
    document.title = full;
    const url = `${location.origin}${location.pathname}`;
    const desc = description || 'Monochrome essentials in Chalk, Ash and Coal. Designed in London. Delivering to the UK, Europe and USA.';
    const img = image ? (image.startsWith('http') ? image : `${location.origin}${image}`) : `${location.origin}/og-default.jpg`;
    meta('name', 'description', desc);
    meta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    set('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), { href: url });
    meta('property', 'og:title', full); meta('property', 'og:description', desc); meta('property', 'og:url', url); meta('property', 'og:image', img);
    meta('name', 'twitter:title', full); meta('name', 'twitter:description', desc); meta('name', 'twitter:image', img);
    document.head.querySelectorAll('script[data-seo-ld]').forEach((n) => n.remove());
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((n) => n.remove()); // replace the server's copy with this page's
    (jsonld ? [].concat(jsonld) : []).forEach((o) => {
      const s = document.createElement('script'); s.type = 'application/ld+json'; s.dataset.seoLd = '1'; s.text = JSON.stringify(o); document.head.appendChild(s);
    });
  }, [title, description, image, noindex, JSON.stringify(jsonld)]); // eslint-disable-line react-hooks/exhaustive-deps
}
