import { Router } from 'express';
import Product from '../models/Product.js';
import { getRates, serialize } from '../pricing.js';
import { wrap, httpError } from '../middleware/error.js';

const r = Router();
const SORTS = { new: { createdAt: -1 }, 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, popular: { sold: -1 } };

r.get('/', wrap(async (req, res) => {
  const { gender, category, q, sort = 'new', color, featured, limit = 48, page = 1 } = req.query;
  const filter = { active: true };
  if (gender) filter.gender = gender;
  if (category) filter.category = category;
  if (featured === 'true') filter.featured = true;
  if (q) filter.$text = { $search: String(q) };
  if (color) filter['colors.name'] = color;
  const lim = Math.min(+limit || 48, 100);
  const [items, total, rates] = await Promise.all([
    Product.find(filter).sort(SORTS[sort] || SORTS.new).skip((+page - 1) * lim).limit(lim),
    Product.countDocuments(filter),
    getRates(),
  ]);
  res.json({ items: items.map((p) => serialize(p, rates)), total, pages: Math.ceil(total / lim) });
}));

r.get('/:slug', wrap(async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug, active: true });
  if (!p) throw httpError(404, 'Product not found');
  const [pool, rates] = await Promise.all([Product.find({ gender: p.gender, _id: { $ne: p._id }, active: true }).limit(24), getRates()]);
  // same category first, then the rest of the same collection
  const related = [...pool.filter((x) => x.category === p.category), ...pool.filter((x) => x.category !== p.category)].slice(0, 4);
  res.json({ product: serialize(p, rates), related: related.map((x) => serialize(x, rates)) });
}));

export default r;
