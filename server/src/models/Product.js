import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  { size: String, color: String, stock: { type: Number, default: 0, min: 0 } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    details: [String],
    gender: { type: String, enum: ['men', 'women'], required: true },
    category: { type: String, enum: ['tees', 'sweats', 'bottoms', 'training'], required: true },
    type: { type: String, default: '' },
    gsm: { type: Number, default: 0 },
    note: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 }, // GBP
    priceOverrides: { USD: { type: Number, min: 0 }, EUR: { type: Number, min: 0 }, AED: { type: Number, min: 0 } },
    colors: [{ name: String, hex: String }],
    images: [String],
    colorImages: { type: Map, of: [String], default: {} }, // photos per colour name, e.g. { Chalk: [url, …] }
    variants: [variantSchema],
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.virtual('stock').get(function () {
  return (this.variants || []).reduce((n, v) => n + v.stock, 0);
});
productSchema.set('toJSON', { virtuals: true, flattenMaps: true });
productSchema.index({ name: 'text', description: 'text', type: 'text' });

productSchema.pre('validate', function (next) {
  if (!this.slug) this.slug = `${this.gender}-${this.name}-${this.sku}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  next();
});

export default mongoose.model('Product', productSchema);
