// routes/products.js
import { Hono } from 'hono';
import db from '../db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const products = new Hono();

// GET /api/v1/products
products.get('/', (c) => {
  // Get query parameters for pagination, filtering and sorting
  const { query } = c.req;
  const page = parseInt(query('page')) || 1;
  const limit = parseInt(query('limit')) || 10;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM products';
  const conditions = [];
  const params = [];

  // Filtering by category
  const category = query('category');
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  // Filtering by price range
  const priceMin = query('price_min');
  if (priceMin) {
    conditions.push('price >= ?');
    params.push(priceMin);
  }
  const priceMax = query('price_max');
  if (priceMax) {
    conditions.push('price <= ?');
    params.push(priceMax);
  }
  // Simple search by keyword (in title or description)
  const search = query('search');
  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  // Sorting (default by id)
  const sort = query('sort') || 'id';
  const order = query('order') || 'ASC';
  sql += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const stmt = db.prepare(sql);
    const productsList = stmt.all(...params);
    return c.json({ products: productsList, page, limit });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/v1/products/:id
products.get('/:id', (c) => {
  const id = c.req.param('id');
  try {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const product = stmt.get(id);
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    return c.json(product);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/v1/products (Admin only)
products.post('/', verifyToken, isAdmin, async (c) => {
  const data = await c.req.json();
  const { title, description, images, price, stock, category, rating, variants } = data;
  try {
    const stmt = db.prepare(
      `INSERT INTO products (title, description, images, price, stock, category, rating, variants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      title,
      description,
      JSON.stringify(images),
      price,
      stock,
      category,
      rating,
      JSON.stringify(variants)
    );
    return c.json({ message: 'Product created', productId: result.lastInsertRowid });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/v1/products/:id (Admin only)
products.put('/:id', verifyToken, isAdmin, async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();

  const fields = [];
  const params = [];
  if (data.title) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.description) {
    fields.push('description = ?');
    params.push(data.description);
  }
  if (data.images) {
    fields.push('images = ?');
    params.push(JSON.stringify(data.images));
  }
  if (data.price) {
    fields.push('price = ?');
    params.push(data.price);
  }
  if (data.stock) {
    fields.push('stock = ?');
    params.push(data.stock);
  }
  if (data.category) {
    fields.push('category = ?');
    params.push(data.category);
  }
  if (data.rating) {
    fields.push('rating = ?');
    params.push(data.rating);
  }
  if (data.variants) {
    fields.push('variants = ?');
    params.push(JSON.stringify(data.variants));
  }
  if (!fields.length) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  params.push(id);
  try {
    const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    if (result.changes === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }
    return c.json({ message: 'Product updated' });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/v1/products/:id (Admin only)
products.delete('/:id', verifyToken, isAdmin, (c) => {
  const id = c.req.param('id');
  try {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }
    return c.json({ message: 'Product deleted' });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default products;
