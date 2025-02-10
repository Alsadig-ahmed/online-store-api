// middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const verifyToken = async (c, next) => {
  const authHeader = c.req.headers.get('Authorization');
  if (!authHeader) {
    return c.json({ error: 'No token provided' }, 401);
  }
  // Expect header to be in the format: "Bearer <token>"
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach decoded user info to the request (Hono allows setting properties on c.req)
    c.req.user = decoded;
    return next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

export const isAdmin = async (c, next) => {
  if (!c.req.user || c.req.user.role !== 'admin') {
    return c.json({ error: 'Admin privileges required' }, 403);
  }
  return next();
};
