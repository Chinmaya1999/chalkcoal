import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Coupon from './models/Coupon.js';
import Setting from './models/Setting.js';
import { CURRENCIES, DEFAULT_RATES } from './config/markets.js';
import { priceIn } from './pricing.js';
import { buildProducts, copyPhotos } from './catalog.js';

copyPhotos();
await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}), Coupon.deleteMany({}), Setting.deleteMany({})]);
await Setting.create({ key: 'site' });

const admin = await User.create({ name: 'Chalk / Coal Admin', email: process.env.ADMIN_EMAIL || 'admin@chalkcoal.com', password: process.env.ADMIN_PASSWORD || 'ChangeMe123!', role: 'admin' });
const customer = await User.create({ name: 'Ava Morgan', email: 'ava@example.com', password: 'password123' });

const products = await Product.insertMany(buildProducts());
const n = { men: products.filter((p) => p.gender === 'men').length, women: products.filter((p) => p.gender === 'women').length };

await Coupon.create([
  { code: 'WELCOME10', type: 'percent', value: 10 },
  { code: 'LONDON', type: 'fixed', value: 15, minSubtotal: 100 }, // £15 off £100+ (converted per currency)
]);

const currencies = ['GBP', 'GBP', 'USD', 'EUR', 'GBP', 'AED'];
const countries = { GBP: 'United Kingdom', USD: 'United States', EUR: 'Germany', AED: 'United Arab Emirates' };
const statuses = ['delivered', 'delivered', 'shipped', 'packed', 'paid', 'pending'];
for (let k = 0; k < 24; k++) {
  const cur = currencies[k % currencies.length];
  const picks = [products[k % products.length], products[(k * 3 + 1) % products.length]].slice(0, 1 + (k % 2));
  const items = picks.map((p) => ({ product: p.id, name: p.name, sku: p.sku, size: 'M', color: p.colors[0].name, price: priceIn(p, cur, DEFAULT_RATES), qty: 1 + (k % 3 === 0 ? 1 : 0) }));
  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);
  const shippingCost = subtotal >= CURRENCIES[cur].freeOver ? 0 : CURRENCIES[cur].flat;
  const total = subtotal + shippingCost;
  const status = statuses[k % statuses.length];
  const o = new Order({
    user: k % 2 ? customer.id : undefined, email: k % 2 ? customer.email : `guest${k}@example.com`, items, currency: cur,
    shipping: { name: 'Sample Customer', line1: '1 Sample Street', city: 'London', zip: 'E1 6AN', country: countries[cur] },
    subtotal, shippingCost, total, totalBase: Math.round((total / DEFAULT_RATES[cur]) * 100) / 100, status,
    payment: { method: 'cod', paid: ['delivered', 'paid'].includes(status) },
  });
  o.timeline = [{ status }];
  o.set('createdAt', new Date(Date.now() - (k % 14) * 864e5 - k * 36e5));
  await o.save({ timestamps: false });
}

console.log(`Seeded ${products.length} styles (${n.men} men, ${n.women} women), 24 orders.\nAdmin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'ChangeMe123!'}\nCustomer: ava@example.com / password123`);
await mongoose.disconnect();
