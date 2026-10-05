import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { wrap, httpError } from '../middleware/error.js';
import { getRates, priceIn } from '../pricing.js';
import { CURRENCIES, COUNTRY_NAMES } from '../config/markets.js';

const r = Router();
const round2 = (n) => Math.round(n * 100) / 100;
const currencySchema = z.enum(['GBP', 'USD', 'EUR', 'AED']);
const stripe = () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);

const itemSchema = z.object({ productId: z.string(), size: z.string(), color: z.string(), qty: z.number().int().min(1).max(10) });

// Price a cart from DB values only — never trust prices from the client.
async function priceCart(items, code, currency) {
  const rates = await getRates();
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) }, active: true });
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const lines = items.map((i) => {
    const p = byId[i.productId];
    if (!p) throw httpError(400, 'An item in your bag is no longer available');
    const v = p.variants.find((x) => x.size === i.size && x.color === i.color);
    if (!v) throw httpError(400, `${p.name} is not available in ${i.color} / ${i.size}`);
    if (v.stock < i.qty) throw httpError(409, `Only ${v.stock} left of ${p.name} (${i.color} / ${i.size})`);
    return { product: p.id, name: p.name, sku: p.sku, size: i.size, color: i.color, price: priceIn(p, currency, rates), qty: i.qty, image: p.images[0] };
  });
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  let discount = 0, coupon = null;
  if (code) {
    coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) throw httpError(400, 'Invalid code');
    const err = coupon.check(subtotal, rates[currency]);
    if (err) throw httpError(400, err);
    discount = round2(coupon.discountFor(subtotal, rates[currency]));
  }
  const { freeOver, flat } = CURRENCIES[currency];
  const shippingCost = subtotal - discount >= freeOver ? 0 : flat;
  const total = round2(subtotal - discount + shippingCost);
  return { lines, subtotal, discount, shippingCost, total, totalBase: round2(total / rates[currency]), currency, coupon };
}

r.post('/quote', wrap(async (req, res) => {
  const { items, coupon, currency } = z.object({ items: z.array(itemSchema).min(1), coupon: z.string().optional(), currency: currencySchema }).parse(req.body);
  const { lines, coupon: _c, totalBase, ...totals } = await priceCart(items, coupon, currency);
  res.json(totals);
}));

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1),
  coupon: z.string().optional(),
  email: z.string().email(),
  currency: currencySchema,
  paymentMethod: z.enum(['card', 'cod']),
  shipping: z.object({
    name: z.string().min(1), line1: z.string().min(1), line2: z.string().optional(), city: z.string().min(1),
    state: z.string().optional(), zip: z.string().min(1), country: z.enum(COUNTRY_NAMES, { errorMap: () => ({ message: 'We currently deliver to the UK, Europe, USA and UAE' }) }), phone: z.string().optional(),
  }),
});

r.post('/', optionalAuth, wrap(async (req, res) => {
  const body = checkoutSchema.parse(req.body);
  if (body.paymentMethod === 'card' && !stripe()) throw httpError(400, 'Card payments are not enabled yet — choose pay on delivery');

  const priced = await priceCart(body.items, body.coupon, body.currency);

  // Reserve stock atomically; roll back if any line fails.
  const reserved = [];
  try {
    for (const l of priced.lines) {
      const { modifiedCount } = await Product.updateOne(
        { _id: l.product, variants: { $elemMatch: { size: l.size, color: l.color, stock: { $gte: l.qty } } } },
        { $inc: { 'variants.$.stock': -l.qty, sold: l.qty } }
      );
      // $elemMatch + positional $ updates the first matching variant element
      if (!modifiedCount) throw httpError(409, `${l.name} just sold out in ${l.color} / ${l.size}`);
      reserved.push(l);
    }
  } catch (e) {
    for (const l of reserved) {
      await Product.updateOne(
        { _id: l.product, 'variants.size': l.size, 'variants.color': l.color },
        { $inc: { 'variants.$[v].stock': l.qty, sold: -l.qty } },
        { arrayFilters: [{ 'v.size': l.size, 'v.color': l.color }] }
      );
    }
    throw e;
  }

  const order = await Order.create({
    user: req.user?.id,
    email: body.email,
    items: priced.lines,
    shipping: body.shipping,
    subtotal: priced.subtotal,
    discount: priced.discount,
    shippingCost: priced.shippingCost,
    total: priced.total,
    totalBase: priced.totalBase,
    currency: priced.currency,
    coupon: priced.coupon?.code,
    payment: { method: body.paymentMethod },
    timeline: [{ status: 'pending' }],
  });
  if (priced.coupon) await Coupon.updateOne({ _id: priced.coupon.id }, { $inc: { used: 1 } });

  if (body.paymentMethod === 'card') {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: body.email,
      client_reference_id: order.id,
      line_items: [
        ...order.items.map((i) => ({
          quantity: i.qty,
          price_data: { currency: order.currency.toLowerCase(), unit_amount: Math.round(i.price * 100), product_data: { name: `${i.name} — ${i.color} / ${i.size}` } },
        })),
        ...(order.shippingCost ? [{ quantity: 1, price_data: { currency: order.currency.toLowerCase(), unit_amount: Math.round(order.shippingCost * 100), product_data: { name: 'Shipping' } } }] : []),
      ],
      ...(order.discount && {
        discounts: [{ coupon: (await stripe().coupons.create({ amount_off: Math.round(order.discount * 100), currency: order.currency.toLowerCase(), duration: 'once' })).id }],
      }),
      success_url: `${process.env.CLIENT_URL}/order/${order.number}?email=${encodeURIComponent(order.email)}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,
    });
    order.payment.stripeSession = session.id;
    await order.save();
    return res.status(201).json({ number: order.number, payUrl: session.url });
  }
  res.status(201).json({ number: order.number });
}));

// Stripe webhook (mounted with raw body in index.js)
export const stripeWebhook = wrap(async (req, res) => {
  const s = stripe();
  if (!s) return res.sendStatus(404);
  const event = s.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  if (event.type === 'checkout.session.completed') {
    const order = await Order.findById(event.data.object.client_reference_id);
    if (order && !order.payment.paid) {
      order.payment.paid = true;
      order.status = 'paid';
      order.timeline.push({ status: 'paid' });
      await order.save();
    }
  }
  res.json({ received: true });
});

r.get('/mine', requireAuth, wrap(async (req, res) => {
  res.json(await Order.find({ user: req.user.id }).sort('-createdAt'));
}));

// Guests look up by order number + email
r.get('/lookup/:number', optionalAuth, wrap(async (req, res) => {
  const order = await Order.findOne({ number: req.params.number });
  const ok = order && ((req.user && (req.user.role === 'admin' || order.user?.equals(req.user.id))) || order.email === String(req.query.email || '').toLowerCase());
  if (!ok) throw httpError(404, 'Order not found');
  res.json(order);
}));

export default r;
