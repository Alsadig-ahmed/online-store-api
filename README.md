# Online Store RESTful API

Welcome to the Online Store RESTful API! This project provides a comprehensive backend for managing an online store, built using Bun, Hono, and SQLite. It includes features for product management, user registration and login, shopping cart management, and order processing.

## Features

- **Product Management**: Perform CRUD operations with support for pagination, filtering, and sorting.
- **User Management**: Register, login using JWT, and update user profiles.
- **Shopping Cart**: Add, update, and remove items from the shopping cart.
- **Order Processing**: Create and manage orders from the shopping cart, with stock validation and price calculations.
- **Versioning**: All endpoints are versioned under `/api/v1/`.

## Tech Stack

- **Backend Framework**: [Hono](https://github.com/honojs/hono)
- **Database**: SQLite (using Bun's built-in sqlite3)
- **Authentication**: JWT (via [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken))

## Getting Started

### Prerequisites

Before you begin, ensure you have met the following requirements:

- [Bun](https://bun.sh/docs/installation)
- [pnpm](https://pnpm.io/installation)

### Installation

To set up the project, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Alsadig-ahmed/online-store-api.git
   cd online-store-api
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory and add your configuration variables.

4. **Run the server:**

   ```bash
   bun run index.ts
   ```

## Usage

After setting up, you can interact with the API using tools like Postman or cURL. Below are some example endpoints:

- **GET /api/v1/products**: Retrieve a list of products.
- **POST /api/v1/users/register**: Register a new user.
- **POST /api/v1/users/login**: Login and receive a JWT token.
- **POST /api/v1/cart**: Add an item to the cart.
- **POST /api/v1/orders**: Create an order from the items in the cart.
