import { test, expect } from 'bun:test';
import { Hono } from 'hono';
import users from '../routes/users.js';
import db from '../db.js';
import jwt from 'jsonwebtoken';

const app = new Hono();
app.route('/api/v1/users', users);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper function to make requests
async function request(method, path, body = {}, token = '') {
  return await app.request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
}

test('User Registration - Success', async () => {
  const response = await request('POST', '/api/v1/users/register', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  });
  const json = await response.json();
  
  expect(response.status).toBe(200);
  expect(json).toHaveProperty('message', 'User registered');
  expect(json).toHaveProperty('userId');
});

test('User Registration - Missing Fields', async () => {
  const response = await request('POST', '/api/v1/users/register', {
    email: 'test@example.com',
  });
  const json = await response.json();

  expect(response.status).toBe(400);
  expect(json).toHaveProperty('error', 'Name, email and password are required');
});

test('User Login - Success', async () => {
  const response = await request('POST', '/api/v1/users/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  const json = await response.json();

  expect(response.status).toBe(200);
  expect(json).toHaveProperty('token');
});

test('User Login - Invalid Credentials', async () => {
  const response = await request('POST', '/api/v1/users/login', {
    email: 'wrong@example.com',
    password: 'wrongpassword',
  });
  const json = await response.json();

  expect(response.status).toBe(401);
  expect(json).toHaveProperty('error', 'Invalid credentials');
});

test('Get User Profile - Unauthorized', async () => {
  const response = await request('GET', '/api/v1/users/profile');
  const json = await response.json();

  expect(response.status).toBe(401);
  expect(json).toHaveProperty('error', 'Unauthorized');
});

test('Get User Profile - Success', async () => {
  const loginResponse = await request('POST', '/api/v1/users/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  const { token } = await loginResponse.json();

  const profileResponse = await request('GET', '/api/v1/users/profile', {}, token);
  const json = await profileResponse.json();

  expect(profileResponse.status).toBe(200);
  expect(json).toHaveProperty('name', 'Test User');
  expect(json).toHaveProperty('email', 'test@example.com');
});

test('Update User Profile - Success', async () => {
  const loginResponse = await request('POST', '/api/v1/users/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  const { token } = await loginResponse.json();

  const updateResponse = await request(
    'PUT',
    '/api/v1/users/profile',
    { name: 'Updated User' },
    token
  );
  const json = await updateResponse.json();

  expect(updateResponse.status).toBe(200);
  expect(json).toHaveProperty('message', 'Profile updated');

  // Verify the update
  const profileResponse = await request('GET', '/api/v1/users/profile', {}, token);
  const updatedJson = await profileResponse.json();
  expect(updatedJson).toHaveProperty('name', 'Updated User');
});