import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes, { stripeWebhook } from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import miscRoutes from './routes/misc.js';
import { notFound, errorHandler, wrap } from './middleware/error.js';
import { metaFor, headHtml, sitemapXml, robotsTxt } from './seo.js';

for (const k of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[k]) { console.error(`Missing ${k} in server/.env`); process.exit(1); }
}

const app = express();
app.set('trust proxy', 1);
// The storefront (served below in production) needs Google Fonts, inline JSON-LD and WebGL workers,
// so we use helmet's other protections and a CSP written for this site.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", 'https://checkout.stripe.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", 'https://checkout.stripe.com'],
    },
  },
}));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '30d' }));

// Throttle only credential endpoints; /me, /logout and wishlist run on every page and must not be limited.
const credLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { message: 'Too many attempts — try again in a few minutes' } });
app.use(['/api/auth/login', '/api/auth/register'], credLimit);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', miscRoutes);
app.get('/api/health', (_q, res) => res.json({ ok: true }));

// SEO endpoints
app.get('/sitemap.xml', wrap(async (_q, res) => res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(await sitemapXml())));
app.get('/robots.txt', (_q, res) => res.type('text/plain').send(robotsTxt()));

// API 404s stay JSON
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

// Serve the built storefront with per-page SEO tags injected (run `npm run build` in /client first)
const dist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
if (fs.existsSync(path.join(dist, 'index.html'))) {
  const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(dist, { index: false, maxAge: '1d' }));
  app.get('*', wrap(async (req, res) => {
    const m = await metaFor(req.path, req.query);
    const head = headHtml(m);
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta name="description"[^>]*>/, '')
      .replace('<!--seo-head-->', head);
    res.status(m.status).set('Cache-Control', 'public, max-age=0, must-revalidate').type('html').send(html);
  }));
  console.log('Serving storefront from client/dist with SEO injection');
}

app.use(notFound);
app.use(errorHandler);

await mongoose.connect(process.env.MONGO_URI);
const port = process.env.PORT || 5050;
app.listen(port, () => console.log(`API ready on :${port}`));
