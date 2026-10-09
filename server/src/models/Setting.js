import mongoose from 'mongoose';

const media = { type: { type: String, enum: ['', 'image', 'video'], default: '' }, url: { type: String, default: '' } };

// Single document holding editable storefront content.
const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'site', unique: true },
  collections: { men: media, women: media }, // hero photos / looping videos
  rates: { USD: Number, EUR: Number, AED: Number }, // per £1
  // Festival / seasonal storefront theme (banner + falling effect), edited in Admin → Festivals
  festival: {
    enabled: { type: Boolean, default: false },
    theme: { type: String, default: '' },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    cta: { type: String, default: '' },
    link: { type: String, default: '/shop' },
    start: { type: String, default: '' }, // YYYY-MM-DD, optional
    end: { type: String, default: '' },
    sitewide: { type: Boolean, default: true }, // falling effect over the whole site, not just the banner
    showLogo: { type: Boolean, default: true },
    image: { type: String, default: '' }, // custom uploaded banner design
  },
  announcements: {
    type: [String],
    default: ['Delivering to the UK, Europe & USA', 'Minimal. Purposeful. Everyday essentials.', 'Designed in London', 'Heavyweight 240 – 420gsm'],
  },
});

export default mongoose.model('Setting', settingSchema);
