import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken, setCookie, requireAuth, optionalAuth } from '../middleware/auth.js';
import { wrap, httpError } from '../middleware/error.js';

const r = Router();
const creds = z.object({ email: z.string().email(), password: z.string().min(8, 'min 8 characters') });

r.post('/register', wrap(async (req, res) => {
  const { name, email, password } = creds.extend({ name: z.string().min(1) }).parse(req.body);
  if (await User.findOne({ email })) throw httpError(409, 'Email already registered');
  const user = await User.create({ name, email, password });
  setCookie(res, signToken(user.id));
  res.status(201).json({ user: { id: user.id, name, email, role: user.role } });
}));

r.post('/login', wrap(async (req, res) => {
  const { email, password } = creds.parse(req.body);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matches(password))) throw httpError(401, 'Wrong email or password');
  setCookie(res, signToken(user.id));
  res.json({ user: { id: user.id, name: user.name, email, role: user.role } });
}));

r.post('/logout', (_req, res) => res.clearCookie('cc_token').json({ ok: true }));

r.get('/me', optionalAuth, (req, res) => {
  const u = req.user;
  res.json({ user: u && { id: u.id, name: u.name, email: u.email, role: u.role, address: u.address, wishlist: u.wishlist } });
});

r.put('/me', requireAuth, wrap(async (req, res) => {
  const body = z.object({
    name: z.string().min(1).optional(),
    address: z.object({}).passthrough().optional(),
  }).parse(req.body);
  Object.assign(req.user, body);
  await req.user.save();
  res.json({ ok: true });
}));

r.post('/wishlist/:productId', requireAuth, wrap(async (req, res) => {
  const id = req.params.productId;
  const has = req.user.wishlist.some((p) => p.toString() === id);
  req.user.wishlist = has ? req.user.wishlist.filter((p) => p.toString() !== id) : [...req.user.wishlist, id];
  await req.user.save();
  res.json({ wishlist: req.user.wishlist });
}));

export default r;
