// Safe for a live database: adds any missing products (matched by SKU), never deletes or edits anything,
// and creates an admin login only if no admin exists yet. Run with: npm run products
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js';
import Setting from './models/Setting.js';
import { buildProducts, copyPhotos } from './catalog.js';

copyPhotos();
await mongoose.connect(process.env.MONGO_URI);
await Product.init(); // make sure unique + text indexes exist

const have = new Set((await Product.find({}, 'sku').lean()).map((p) => p.sku));
const missing = buildProducts().filter((p) => !have.has(p.sku));
for (const p of missing) await p.save();

// Upgrade the old low-res stand-in photos to the HD ones — only where the image is still the default.
for (const p of buildProducts()) {
  const old = p.images[0].replace('-hd.jpg', '.jpg');
  await Product.updateOne({ sku: p.sku, images: [old] }, { $set: { images: p.images } });
}
console.log(`Products: added ${missing.length}, already present ${have.size}, total ${await Product.countDocuments()}.`);

await Setting.updateOne({ key: 'site' }, { $setOnInsert: { key: 'site' } }, { upsert: true });

if (!(await User.exists({ role: 'admin' }))) {
  const email = process.env.ADMIN_EMAIL || 'admin@chalkcoal.com';
  await User.create({ name: 'Admin', email, password: process.env.ADMIN_PASSWORD || 'ChangeMe123!', role: 'admin' });
  console.log(`Admin created: ${email} / ${process.env.ADMIN_PASSWORD || 'ChangeMe123!'}  — change this password.`);
}
await mongoose.disconnect();
