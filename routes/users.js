// routes/users.js
import { Hono } from 'hono';
import db from '../db.js';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';

const users = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Bun's hash function
async function hashPassword(password) {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10
  });
}

async function comparePassword(password, hashedPassword) {
  return await Bun.password.verify(password, hashedPassword);
}

// POST /api/v1/users/register
users.post('/register', async (c) => {
  const data = await c.req.json();
  const { name, email, password } = data;
  if (!name || !email || !password) {
    return c.json({ error: 'Name, email and password are required' }, 400);
  }
  try {
    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400);
    }
    const hashedPassword = await hashPassword(password);
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name, email, hashedPassword);
    return c.json({ message: 'User registered', userId: result.lastInsertRowid });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/v1/users/login
users.post('/login', async (c) => {
  const data = await c.req.json();
  const { email, password } = data;
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    // Generate JWT token with user info
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    return c.json({ token });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/v1/users/profile (Authenticated)
users.put('/profile', verifyToken, async (c) => {
  const userId = c.req.user.id;
  const data = await c.req.json();
  const { name, email, password } = data;
  const fields = [];
  const params = [];
  if (name) {
    fields.push('name = ?');
    params.push(name);
  }
  if (email) {
    fields.push('email = ?');
    params.push(email);
  }
  if (password) {
    const hashedPassword = await hashPassword(password);
    fields.push('password = ?');
    params.push(hashedPassword);
  }
  if (!fields.length) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  params.push(userId);
  try {
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    return c.json({ message: 'Profile updated' });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/v1/users/profile (Authenticated)
users.get('/profile', verifyToken, (c) => {
  const userId = c.req.user.id;
  try {
    const user = db
      .prepare('SELECT id, name, email, role FROM users WHERE id = ?')
      .get(userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json(user);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default users;
