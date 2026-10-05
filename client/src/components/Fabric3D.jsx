import { useEffect, useRef, useState } from 'react';
import Garment from './Garment';

const VERT = /* glsl */ `
  uniform float uTime; uniform vec2 uMouse; uniform float uScroll;
  varying vec3 vPos; varying vec2 vUv;
  void main() {
    vec3 p = position; vUv = uv;
    float hang = smoothstep(2.9, -2.9, p.y);              // 0 at the pinned top edge, 1 at the hem
    float folds = sin(p.x * 3.1 + uTime * 0.5) * 0.34 + sin(p.x * 6.3 - uTime * 0.35 + p.y * 0.6) * 0.14 + sin(p.x * 1.4 + p.y * 0.9 + uTime * 0.22) * 0.2;
    float sway = sin(uTime * 0.6 + p.y * 0.7) * 0.08 + uMouse.x * 0.35 + uScroll * 0.5;
    p.z += (folds * hang + sway * hang * hang) * (1.0 + abs(uMouse.y) * 0.3 + abs(uScroll) * 0.6);
    p.x += sin(p.y * 1.6 + uTime * 0.4) * 0.05 * hang;
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uDark; uniform vec3 uLight; uniform vec2 uMouse; uniform vec2 uRepeat; uniform float uHasTex;
  uniform sampler2D uDiff; uniform sampler2D uNor;
  varying vec3 vPos; varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    float grain = 0.0; float detail = 1.0;
    if (uHasTex > 0.5) {
      vec2 uv = vUv * uRepeat;
      vec3 nm = texture2D(uNor, uv).xyz * 2.0 - 1.0;        // real scanned fibre relief
      n = normalize(n + vec3(nm.xy * 0.85, 0.0));
      detail = 0.55 + texture2D(uDiff, uv).r * 0.95;          // real melange variation
    } else { grain = hash(floor(vPos.xy * 260.0)) * 0.05; }
    vec3 l = normalize(vec3(-0.5 + uMouse.x * 0.9, 0.55 + uMouse.y * 0.5, 1.0));
    float diff = clamp(dot(n, l) * 0.5 + 0.5, 0.0, 1.0);
    float rim = pow(1.0 - abs(n.z), 2.5) * 0.35;
    float tone = clamp(pow(diff, 1.7) + rim - grain, 0.0, 1.0);
    tone = 0.07 + tone * 0.93;                                // ambient floor so dark cloth never goes flat black
    vec3 col = mix(uDark, uLight, tone) * detail;
    col *= 1.0 - smoothstep(0.0, 1.0, abs(vPos.x) / 2.2) * 0.35;  // vignette to the edges
    gl_FragColor = vec4(col, 1.0);
  }`;

// A pinned sheet of cloth wrapped in a real fabric scan (CC0, Poly Haven). It drapes, sways with the
// pointer and with scrolling, and catches light — rendered with three.js (loaded on demand).
export default function Fabric3D({ tone = 'chalk', className = '', fallbackType = 'Hoodie' }) {
  const mount = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let raf = 0, dead = false, cleanup = () => {};
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    import('three').then((THREE) => {
      if (dead) return;
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: reduced }); } catch { setFailed(true); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0, 9.5);

      const dark = tone === 'chalk' ? '#0d0d0c' : '#050505';
      const light = tone === 'chalk' ? '#f4f2ec' : '#adadaa';
      const uniforms = {
        uTime: { value: 0 }, uScroll: { value: 0 }, uMouse: { value: new THREE.Vector2() },
        uDark: { value: new THREE.Color(dark) }, uLight: { value: new THREE.Color(light) },
        uRepeat: { value: new THREE.Vector2(5, 6.5) }, uHasTex: { value: 0 }, uDiff: { value: null }, uNor: { value: null },
      };
      const geo = new THREE.PlaneGeometry(4.6, 6, 140, 180);
      const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide }));
      scene.add(mesh);

      // fabric scan textures (falls back to the procedural grain if they cannot load)
      const loader = new THREE.TextureLoader();
      const prep = (t, srgb) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
      const textures = [];
      Promise.all([loader.loadAsync('/textures/fabric-diffuse.jpg'), loader.loadAsync('/textures/fabric-normal.jpg')]).then(([d, n]) => {
        if (dead) { d.dispose(); n.dispose(); return; }
        uniforms.uDiff.value = prep(d, true); uniforms.uNor.value = prep(n, false); uniforms.uHasTex.value = 1; textures.push(d, n);
        if (reduced) renderer.render(scene, camera);
      }).catch(() => {});

      const size = () => {
        const { clientWidth: w, clientHeight: h } = el;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // scale the sheet so it always covers the whole panel (like object-fit: cover)
        const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        mesh.scale.setScalar(Math.max((vh * camera.aspect) / 4.6, vh / 6) * 1.2);
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(el);

      const target = new THREE.Vector2();
      const onMove = (e) => { const r = el.getBoundingClientRect(); target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)); };
      window.addEventListener('pointermove', onMove, { passive: true });

      // scrolling ruffles the cloth: scroll velocity feeds the shader and decays smoothly
      let lastY = window.scrollY, vel = 0;
      const onScroll = () => { const y = window.scrollY; vel = Math.max(-1, Math.min(1, vel + (y - lastY) / 140)); lastY = y; };
      window.addEventListener('scroll', onScroll, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(el);

      const clock = new THREE.Clock();
      const frame = () => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) return;
        vel *= 0.93;
        uniforms.uTime.value = clock.getElapsedTime();
        uniforms.uScroll.value += (vel - uniforms.uScroll.value) * 0.1;
        uniforms.uMouse.value.lerp(target, 0.05);
        mesh.rotation.y = uniforms.uMouse.value.x * 0.18;
        renderer.render(scene, camera);
      };
      if (reduced) { uniforms.uTime.value = 2; renderer.render(scene, camera); } else frame();

      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll);
        textures.forEach((t) => t.dispose());
        geo.dispose(); mesh.material.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => setFailed(true));

    return () => { dead = true; cleanup(); };
  }, [tone]);

  if (failed) return <div className={className} style={{ display: 'grid', placeItems: 'center' }}><Garment type={fallbackType} color={tone === 'chalk' ? '#f4f2ec' : '#1a1a18'} /></div>;
  return <div ref={mount} className={className} aria-hidden />;
}
