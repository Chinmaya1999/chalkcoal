import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Product from './models/Product.js';

const CHALK = { name: 'Chalk', hex: '#ECE8DF' };
const ASH = { name: 'Ash', hex: '#8B8A87' };
const COAL = { name: 'Coal', hex: '#151515' };
const SIZES = { men: ['S', 'M', 'L', 'XL', 'XXL'], women: ['XS', 'S', 'M', 'L', 'XL'] };

// [gender, category, name, type, gsm, colours, GBP price, featured, note]
const catalog = [
  ['men', 'tees', 'Heavyweight Tee', 'Tee', 240, [CHALK, ASH, COAL], 58, true],
  ['men', 'tees', 'Boxy Tee', 'Boxy Tee', 220, [CHALK, ASH, COAL], 52],
  ['men', 'tees', 'Long Sleeve Tee', 'Long Sleeve', 220, [ASH, COAL], 62],
  ['men', 'sweats', 'Heavyweight Hoodie', 'Hoodie', 420, [CHALK, ASH, COAL], 125, true],
  ['men', 'sweats', 'Crewneck Sweat', 'Crewneck', 400, [ASH, COAL], 105],
  ['men', 'bottoms', 'Jogger', 'Jogger', 400, [COAL], 95, true],
  ['men', 'training', 'Train Tee', 'Tee', 150, [CHALK, COAL], 38],
  ['men', 'training', 'Train Long Sleeve', 'Long Sleeve', 150, [COAL], 48],
  ['men', 'training', 'Train Short 7"', 'Short', 190, [ASH, COAL], 52, true],
  ['women', 'tees', 'Cropped Tee', 'Crop Tee', 220, [CHALK, COAL], 48, true],
  ['women', 'tees', 'Relaxed Tee', 'Tee', 200, [CHALK, COAL], 50],
  ['women', 'tees', 'Long Sleeve Tee', 'Long Sleeve', 200, [ASH, COAL], 56],
  ['women', 'sweats', 'Cropped Hoodie', 'Crop Hoodie', 400, [ASH, COAL], 110, true],
  ['women', 'sweats', 'Oversized Hoodie', 'Hoodie', 420, [ASH, COAL], 125],
  ['women', 'sweats', 'Crewneck Sweat', 'Crewneck', 400, [ASH, COAL], 105],
  ['women', 'bottoms', 'Jogger', 'Jogger', 400, [ASH, COAL], 95],
  ['women', 'bottoms', 'Flared Pant', 'Flared Pant', 400, [CHALK, COAL], 100],
  ['women', 'training', 'Train Bra', 'Bra', 0, [ASH, COAL], 42, false, 'Medium support'],
  ['women', 'training', 'Train Tank', 'Tank', 150, [CHALK, COAL], 34],
  ['women', 'training', 'Train Tee', 'Tee', 150, [CHALK, COAL], 38],
  ['women', 'training', 'Train Long Sleeve', 'Long Sleeve', 150, [CHALK, COAL], 46],
  ['women', 'training', 'Train Short 5"', 'Short', 190, [ASH, COAL], 46],
  ['women', 'training', 'Cycling Short', 'Cycling Short', 250, [CHALK, COAL], 44],
];

const TOPS = ['Tee', 'Boxy Tee', 'Crop Tee', 'Long Sleeve', 'Hoodie', 'Crop Hoodie', 'Crewneck', 'Tank', 'Bra'];
const DRAWCORD = ['Hoodie', 'Crop Hoodie', 'Jogger', 'Flared Pant', 'Short', 'Cycling Short'];
const detailsFor = (type, gsm) => [
  gsm ? `${gsm}gsm premium cotton` : 'Technical stretch fabric',
  ...(TOPS.includes(type) ? ['18mm rubberised badge, left chest (tonal)', 'Printed neck label — no woven tag'] : ['18mm rubberised badge, tonal']),
  'Woven hem flag, 10mm, left side seam (6cm up)',
  ...(DRAWCORD.includes(type) ? ['Matte black metal drawcord tips (flat 8mm)'] : []),
  'Twin-needle topstitch, straight hem',
  'Designed in London · Made in India',
  'Packed in a recycled poly bag',
];


// Product photos cut from the line sheet and AI-upscaled (faces kept natural). Still derived from tiny
// originals — replace with your real photography in the admin for true full clarity.
export function copyPhotos() {
  const assets = fileURLToPath(new URL('../seed-assets/', import.meta.url));
  const uploads = path.resolve('uploads/sheet');
  fs.mkdirSync(uploads, { recursive: true });
  for (const f of fs.readdirSync(assets)) fs.copyFileSync(path.join(assets, f), path.join(uploads, f));
}

// Builds the 23 unsaved Product documents (SKUs CC-M-001… / CC-W-001…).
export function buildProducts() {
  const n = { men: 0, women: 0 };
  return catalog.map(([gender, category, name, type, gsm, colors, price, featured, note], i) => {
    const sizes = SIZES[gender];
    return new Product({
      sku: `CC-${gender === 'men' ? 'M' : 'W'}-${String(++n[gender]).padStart(3, '0')}`,
      images: [`/uploads/sheet/${gender === 'men' ? 'm' : 'w'}${n[gender]}-hd.jpg`],
      gender, category, name, type, gsm, colors, price, featured: !!featured, note: note || '',
      description: 'Minimal. Purposeful. Everyday essentials.',
      details: detailsFor(type, gsm),
      variants: colors.flatMap((c) => sizes.map((s, si) => ({ size: s, color: c.name, stock: 3 + ((i * 7 + si * 5 + c.name.length) % 20) }))),
    });
  });
}
