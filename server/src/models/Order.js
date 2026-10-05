import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    number: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: String,
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        sku: String,
        size: String,
        color: String,
        price: Number,
        qty: Number,
        image: String,
      },
    ],
    shipping: { name: String, line1: String, line2: String, city: String, state: String, zip: String, country: String, phone: String },
    currency: { type: String, enum: ['GBP', 'USD', 'EUR', 'AED'], default: 'GBP' },
    subtotal: Number,
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: Number,
    totalBase: Number, // total converted to GBP, for reporting across currencies
    coupon: String,
    status: { type: String, enum: ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending' },
    payment: { method: { type: String, enum: ['card', 'cod'], default: 'cod' }, paid: { type: Boolean, default: false }, stripeSession: String },
    tracking: String,
    note: String,
    timeline: [{ status: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (!this.number) this.number = `CC-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  next();
});

export default mongoose.model('Order', orderSchema);
