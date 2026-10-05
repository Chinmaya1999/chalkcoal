import { ZodError } from 'zod';

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (_req, res) => res.status(404).json({ message: 'Not found' });

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join(', ') });
  }
  if (err.code === 11000) return res.status(409).json({ message: `Already exists: ${Object.keys(err.keyValue || {}).join(', ')}` });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Something went wrong' : err.message });
};

export const httpError = (status, message) => Object.assign(new Error(message), { status });
