# Chalkcoal — MERN store + admin

MongoDB · Express · React (Vite) · Node. Storefront at `/`, admin at `/admin`.

## Run
1. Start MongoDB (`brew services start mongodb-community`).
2. `npm run install:all`
3. `cp server/.env.example server/.env` (already created) and set `JWT_SECRET`, `ADMIN_PASSWORD`.
4. `npm run seed` — 24 AW26 products, coupons, sample orders, admin user.
5. `npm run dev` → store http://localhost:5173 · API :5050

Seed logins: `admin@chalkcoal.com` / `ChangeMe123!` (change it) · `ava@example.com` / `password123`.
Seeding **wipes** users, products, orders and coupons — never run it against live data.

## Payments
Pay-on-delivery works out of the box. For cards set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
(webhook: `POST /api/stripe/webhook`, event `checkout.session.completed`).

## Notes
- Prices, discounts, shipping and stock are always computed on the server.
- Free shipping over $150, otherwise $12 (`server/src/routes/orders.js`).
- Uploaded photos live in `server/uploads` — use S3/Cloudinary in production.

## Markets & currencies
- Sells to the UK, EU/EEA + Switzerland, USA and UAE (`server/src/config/markets.js` — edit the country list there).
- Shown in £ GBP, $ USD, € EUR and AED. Prices are authored in £; $, € and AED are converted using
  the rates in **Admin → Site content** (placeholders — set real ones), or fixed per product in the product form.
- Free-delivery thresholds and flat delivery fees per currency are in the same markets file.
- Prices are not VAT/tax-aware yet.

## Brand assets
- Logo: drop your file at `client/public/logo.png` to replace the typeset "CHALK / COAL" wordmark.
- Browser-tab icon: `client/public/favicon.svg` (the "//" badge).
- Admin → **Site content**: men's / women's banner photo or looping video (mp4/webm ≤ 60 MB), exchange rates, ticker text.
  With no media uploaded, an animated 3D fabric (three.js) is shown.
- Product photos: Admin → Products → edit. Until uploaded, the store shows silhouettes.

## Product photos (stand-ins)
`npm run seed` loads photos cut from the line sheet (`server/seed-assets/`, copied to `server/uploads/sheet/`).
They are low-resolution (≈150px originals) — replace each one with your original photography in Admin → Products.

## Real product photography (full clarity)
1. Generate/shoot each photo at high resolution — `PHOTO-PROMPTS.md` has a prompt and filename for every product colourway.
2. Put the files in `server/product-photos/` named by SKU (`CC-M-001_chalk.jpg`, `CC-M-001.jpg`, `CC-M-001-2.jpg` …).
3. `cd server && npm run photos` — resizes (max 2000px), uploads, links them to each product and tells you which still use stand-ins.
The shop switches photos when a customer picks a colour.

## Production & SEO
- `npm start` builds the storefront and serves site + API together on one port. Set `SITE_URL` in `server/.env`
  to your public address (e.g. `https://chalkcoal.com`) — it drives canonical URLs, the sitemap and social previews.
- The server injects a unique title, description, canonical link, Open Graph/Twitter tags and JSON-LD (Organization,
  WebSite + search, BreadcrumbList, CollectionPage, Product with price and availability) into every page, so crawlers
  and link previews see them without running JavaScript. Unknown URLs return a real 404; account, checkout and admin are `noindex`.
- `/sitemap.xml` (all products, with images) and `/robots.txt` are generated automatically. After going live,
  submit the sitemap in Google Search Console and Bing Webmaster Tools.
- `npm run dev` (Vite) is for development: tags are set client-side there; the server-side tags need `npm start`.

## Credits
Fabric scan textures (`client/public/textures/`) are from Poly Haven (colormass / Rico Cilliers) — CC0, no attribution required.

## Editorial photos
Default hero, lookbook and story-band photos live in `client/public/editorial/` (CC0, credited in `IMAGE-CREDITS.md`).
They are mood images, not Chalk&Coal garments — replace the hero pair in Admin → Site content and swap the files for your own shoot before a full launch.

## Homepage
Full-bleed film hero (3 slides, pausable, honours reduced-motion), transparent header, Women/Men split, new-arrivals carousel,
campaign film, story chapter, lookbook and fabric band. Replace the women's/men's hero slides in Admin → Site content.
Videos are silent loops that load lazily and play only while visible.
