// routes/cart.js
import { Hono } from 'hono';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const cart = new Hono();

// GET /api/v1/cart (Authenticated)
cart.get('/', verifyToken, (c) => {
  const userId = c.req.user.id;
  try {
    const items = db
      .prepare(
        `SELECT cart_items.*, products.title, products.price
         FROM cart_items
         JOIN products ON cart_items.product_id = products.id
         WHERE cart_items.user_id = ?`
      )
      .all(userId);
    return c.json({ cart: items });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/v1/cart (Authenticated)
cart.post('/', verifyToken, async (c) => {
  const userId = c.req.user.id;
  const data = await c.req.json();
  const { productId, quantity, variant } = data;
  if (!productId || !quantity) {
    return c.json({ error: 'Product ID and quantity are required' }, 400);
  }
  try {
    // Check if the same product/variant is already in the cart
    const existing = db
      .prepare(
        'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND variant = ?'
      )
      .get(userId, productId, JSON.stringify(variant || {}));
    if (existing) {
      // Update quantity if already exists
      const newQuantity = existing.quantity + quantity;
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQuantity, existing.id);
      return c.json({ message: 'Cart item updated', itemId: existing.id });
    } else {
      const stmt = db.prepare(
        'INSERT INTO cart_items (user_id, product_id, quantity, variant) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run(userId, productId, quantity, JSON.stringify(variant || {}));
      return c.json({ message: 'Product added to cart', itemId: result.lastInsertRowid });
    }
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/v1/cart/:itemId (Authenticated)
cart.put('/:itemId', verifyToken, async (c) => {
  const userId = c.req.user.id;
  const itemId = c.req.param('itemId');
  const data = await c.req.json();
  const { quantity, variant } = data;
  if (!quantity && !variant) {
    return c.json({ error: 'Nothing to update' }, 400);
  }
  try {
    // Ensure the cart item belongs to the user
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(itemId, userId);
    if (!item) {
      return c.json({ error: 'Cart item not found' }, 404);
    }
    const updates = [];
    const params = [];
    if (quantity) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (variant) {
      updates.push('variant = ?');
      params.push(JSON.stringify(variant));
    }
    params.push(itemId);
    db.prepare(`UPDATE cart_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return c.json({ message: 'Cart item updated' });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/v1/cart/:itemId (Authenticated)
cart.delete('/:itemId', verifyToken, (c) => {
  const userId = c.req.user.id;
  const itemId = c.req.param('itemId');
  try {
    // Check that the item belongs to the user
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(itemId, userId);
    if (!item) {
      return c.json({ error: 'Cart item not found' }, 404);
    }
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
    return c.json({ message: 'Cart item removed' });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default cart;
