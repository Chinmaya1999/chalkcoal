import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// `value` and `minSubtotal` are authored in GBP; `rate` converts them to the order currency.
couponSchema.methods.check = function (subtotal, rate = 1) {
  if (!this.active) return 'Code is inactive';
  if (this.expiresAt && this.expiresAt < new Date()) return 'Code has expired';
  if (this.usageLimit && this.used >= this.usageLimit) return 'Code usage limit reached';
  if (subtotal / rate < this.minSubtotal) return `Minimum order £${this.minSubtotal}`;
  return null;
};
couponSchema.methods.discountFor = function (subtotal, rate = 1) {
  const d = this.type === 'percent' ? (subtotal * this.value) / 100 : this.value * rate;
  return Math.min(Math.round(d * 100) / 100, subtotal);
};

export default mongoose.model('Coupon', couponSchema);
