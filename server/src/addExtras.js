// Adds the extras that come from the PHOTOS folder but are outside the 23-style catalogue.
// Safe to re-run; run it (then `npm run photos`) after every `npm run seed`, because seeding wipes products.
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';

await mongoose.connect(process.env.MONGO_URI);
const CHALK = { name: 'Chalk', hex: '#EFEBE2' };
const COAL = { name: 'Coal', hex: '#252626' };

// 1. Signature Polo (new product, live)
if (await Product.findOne({ sku: 'CC-U10' })) await Product.updateOne({ sku: 'CC-U10' }, { active: true });
else await Product.create({
  sku: 'CC-U10', gender: 'men', category: 'tees', name: 'Signature Polo', type: 'Polo', gsm: 0, price: 65, active: true, featured: false,
  colors: [COAL], description: 'Black pique polo with the Signature Ampersand mark in Chalk embroidery.',
  details: ['Chalk ampersand embroidery, left chest', 'Two-button placket, ribbed collar and cuffs'],
  variants: ['S', 'M', 'L', 'XL', 'XXL'].map((size) => ({ size, color: 'Coal', stock: 10 })),
});

// 2. Relaxed Tee (CC-W02) in Chalk — the PHOTOS folder has a Chalk photo for it
const w02 = await Product.findOne({ sku: 'CC-W02' });
if (w02 && !w02.colors.some((c) => c.name === 'Chalk')) {
  w02.colors.unshift(CHALK);
  ['XS', 'S', 'M', 'L', 'XL'].forEach((size) => w02.variants.push({ size, color: 'Chalk', stock: 10 }));
  await w02.save();
}
console.log('Extras ready: CC-U10 (live), CC-W02 Chalk');
await mongoose.disconnect();
