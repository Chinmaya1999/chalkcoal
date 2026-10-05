// Renders an uploaded photo or looping video (e.g. generated with Midjourney / Runway / Veo).
export default function Media({ media, className = '', alt = '', style }) {
  if (!media?.url) return null;
  return media.type === 'video'
    ? <video className={className} style={style} src={media.url} autoPlay muted loop playsInline preload="metadata" aria-label={alt} />
    : <img className={className} style={style} src={media.url} alt={alt} decoding="async" fetchpriority="high" />;
}
