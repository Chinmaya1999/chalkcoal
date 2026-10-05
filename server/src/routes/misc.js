import { Router } from 'express';
import { z } from 'zod';
import Coupon from '../models/Coupon.js';
import Subscriber from '../models/Subscriber.js';
import Setting from '../models/Setting.js';
import { getRates } from '../pricing.js';
import { CURRENCIES, COUNTRIES } from '../config/markets.js';
import { wrap, httpError } from '../middleware/error.js';

const r = Router();

r.get('/settings', wrap(async (_req, res) => {
  const doc = (await Setting.findOne({ key: 'site' })) || (await Setting.create({ key: 'site' }));
  res.json({ ...doc.toJSON(), rates: await getRates(), markets: { currencies: CURRENCIES, countries: COUNTRIES } });
}));

r.post('/newsletter', wrap(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  await Subscriber.updateOne({ email: email.toLowerCase() }, { email }, { upsert: true });
  res.json({ ok: true });
}));

r.get('/coupons/:code', wrap(async (req, res) => {
  const c = await Coupon.findOne({ code: req.params.code.toUpperCase() });
  if (!c) throw httpError(404, 'Invalid code');
  res.json({ code: c.code, type: c.type, value: c.value });
}));

export default r;
