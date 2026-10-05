import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const setCookie = (res, token) =>
  res.cookie('cc_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 3600 * 1000,
  });

const load = async (req) => {
  const token = req.cookies?.cc_token;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(id);
  } catch {
    return null;
  }
};

export const optionalAuth = async (req, _res, next) => {
  req.user = await load(req);
  next();
};

export const requireAuth = async (req, res, next) => {
  req.user = await load(req);
  if (!req.user) return res.status(401).json({ message: 'Please sign in' });
  next();
};

export const requireAdmin = async (req, res, next) => {
  req.user = await load(req);
  if (!req.user) return res.status(401).json({ message: 'Please sign in' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  next();
};
