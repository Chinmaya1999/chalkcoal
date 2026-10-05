import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Subscriber from '../models/Subscriber.js';
import Setting from '../models/Setting.js';
import { clearRatesCache } from '../pricing.js';
import { requireAdmin } from '../middleware/auth.js';
import { wrap, httpError } from '../middleware/error.js';

const r = Router();
r.use(requireAdmin);

const UPLOADS = path.resolve('uploads');
fs.mkdirSync(UPLOADS, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (_q, f, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(f.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (_q, f, cb) => cb(/^(image\/(jpe?g|png|webp|avif)|video\/(mp4|webm))$/.test(f.mimetype) ? null : httpError(400, 'Use jpg, png, webp, avif, mp4 or webm'), true),
});

r.post('/upload', upload.array('images', 8), (req, res) => res.json({ urls: req.files.map((f) => `/uploads/${f.filename}`) }));

// ---------- Site content ----------
const mediaSchema = z.object({ type: z.enum(['', 'image', 'video']), url: z.string() });
r.put('/settings', wrap(async (req, res) => {
  const body = z.object({
    collections: z.object({ men: mediaSchema, women: mediaSchema }).optional(),
    rates: z.object({ USD: z.number().positive(), EUR: z.number().positive(), AED: z.number().positive() }).optional(),
    announcements: z.array(z.string().min(1)).max(8).optional(),
  }).parse(req.body);
  const doc = await Setting.findOneAndUpdate({ key: 'site' }, { $set: body }, { new: true, upsert: true });
  clearRatesCache();
  res.json(doc);
}));

// ---------- Dashboard ----------
r.get('/stats', wrap(async (_req, res) => {
  const since = new Date(Date.now() - 14 * 864e5);
  const valid = { status: { $nin: ['cancelled', 'refunded'] } };
  const [totals, daily, top, recent, customers, lowStock, byStatus] = await Promise.all([
    Order.aggregate([{ $match: valid }, { $group: { _id: null, revenue: { $sum: '$totalBase' }, orders: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { ...valid, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalBase' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Product.find().sort('-sold').limit(5).select('name sku sold price images'),
    Order.find().sort('-createdAt').limit(8),
    User.countDocuments({ role: 'customer' }),
    Product.aggregate([
      { $unwind: '$variants' },
      { $match: { 'variants.stock': { $lte: 5 }, active: true } },
      { $project: { name: 1, sku: 1, size: '$variants.size', color: '$variants.color', stock: '$variants.stock' } },
      { $sort: { stock: 1 } },
      { $limit: 12 },
    ]),
    Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const { revenue = 0, orders = 0 } = totals[0] || {};
  res.json({ revenue, orders, customers, aov: orders ? revenue / orders : 0, daily, top, recent, lowStock, byStatus });
}));

// ---------- Products ----------
const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().default(''),
  details: z.array(z.string()).default([]),
  gender: z.enum(['men', 'women']),
  category: z.enum(['tees', 'sweats', 'bottoms', 'training']),
  type: z.string().default(''),
  gsm: z.number().min(0).default(0),
  note: z.string().default(''),
  price: z.number().min(0),
  priceOverrides: z.object({ USD: z.number().min(0).nullable().optional(), EUR: z.number().min(0).nullable().optional(), AED: z.number().min(0).nullable().optional() }).default({}),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).default([]),
  images: z.array(z.string()).default([]),
  variants: z.array(z.object({ size: z.string(), color: z.string(), stock: z.number().int().min(0) })).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

r.get('/products', wrap(async (_req, res) => res.json(await Product.find().sort('-createdAt'))));
r.get('/products/:id', wrap(async (req, res) => res.json(await Product.findById(req.params.id))));
r.post('/products', wrap(async (req, res) => res.status(201).json(await Product.create(productSchema.parse(req.body)))));
r.put('/products/:id', wrap(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw httpError(404, 'Product not found');
  p.set(productSchema.partial().parse(req.body));
  res.json(await p.save());
}));
r.patch('/products/:id/stock', wrap(async (req, res) => {
  const { size, color, stock } = z.object({ size: z.string(), color: z.string(), stock: z.number().int().min(0) }).parse(req.body);
  const out = await Product.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { 'variants.$[v].stock': stock } },
    { arrayFilters: [{ 'v.size': size, 'v.color': color }], new: true }
  );
  res.json(out);
}));
r.delete('/products/:id', wrap(async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));

// ---------- Orders ----------
r.get('/orders', wrap(async (req, res) => {
  const { status, q, page = 1 } = req.query;
  const f = {};
  if (status) f.status = status;
  if (q) f.$or = [{ number: new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }];
  const [items, total] = await Promise.all([Order.find(f).sort('-createdAt').skip((+page - 1) * 30).limit(30), Order.countDocuments(f)]);
  res.json({ items, total, pages: Math.ceil(total / 30) });
}));
r.get('/orders/:id', wrap(async (req, res) => res.json(await Order.findById(req.params.id))));
r.patch('/orders/:id', wrap(async (req, res) => {
  const b = z.object({
    status: z.enum(['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
    tracking: z.string().optional(),
    note: z.string().optional(),
  }).parse(req.body);
  const o = await Order.findById(req.params.id);
  if (!o) throw httpError(404, 'Order not found');
  const restock = ['cancelled', 'refunded'];
  if (b.status && b.status !== o.status) {
    // Return stock the first time an order is cancelled/refunded
    if (restock.includes(b.status) && !restock.includes(o.status)) {
      for (const i of o.items) {
        await Product.updateOne({ _id: i.product }, { $inc: { 'variants.$[v].stock': i.qty, sold: -i.qty } }, { arrayFilters: [{ 'v.size': i.size, 'v.color': i.color }] });
      }
    }
    o.timeline.push({ status: b.status });
    o.status = b.status;
    if (b.status === 'paid' || b.status === 'delivered') o.payment.paid = true;
  }
  if (b.tracking !== undefined) o.tracking = b.tracking;
  if (b.note !== undefined) o.note = b.note;
  res.json(await o.save());
}));

// ---------- Customers, coupons, subscribers ----------
r.get('/customers', wrap(async (_req, res) => {
  const users = await User.find({ role: 'customer' }).sort('-createdAt').lean();
  const spend = await Order.aggregate([{ $match: { user: { $ne: null }, status: { $nin: ['cancelled', 'refunded'] } } }, { $group: { _id: '$user', spent: { $sum: '$totalBase' }, orders: { $sum: 1 } } }]);
  const map = Object.fromEntries(spend.map((s) => [s._id.toString(), s]));
  res.json(users.map((u) => ({ ...u, spent: map[u._id]?.spent || 0, orders: map[u._id]?.orders || 0 })));
}));

const couponSchema = z.object({
  code: z.string().min(2),
  type: z.enum(['percent', 'fixed']),
  value: z.number().min(0),
  minSubtotal: z.number().min(0).default(0),
  usageLimit: z.number().int().min(0).default(0),
  expiresAt: z.string().nullable().optional(),
  active: z.boolean().default(true),
});
r.get('/coupons', wrap(async (_req, res) => res.json(await Coupon.find().sort('-createdAt'))));
r.post('/coupons', wrap(async (req, res) => res.status(201).json(await Coupon.create(couponSchema.parse(req.body)))));
r.put('/coupons/:id', wrap(async (req, res) => res.json(await Coupon.findByIdAndUpdate(req.params.id, couponSchema.partial().parse(req.body), { new: true }))));
r.delete('/coupons/:id', wrap(async (req, res) => { await Coupon.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));

r.get('/subscribers', wrap(async (_req, res) => res.json(await Subscriber.find().sort('-createdAt'))));

export default r;
