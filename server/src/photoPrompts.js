// Writes ../PHOTO-PROMPTS.md: one prompt + target filename per product colourway. Run: node src/photoPrompts.js
import fs from 'node:fs';
import { buildProducts } from './catalog.js';

const FIT = {
  Tee: 'classic crew-neck t-shirt, straight hem', 'Boxy Tee': 'boxy oversized-fit t-shirt with dropped shoulders', 'Crop Tee': 'cropped boxy t-shirt',
  'Long Sleeve': 'long-sleeve crew-neck t-shirt', Tank: 'fitted ribbed training tank top', Bra: 'medium-support training bra', Hoodie: 'heavyweight pullover hoodie with kangaroo pocket and flat drawcords',
  'Crop Hoodie': 'cropped heavyweight hoodie with drawcords', Crewneck: 'heavyweight crewneck sweatshirt, relaxed fit', Jogger: 'tapered heavyweight jogger with ribbed cuffs and flat drawcord',
  'Flared Pant': 'relaxed flared sweatpant with drawcord waist', Short: 'training short with elastic waist', 'Cycling Short': 'high-waisted cycling short',
};
const TONE = { Chalk: 'warm off-white (Chalk, #ECE8DF)', Ash: 'mid heather grey (Ash, #8B8A87)', Coal: 'solid black (Coal, #151515)' };
const STYLE = 'Premium UK minimalist menswear/womenswear e-commerce photo. Seamless soft grey studio backdrop (#CFCDC8), soft diffused natural light, photorealistic, sharp fabric texture, true-to-colour. Model looks slightly off-camera, relaxed pose, framed from the top of the head (or chin, for crops) to mid-thigh. No text, no logos except a tiny tonal rubberised badge on the left chest. Portrait 4:5 ratio, 2048×2560 px, ultra high resolution.';

let md = `# Product photo prompts\n\nUse the same AI image tool that made your line sheet. **Generate each photo on its own at the highest resolution it offers** (2048×2560 ideal), keep the same model per gender for consistency, then save each file with the name shown and run \`npm run photos\` in /server.\n\nIf the tool tops out at ~1024px, upscale first (ask me — Real-ESRGAN is already set up).\n\n**Shared style (already included in every prompt):** ${STYLE}\n\n`;
for (const p of buildProducts()) {
  md += `## ${p.sku} — ${p.name} (${p.gender}, ${p.gsm ? p.gsm + 'gsm' : 'technical stretch'}${p.note ? ', ' + p.note : ''})\n`;
  for (const c of p.colors) {
    const who = p.gender === 'men' ? 'a male model, early 20s, dark curly hair' : 'a female model, mid 20s, long dark hair';
    md += `- \`${p.sku}_${c.name.toLowerCase()}.jpg\` — ${who} wearing a ${TONE[c.name]} ${FIT[p.type] || p.type.toLowerCase()}${p.gsm >= 400 ? ', thick heavyweight fleece' : p.gsm ? `, ${p.gsm}gsm cotton` : ''}. ${STYLE}\n`;
  }
  md += '\n';
}
fs.writeFileSync(new URL('../../PHOTO-PROMPTS.md', import.meta.url), md);
console.log('Wrote PHOTO-PROMPTS.md');
