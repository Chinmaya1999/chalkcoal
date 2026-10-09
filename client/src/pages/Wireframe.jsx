import { useSeo } from '../seo';

// Low-fidelity layout of the home page: where the hook, story and calls to action sit.
const Box = ({ tag, children, className = '' }) => <div className={`wf-box tag ${className}`} data-tag={tag}>{children}</div>;

export default function Wireframe() {
  useSeo({ title: 'Home page wireframe', noindex: true });
  return (
    <div className="wrap wf">
      <h1>Home page wireframe</h1>
      <p className="wf-note">Layout sketch only — no final colours, photos or copy. HOOK = first thing seen · CTA = what the visitor should do next.</p>
      <Box tag="ANNOUNCEMENT BAR">Free delivery · Designed in London</Box>
      <Box tag="HEADER">Menu · Logo · Currency · Account · Bag</Box>
      <Box tag="1 · HOOK" className="hero">Full-screen looping video<small>Headline + one-line sub-text</small><span className="wf-cta" style={{ marginTop: 14 }}>CTA — Shop women</span></Box>
      <Box tag="TRUST BAR">Delivery · Returns · Secure payment</Box>
      <div className="wf-row"><Box tag="2 · CATEGORIES">Women panel<small>CTA — Shop women</small></Box><Box tag="2 · CATEGORIES">Men panel<small>CTA — Shop men</small></Box></div>
      <Box tag="3 · NEW ARRIVALS">Product grid (image · name · price)</Box>
      <Box tag="4 · FEATURE">Campaign video — heavyweight hoodie<small>Price + CTA — Discover</small></Box>
      <div className="wf-row"><Box tag="5 · STORY">Brand image / 3D fabric</Box><Box tag="5 · STORY">"Built for the in-between." + 2 short paragraphs<small>CTA — Shop the collection · link — Read the story</small></Box></div>
      <Box tag="6 · LOOKBOOK">Editorial image strip</Box>
      <Box tag="7 · PROOF">Fabric detail — 420gsm · colours · design details</Box>
      <Box tag="8 · CLOSING CTA">"Made for the in-between."<small>Two buttons — Shop women · Shop men</small></Box>
      <Box tag="NEWSLETTER">Email sign-up</Box>
      <Box tag="FOOTER">Links · Policies · Social</Box>
    </div>
  );
}
