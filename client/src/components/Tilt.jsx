import { useRef } from 'react';

// Pointer-driven 3D tilt with a moving highlight. Disabled for touch and reduced motion.
export default function Tilt({ children, max = 8, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const fine = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;
  const move = (e) => {
    const el = ref.current; if (!el || !fine) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) scale3d(1.02,1.02,1.02)`;
    el.style.setProperty('--hx', `${(x + 0.5) * 100}%`); el.style.setProperty('--hy', `${(y + 0.5) * 100}%`);
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return <Tag ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>{children}</Tag>;
}
