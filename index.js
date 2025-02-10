// index.js
import { Hono } from 'hono';
import products from './routes/products.js';
import users from './routes/users.js';
import cart from './routes/cart.js';
import orders from './routes/orders.js';

const app = new Hono();

// Mount routes under /api/v1
app.route('/api/v1/products', products);
app.route('/api/v1/users', users);
app.route('/api/v1/cart', cart);
app.route('/api/v1/orders', orders);

// 404 handler for unmatched routes
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

const port = process.env.PORT || 3000;

export default { 
  port, 
  fetch: app.fetch, 
} 
