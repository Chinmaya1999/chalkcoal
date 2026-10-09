// Server-side SEO: per-route <head> (title, description, canonical, Open Graph, JSON-LD), sitemap and robots.
import Product from './models/Product.js';
import { getRates, priceIn } from './pricing.js';

export const SITE = () => (process.env.SITE_URL || `http://localhost:${process.env.PORT || 5050}`).replace(/\/$/, '');
const BRAND = 'Chalk&Coal';
const TAGLINE = 'Minimal. Purposeful. Everyday essentials.';
const DEFAULT_DESC = 'Monochrome essentials in Chalk, Ash and Coal. Heavyweight tees, hoodies and joggers, 150–420gsm. Designed in London. Delivering to the UK, Europe and USA.';
const NOINDEX = /^\/(admin|account|checkout|order|login|register|wireframe)(\/|$)/;
const abs = (u) => (!u ? `${SITE()}/og-default.jpg` : /^https?:/.test(u) ? u : `${SITE()}${u}`);
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const trim = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

const org = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', name: BRAND, url: SITE(), logo: abs('/logo-ink.png'),
  description: DEFAULT_DESC, areaServed: ['GB', 'US', 'EU'], foundingLocation: 'London, United Kingdom',
});
const website = () => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: SITE(),
  potentialAction: { '@type': 'SearchAction', target: `${SITE()}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
});
const crumbs = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE()}${path}` })),
});

const CATS = { tees: 'Tees', sweats: 'Sweats & Hoodies', bottoms: 'Bottoms', training: 'Training' };

// Returns { status, title, description, canonical, image, noindex, type, jsonld[] } for a request path.
export async function metaFor(pathname, query = {}) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const base = { status: 200, canonical: `${SITE()}${path}`, image: abs(), type: 'website', noindex: false, jsonld: [] };

  if (NOINDEX.test(path)) return { ...base, title: `${BRAND}`, description: DEFAULT_DESC, noindex: true };

  if (path === '/') {
    return { ...base, title: `${BRAND} — Minimal, Purposeful Everyday Essentials | Designed in London`, description: DEFAULT_DESC, jsonld: [org(), website()] };
  }

  if (path === '/collection') {
    return { ...base, title: `Collection One — Autumn Winter 2026 | ${BRAND}`, description: 'Twenty-three styles, eight fabric platforms, three colours. The full Chalk&Coal Collection One range.', jsonld: [crumbs([['Home', '/'], ['Collection', '/collection']])] };
  }
  if (path === '/story') {
    return { ...base, title: `Our Story — Designed in London | ${BRAND}`, description: 'Three colours, heavyweight fabric and nothing that shouts. The story behind Chalk&Coal — designed in London, made in India.', jsonld: [crumbs([['Home', '/'], ['Story', '/story']])] };
  }

  if (['/men', '/women', '/shop'].includes(path)) {
    const gender = path === '/shop' ? '' : path.slice(1);
    const filter = { active: true, ...(gender && { gender }) };
    const cat = query.category && CATS[query.category];
    if (query.category) filter.category = query.category;
    const items = await Product.find(filter).sort({ sold: -1 }).limit(24).lean();
    const label = gender ? `${gender === 'men' ? "Men's" : "Women's"} Collection` : 'Shop All';
    const title = `${cat ? `${cat} — ` : ''}${label} | ${BRAND}`;
    const canonical = `${SITE()}${path}${query.category ? `?category=${query.category}` : ''}`;
    return {
      ...base, canonical, title,
      description: `${label}${cat ? ` — ${cat}` : ''}: ${items.length} heavyweight essentials in Chalk, Ash and Coal. 150–420gsm. Designed in London.`,
      image: abs(items[0]?.images?.[0]),
      jsonld: [
        crumbs([['Home', '/'], [label, path]]),
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name: label, url: canonical,
          mainEntity: { '@type': 'ItemList', itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE()}/product/${p.slug}`, name: p.name })) } },
      ],
    };
  }

  const m = path.match(/^\/product\/([a-z0-9-]+)$/);
  if (m) {
    const p = await Product.findOne({ slug: m[1], active: true }).lean();
    if (!p) return { ...base, status: 404, title: `Page not found | ${BRAND}`, description: DEFAULT_DESC, noindex: true };
    const rates = await getRates();
    const colours = p.colors.map((c) => c.name).join(', ');
    const stock = p.variants.reduce((n, v) => n + v.stock, 0);
    const photos = [...new Set([...(p.images || []), ...Object.values(p.colorImages || {}).flat()])].map(abs);
    const who = p.gender === 'men' ? "Men's" : "Women's";
    const desc = trim(`${who} ${p.name}${p.gsm ? ` — ${p.gsm}gsm` : ''} in ${colours}. ${p.description || TAGLINE} Designed in London. £${p.price}.`, 158);
    return {
      ...base, type: 'product', title: `${p.name} — ${who} ${p.type} | ${BRAND}`, description: desc, image: photos[0] || abs(),
      product: { price: p.price, currency: 'GBP', stock },
      jsonld: [
        crumbs([['Home', '/'], [who, `/${p.gender}`], [p.name, path]]),
        {
          '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, mpn: p.sku, description: p.description || TAGLINE,
          image: photos.length ? photos : undefined, brand: { '@type': 'Brand', name: BRAND }, color: colours, material: p.gsm ? `${p.gsm}gsm cotton` : undefined,
          category: `${who} ${CATS[p.category]}`,
          offers: ['GBP', 'USD', 'EUR'].map((cur) => ({
            '@type': 'Offer', url: base.canonical, priceCurrency: cur, price: priceIn(p, cur, rates).toFixed(2), itemCondition: 'https://schema.org/NewCondition',
            availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: BRAND },
          })),
        },
      ],
    };
  }

  return { ...base, status: 404, title: `Page not found | ${BRAND}`, description: DEFAULT_DESC, noindex: true };
}

export function headHtml(m) {
  const t = esc(m.title), d = esc(m.description), img = esc(m.image), url = esc(m.canonical);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="${m.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:type" content="${m.type === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    ...(m.product ? [`<meta property="product:price:amount" content="${m.product.price}" />`, `<meta property="product:price:currency" content="GBP" />`] : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    ...m.jsonld.map((o) => `<script type="application/ld+json">${ld(o)}</script>`),
  ].join('\n    ');
}

export async function sitemapXml() {
  const products = await Product.find({ active: true }, 'slug images updatedAt').lean();
  const u = (loc, extra = '', lastmod, pri = '0.7') => `  <url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${pri}</priority>${extra}</url>`;
  const rows = [
    u(`${SITE()}/`, '', null, '1.0'), u(`${SITE()}/men`, '', null, '0.9'), u(`${SITE()}/women`, '', null, '0.9'), u(`${SITE()}/shop`, '', null, '0.8'), u(`${SITE()}/story`, '', null, '0.5'), u(`${SITE()}/collection`, '', null, '0.6'),
    ...products.map((p) => u(`${SITE()}/product/${p.slug}`, (p.images || []).slice(0, 3).map((i) => `<image:image><image:loc>${esc(abs(i))}</image:loc></image:image>`).join(''), p.updatedAt, '0.8')),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows.join('\n')}\n</urlset>\n`;
}

export const robotsTxt = () => `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /account\nDisallow: /checkout\nDisallow: /order/\nDisallow: /login\nDisallow: /register\n\nSitemap: ${SITE()}/sitemap.xml\n`;
