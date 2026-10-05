import { useState } from 'react';

// The Chalk&Coal wordmark. `tone="ink"` (Coal) for light backgrounds, `tone="chalk"` for dark ones.
export default function Logo({ tone = 'ink', className = '' }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className={`logo ${className}`} aria-label="Chalk&Coal">Chalk&amp;Coal</span>;
  return <img src={`/logo-${tone}.png`} alt="Chalk&Coal" width="1239" height="318" className={`logo-img ${className}`} onError={() => setBroken(true)} />;
}
