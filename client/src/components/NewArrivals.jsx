import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import Reveal from './Reveal';
import { api } from '../api';

// Horizontal, swipeable carousel with Women / Men tabs (Burberry / Louis Vuitton style).
export default function NewArrivals() {
  const [tab, setTab] = useState('women');
  const [data, setData] = useState({ items: [], total: 0 });
  const track = useRef(null);
  useEffect(() => {
    setData({ items: [], total: 0 });
    api.get(`/api/products?gender=${tab}&sort=popular&limit=12`).then(setData).catch(() => {});
    track.current?.scrollTo({ left: 0 });
  }, [tab]);
  const scroll = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section className="arrivals">
      <div className="wrap">
        <Reveal className="arr-head">
          <div>
            <span className="eyebrow muted">AW26</span>
            <h2>New arrivals</h2>
          </div>
          <div className="arr-tools">
            <div className="pills">
              {[['women', 'Women'], ['men', 'Men']].map(([k, l]) => <button key={k} className={`pill ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
            </div>
            <div className="arrows" aria-hidden>
              <button onClick={() => scroll(-1)} aria-label="Previous">←</button>
              <button onClick={() => scroll(1)} aria-label="Next">→</button>
            </div>
          </div>
        </Reveal>
      </div>
      <div className="arr-track" ref={track} tabIndex={0} aria-label={`New arrivals — ${tab}`}>
        {data.items.map((p, i) => <div className="arr-item" key={p._id}><ProductCard product={p} index={i + 1} /></div>)}
      </div>
      <div className="wrap" style={{ marginTop: 28 }}><Link to={`/${tab}`} className="link">View all {tab === 'women' ? "women's" : "men's"} ({data.total})</Link></div>
    </section>
  );
}
