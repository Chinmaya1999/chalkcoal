// Vector garment silhouettes — shown until real product photos are uploaded in the admin.
const SHAPES = {
  tee: 'M62 34 L88 24 Q100 40 112 24 L138 34 L184 74 L160 98 L144 84 L144 218 L56 218 L56 84 L40 98 L16 74 Z',
  boxy: 'M54 36 L86 26 Q100 42 114 26 L146 36 L194 72 L172 100 L154 88 L154 212 L46 212 L46 88 L28 100 L6 72 Z',
  crop: 'M64 40 L88 30 Q100 44 112 30 L136 40 L180 78 L160 100 L144 88 L144 168 L56 168 L56 88 L40 100 L20 78 Z',
  long: 'M62 34 L88 24 Q100 40 112 24 L138 34 L190 190 L168 196 L144 96 L144 218 L56 218 L56 96 L32 196 L10 190 Z',
  tank: 'M72 24 L90 24 Q100 52 110 24 L128 24 L138 86 L142 218 L58 218 L62 86 Z',
  hoodie: 'M70 40 Q100 4 130 40 L186 84 L172 196 L150 192 L146 106 L146 222 L54 222 L54 106 L50 192 L28 196 L14 84 Z',
  crophoodie: 'M70 44 Q100 8 130 44 L186 86 L172 176 L150 172 L146 108 L146 176 L54 176 L54 108 L50 172 L28 176 L14 86 Z',
  short: 'M50 48 L150 48 L162 176 L106 176 L100 106 L94 176 L38 176 Z',
  cycling: 'M60 70 L140 70 L146 170 L104 170 L100 112 L96 170 L54 170 Z',
  jogger: 'M56 28 L144 28 L150 226 L112 226 L100 90 L88 226 L50 226 Z',
  flared: 'M56 28 L144 28 L152 100 L174 228 L108 228 L100 100 L92 228 L26 228 L48 100 Z',
  bra: 'M52 70 L80 60 L100 76 L120 60 L148 70 L140 126 Q100 144 60 126 Z',
};
const MAP = { Tee: 'tee', 'Boxy Tee': 'boxy', 'Crop Tee': 'crop', 'Long Sleeve': 'long', Crewneck: 'long', Tank: 'tank', Hoodie: 'hoodie', 'Crop Hoodie': 'crophoodie', Short: 'short', 'Cycling Short': 'cycling', Jogger: 'jogger', 'Flared Pant': 'flared', Bra: 'bra' };

const isLight = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return ((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3 > 190; };

export default function Garment({ type = 'Tee', color = '#151515', className }) {
  const key = MAP[type] || 'tee';
  const stroke = isLight(color) ? '#b9b6ad' : '#000';
  const seam = !['short', 'cycling', 'jogger', 'flared', 'bra'].includes(key);
  return (
    <svg viewBox="0 0 200 250" className={className} role="img" aria-label={`${type} illustration`}>
      <ellipse cx="100" cy="240" rx="62" ry="4.5" fill="#000" opacity="0.1" />
      <path d={SHAPES[key]} fill={color} stroke={stroke} strokeWidth="0.8" strokeLinejoin="round" />
      {seam && <path d="M100 44 L100 214" stroke={stroke} strokeOpacity="0.22" strokeWidth="0.6" />}
      {key.includes('hoodie') && <path d="M82 54 Q100 78 118 54" fill="none" stroke={stroke} strokeOpacity="0.5" strokeWidth="0.8" />}
      {['short', 'jogger', 'flared'].includes(key) && <path d="M50 58 L150 58" stroke={stroke} strokeOpacity="0.3" strokeWidth="0.6" />}
      {/* tonal rubber badge */}
      {!['short', 'cycling', 'jogger', 'flared'].includes(key) && <rect x="118" y="62" width="9" height="9" rx="1.5" fill="none" stroke={stroke} strokeOpacity="0.4" strokeWidth="0.6" />}
    </svg>
  );
}

// Photos for a colourway: colour-specific ones when uploaded, otherwise the product's general photos.
export const photosFor = (p, colorName) => (p.colorImages?.[colorName]?.length ? p.colorImages[colorName] : p.images) || [];

// Shows an uploaded photo when there is one, otherwise a silhouette in the product colour.
export function ProductVisual({ product, colorIndex = 0, imageIndex = 0 }) {
  const color = product.colors?.[colorIndex];
  const src = photosFor(product, color?.name)[imageIndex];
  if (src) return <img src={src} alt={`${product.name}${color?.name ? ` in ${color.name}` : ''}`} width="720" height="900" loading="lazy" decoding="async" />;
  return <Garment type={product.type} color={color?.hex || product.colors?.[0]?.hex} />;
}
