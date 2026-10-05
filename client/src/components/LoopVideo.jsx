import { useEffect, useRef, useState } from 'react';

// Silent looping background video. Plays only while visible, never autoplays for people who ask for
// reduced motion (they get the poster frame), and loads nothing until it is about to be seen.
export default function LoopVideo({ src, poster, className = '', style, active = true, eager = false, label = '' }) {
  const ref = useRef(null);
  const [near, setNear] = useState(eager);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const v = ref.current;
    if (!v || reduced || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setNear(true);
      if (!active || !e.isIntersecting) v.pause();
      else v.play().catch(() => {});
    }, { rootMargin: '200px', threshold: 0.05 });
    io.observe(v);
    return () => io.disconnect();
  }, [active, reduced]);

  useEffect(() => {
    const v = ref.current;
    if (!v || reduced) return;
    if (active && near) v.play().catch(() => {}); else v.pause();
  }, [active, near, reduced]);

  if (reduced) return <img className={className} style={style} src={poster} alt={label} decoding="async" />;
  return (
    <video ref={ref} className={className} style={style} poster={poster} muted loop playsInline preload={near ? 'auto' : 'none'} aria-label={label} aria-hidden={label ? undefined : true} disablePictureInPicture>
      {near && <source src={src} type="video/mp4" />}
    </video>
  );
}
