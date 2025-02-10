// routes/orders.js
import { Hono } from 'hono';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const orders = new Hono();

// POST /api/v1/orders (Authenticated)
orders.post('/', verifyToken, (c) => {
  const userId = c.req.user.id;
  try {
    // Retrieve the current cart items
    const cartItems = db.prepare('SELECT * FROM cart_items WHERE user_id = ?').all(userId);
    if (!cartItems.length) {
      return c.json({ error: 'Cart is empty' }, 400);
    }
    // Validate stock and calculate subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product || product.stock < item.quantity) {
        return c.json({ error: `Product ${item.product_id} is out of stock` }, 400);
      }
      subtotal += product.price * item.quantity;
    }
    // For demonstration purposes, fixed tax and shipping values
    const tax = subtotal * 0.1;
    const shipping = 5;
    const discount = 0; // Extend here if discount codes are implemented
    const total = subtotal + tax + shipping - discount;
    
    // Create an order record
    const orderStmt = db.prepare(
      `INSERT INTO orders (user_id, subtotal, tax, shipping, discount, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const orderResult = orderStmt.run(userId, subtotal, tax, shipping, discount, total, 'processing');
    const orderId = orderResult.lastInsertRowid;
    
    // Create order items and update product stock
    const orderItemStmt = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, variant) VALUES (?, ?, ?, ?)'
    );
    for (const item of cartItems) {
      orderItemStmt.run(orderId, item.product_id, item.quantity, item.variant);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
    }
    // Clear the user's cart after order creation
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    
    return c.json({ message: 'Order created', orderId, total });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/v1/orders (Authenticated)
orders.get('/', verifyToken, (c) => {
  const userId = c.req.user.id;
  try {
    const ordersList = db.prepare('SELECT * FROM orders WHERE user_id = ?').all(userId);
    return c.json({ orders: ordersList });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/v1/orders/:id (Authenticated)
orders.get('/:id', verifyToken, (c) => {
  const userId = c.req.user.id;
  const orderId = c.req.param('id');
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    order.items = items;
    return c.json(order);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default orders;
