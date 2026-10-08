import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Product from './models/Product.js';

const CHALK = { name: 'Chalk', hex: '#EFEBE2' };
const ASH = { name: 'Ash', hex: '#93958F' };
const COAL = { name: 'Coal', hex: '#252626' };
const SIZES = { men: ['S', 'M', 'L', 'XL', 'XXL'], women: ['XS', 'S', 'M', 'L', 'XL'] };

// Collection One · AW26 catalogue. SKUs are the catalogue codes (unisex CC-U01…, women CC-W01…).
// "Unisex" styles are stored with gender 'men' (S–XXL grade rule) so the existing storefront filters keep working.
// [sku, gender, category, name, type, gsm, colours, GBP price, featured, fabric, description, details[]]
export const catalog = [
  ['CC-U01', 'men', 'tees', 'Heavyweight Tee', 'Tee', 240, [CHALK, ASH, COAL], 58, true, '100% cotton compact single jersey', 'Relaxed regular length with a modest dropped shoulder.', ['Side-seamed body; proposed shoulder drop 2 cm from approved block', '25.4 mm finished 1x1 neck rib; twin-needle collar topstitch', '20 mm turned sleeve and bottom hems; twin-needle finish']],
  ['CC-U02', 'men', 'tees', 'Boxy Tee', 'Boxy Tee', 220, [CHALK, COAL], 52, false, '100% cotton single jersey', 'Wide square body and shorter hem; exaggerated shoulder width.', ['Side-seamed square body with extended shoulder', '20 mm finished 1x1 neck rib with tonal topstitch', '20 mm turned hems; avoid curving bottom hem']],
  ['CC-U03', 'men', 'tees', 'Long Sleeve Tee', 'Long Sleeve', 220, [ASH, COAL], 62, false, '100% cotton single jersey', 'Relaxed straight body with full sleeves and clean cuffs.', ['20 mm neck rib; shoulder seam stabilised with soft tape', '40 mm finished 1x1 sleeve cuffs; cuff seam to underside', '20 mm twin-needle bottom hem']],
  ['CC-U04', 'men', 'sweats', 'Heavyweight Hoodie', 'Hoodie', 420, [CHALK, ASH, COAL], 125, true, '100% cotton loopback French terry', 'Oversized pullover with dropped shoulders and kangaroo pocket.', ['Double-layer two-panel hood; tonal flat 8 mm drawcord', 'Kangaroo pocket: proposed 36 x 22 cm, bottom aligned to waistband', '60 mm rib cuffs and hem; secure pocket entries with bartacks']],
  ['CC-U05', 'men', 'sweats', 'Crewneck Sweat', 'Crewneck', 400, [ASH, COAL], 105, false, '100% cotton loopback French terry', 'Relaxed dropped-shoulder sweatshirt with balanced rib trims.', ['25 mm 1x1 neck rib; 60 mm rib hem and cuffs', 'Soft shoulder tape; overlock shoulder and armhole seams', 'Tonal coverstitch around neck; match cuff and waistband tension']],
  ['CC-U06', 'men', 'bottoms', 'Jogger', 'Jogger', 400, [COAL], 95, true, '100% cotton loopback French terry', 'Relaxed hip and thigh with tapered legs and rib cuffs.', ['40 mm elastic waistband with flat 8 mm drawcord and metal tips', 'Two slant side pockets; pocket bags proposed 28 x 17 cm', '60 mm finished rib cuffs; bartack pocket entries and crotch stress points']],
  ['CC-U07', 'men', 'training', 'Train Tee', 'Tee', 150, [CHALK, COAL], 38, false, '92% polyester / 8% elastane jersey', 'Regular athletic fit with short sleeves and movement ease.', ['10 mm self-fabric neck binding, finished width', 'Four-thread overlock assembly; stretch coverstitch hems', 'Soft heat-transfer slash; no rigid rubber badge on light stretch fabric']],
  ['CC-U08', 'men', 'training', 'Train Long Sleeve', 'Long Sleeve', 150, [COAL], 48, false, '92% polyester / 8% elastane jersey', 'Regular athletic fit with full sleeves and self-fabric cuffs.', ['10 mm self-fabric neck binding; narrow stretch coverstitch', '20 mm turned sleeve/bottom hems; no cotton rib cuffs', 'Soft tonal heat-transfer branding at left chest']],
  ['CC-U09', 'men', 'training', 'Train Short 7"', 'Short', 190, [ASH, COAL], 52, true, '90% polyester / 10% elastane stretch woven', 'Unlined athletic woven short; seven-inch finished inseam.', ['40 mm elastic waist; internal flat drawcord with soft ends', 'Two side pockets with zipper closure and bartacked ends', '25 mm turned hem; proposed 30 mm side vent']],
  ['CC-W01', 'women', 'tees', 'Cropped Tee', 'Crop Tee', 220, [CHALK, COAL], 48, true, '100% cotton single jersey', 'Boxy waist-length crop with relaxed sleeves.', ['20 mm neck rib; soft shoulder tape', 'Straight crop hem and short sleeves with 20 mm twin-needle hems', 'Avoid raw edges; apply tonal badge clear of bust apex']],
  ['CC-W02', 'women', 'tees', 'Relaxed Tee', 'Tee', 200, [ASH, COAL], 50, false, '100% cotton single jersey', 'Easy body with a dropped shoulder and hip-length straight hem.', ['20 mm neck rib and tonal collar topstitch', 'Side-seamed body with 20 mm sleeve/bottom hems', 'Soft printed back-neck identity; left-side hem flag']],
  ['CC-W03', 'women', 'tees', 'Long Sleeve Tee', 'Long Sleeve', 200, [ASH, COAL], 56, false, '95% cotton / 5% elastane single jersey', 'Close relaxed fit with a cropped straight hem and full sleeves.', ['20 mm self-fabric neck band with stretch seam', '20 mm turned sleeve and bottom hems', 'No thumbhole; sleeve opening stays clean and minimal']],
  ['CC-W04', 'women', 'sweats', 'Cropped Hoodie', 'Crop Hoodie', 400, [CHALK, COAL], 110, true, '100% cotton loopback French terry', 'Dropped-shoulder pullover with a cropped rib hem.', ['Double-layer two-panel hood; flat 8 mm drawcord with metal tips', '50 mm rib cuffs and hem; no kangaroo pocket on crop', 'Overlock assembly with tonal coverstitch at armhole']],
  ['CC-W05', 'women', 'sweats', 'Oversized Hoodie', 'Hoodie', 420, [ASH, COAL], 125, false, '100% cotton loopback French terry', 'Generous longline pullover with dropped shoulders and front pocket.', ['Double-layer hood; 8 mm drawcord with matte black metal tips', 'Kangaroo pocket proposed 34 x 21 cm; reinforce entries', '60 mm rib cuffs and hem; printed neck label']],
  ['CC-W06', 'women', 'sweats', 'Crewneck Sweat', 'Crewneck', 400, [ASH, COAL], 105, false, '100% cotton loopback French terry', 'Relaxed crewneck with a slightly shortened body.', ['25 mm neck rib; 60 mm rib cuffs and hem', 'Soft shoulder tape and tonal neck coverstitch', 'Side seams aligned; no decorative contrast seams']],
  ['CC-W07', 'women', 'bottoms', 'Jogger', 'Jogger', 400, [ASH, COAL], 95, false, '100% cotton loopback French terry', 'High-rise relaxed jogger with tapered legs and rib cuffs.', ['40 mm elastic waistband, 8 mm tonal drawcord with metal tips', 'Two slant side pockets; proposed 26 x 16 cm bags', '60 mm rib cuffs; bartacks at pocket ends']],
  ['CC-W08', 'women', 'bottoms', 'Flared Pant', 'Flared Pant', 400, [CHALK, COAL], 100, false, '95% cotton / 5% elastane compact interlock', 'High-rise fitted hip with a gentle flare below the knee.', ['60 mm double self-fabric waistband with 35 mm concealed elastic', 'No external drawcord or pockets; smooth front and back', '25 mm stretch coverstitched hems; symmetric knee-to-hem flare']],
  ['CC-W09', 'women', 'training', 'Train Bra', 'Bra', 250, [ASH, COAL], 42, false, '75% nylon / 25% elastane interlock', 'Scoop-neck racerback training bra with a covered elastic underband.', ['Double front layer; removable cups through inside side openings', 'Soft racerback straps; 35 mm covered underband elastic', 'Flatlock where suitable; soft stretch binding at neck and armholes']],
  ['CC-W10', 'women', 'training', 'Train Tank', 'Tank', 150, [CHALK, COAL], 34, false, '92% polyester / 8% elastane jersey', 'Scoop-neck fitted tank with racerback and hip-length hem.', ['10 mm soft self binding at neckline and armholes', 'Racerback; 20 mm stretch coverstitch bottom hem', 'No built-in bra; soft tonal heat-transfer logo']],
  ['CC-W11', 'women', 'training', 'Train Tee', 'Tee', 150, [CHALK, COAL], 38, false, '92% polyester / 8% elastane jersey', 'Regular athletic body with short set-in sleeves.', ['10 mm self neckline binding; soft internal seams', 'Stretch coverstitch sleeve and bottom hems', 'Tonal heat-transfer slash on left chest']],
  ['CC-W12', 'women', 'training', 'Train Long Sleeve', 'Long Sleeve', 150, [CHALK, COAL], 46, false, '92% polyester / 8% elastane jersey', 'Regular athletic full-sleeve top with a clean crew neckline.', ['10 mm self neckline binding and stretch assembly seams', '20 mm turned sleeve/bottom hems; no rib cuff or thumbholes', 'Soft tonal heat-transfer slash; smooth skin-facing seams']],
  ['CC-W13', 'women', 'training', 'Train Short 5"', 'Short', 190, [ASH, COAL], 46, false, '90% polyester / 10% elastane stretch woven', 'High-rise unlined woven training short with five-inch inseam.', ['40 mm elastic waist with internal drawcord and soft ends', 'Two zipped side pockets; bartacked ends', '25 mm turned hems with proposed 30 mm side vents']],
  ['CC-W14', 'women', 'training', 'Cycling Short', 'Cycling Short', 250, [ASH, COAL], 44, false, '75% nylon / 25% elastane interlock', 'High-rise close-fit training short with a broad waistband.', ['80 mm double self-fabric waistband with 35 mm concealed elastic', 'Flatlock side/inner-leg seams; gusset at crotch', '25 mm stretch coverstitch leg hem; no padding or pockets']],
];

const detailsFor = (fabric, gsm, details) => [
  `${fabric}, ${gsm} gsm`,
  ...details,
  'Tonal slash branding; printed inside identity, subtle side flag',
];

// Product photos cut from the line sheet and AI-upscaled (faces kept natural). Still derived from tiny
// originals — replace with your real photography in the admin for true full clarity.
export function copyPhotos() {
  const assets = fileURLToPath(new URL('../seed-assets/', import.meta.url));
  const uploads = path.resolve('uploads/sheet');
  fs.mkdirSync(uploads, { recursive: true });
  for (const f of fs.readdirSync(assets)) fs.copyFileSync(path.join(assets, f), path.join(uploads, f));
}

// Builds the 23 unsaved Product documents (SKUs CC-U01… / CC-W01…).
export function buildProducts() {
  return catalog.map(([sku, gender, category, name, type, gsm, colors, price, featured, fabric, description, details], i) => {
    const sizes = SIZES[gender];
    const code = `${gender === 'men' ? 'm' : 'w'}${+sku.slice(4)}`;
    return new Product({
      sku, images: [`/uploads/sheet/${code}-hd.jpg`],
      gender, category, name, type, gsm, colors, price, featured: !!featured, note: '',
      description,
      details: detailsFor(fabric, gsm, details),
      variants: colors.flatMap((c) => sizes.map((s, si) => ({ size: s, color: c.name, stock: 3 + ((i * 7 + si * 5 + c.name.length) % 20) }))),
    });
  });
}
