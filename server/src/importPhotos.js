// Bulk-load real product photos. Put files in server/product-photos/ named by SKU, then run: npm run photos
//   CC-M-001.jpg            cover photo for every colour       CC-M-001-2.jpg   second photo
//   CC-M-001_chalk.jpg      photo for the Chalk colourway      CC-M-001_coal-2.jpg   second Coal photo
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import sharp from 'sharp';
import Product from './models/Product.js';

const SRC = path.resolve('product-photos');
const OUT = path.resolve('uploads/products');
fs.mkdirSync(OUT, { recursive: true });
const NAME = /^(CC-[MW]-\d{3})(?:_(chalk|ash|coal))?(?:-(\d+))?\.(jpe?g|png|webp|avif)$/i;
const cap = (s) => s[0].toUpperCase() + s.slice(1).toLowerCase();

const groups = {}; const skipped = [];
for (const f of fs.readdirSync(SRC)) {
  const m = f.match(NAME);
  if (!m) { if (!f.startsWith('.') && f !== 'README.md') skipped.push(f); continue; }
  const [, sku, colour, n] = m;
  const g = (groups[sku.toUpperCase()] ||= { all: [], colours: {} });
  const item = { file: f, n: +n || 1 };
  colour ? (g.colours[cap(colour)] ||= []).push(item) : g.all.push(item);
}

await mongoose.connect(process.env.MONGO_URI);
const stamp = Date.now().toString(36); // new filenames each run so browsers never show a stale photo
const convert = async (file, name) => {
  await sharp(path.join(SRC, file)).rotate().resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, name));
  return `/uploads/products/${name}`;
};

let updated = 0;
for (const [sku, g] of Object.entries(groups)) {
  const p = await Product.findOne({ sku });
  if (!p) { console.log(`✗ ${sku}: no such product — skipped`); continue; }
  const sort = (a) => a.sort((x, y) => x.n - y.n);
  const set = {};
  if (g.all.length) set.images = await Promise.all(sort(g.all).map((x, i) => convert(x.file, `${sku}-${stamp}-${i + 1}.jpg`)));
  const colorImages = Object.fromEntries(p.colorImages || []);
  for (const [colour, list] of Object.entries(g.colours)) {
    if (!p.colors.some((c) => c.name === colour)) { console.log(`✗ ${sku}: no ${colour} colourway — skipped`); continue; }
    colorImages[colour] = await Promise.all(sort(list).map((x, i) => convert(x.file, `${sku}-${colour.toLowerCase()}-${stamp}-${i + 1}.jpg`)));
  }
  if (Object.keys(g.colours).length) set.colorImages = colorImages;
  if (!g.all.length && Object.keys(colorImages).length) set.images = Object.values(colorImages)[0].slice(0, 1); // cover falls back to first colour
  await Product.updateOne({ _id: p._id }, { $set: set });
  updated++;
  console.log(`✓ ${sku} ${p.name}: ${g.all.length} general, ${Object.values(g.colours).flat().length} colour photo(s)`);
}
const all = await Product.find({}, 'sku name images').lean();
const stillOld = all.filter((p) => p.images.some((i) => i.startsWith('/uploads/sheet/')));
console.log(`\nUpdated ${updated} product(s). ${skipped.length ? `Ignored (bad name): ${skipped.join(', ')}. ` : ''}${stillOld.length} still use the low-res stand-in photo${stillOld.length ? `: ${stillOld.map((p) => p.sku).join(', ')}` : ''}.`);
await mongoose.disconnect();
