import mongoose from 'mongoose';

const media = { type: { type: String, enum: ['', 'image', 'video'], default: '' }, url: { type: String, default: '' } };

// Single document holding editable storefront content.
const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'site', unique: true },
  collections: { men: media, women: media }, // hero photos / looping videos
  rates: { USD: Number, EUR: Number, AED: Number }, // per £1
  announcements: {
    type: [String],
    default: ['Delivering to the UK, Europe & USA', 'Minimal. Purposeful. Everyday essentials.', 'Designed in London', 'Heavyweight 240 – 420gsm'],
  },
});

export default mongoose.model('Setting', settingSchema);
