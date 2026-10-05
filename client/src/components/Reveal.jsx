import { useEffect, useRef, useState } from 'react';

export default function Reveal({ as: Tag = 'div', delay = 0, mask = false, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return setSeen(true);
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return setSeen(true); // already on screen
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`rv ${mask ? 'mask' : ''} ${seen ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>;
}
