# Online Store RESTful API

This repository contains a RESTful API for an online store built with bun, Hono, and SQLite. It provides endpoints for product management, user registration/login, shopping cart management, and order processing.

## Features

- **Product Management**: CRUD operations with pagination, filtering, and sorting.
- **User Management**: Registration, login (JWT-based), and profile updates.
- **Shopping Cart**: Add, update, and remove items.
- **Order Processing**: Create orders from the cart with stock validation and basic price calculations.
- **Versioning**: All endpoints are versioned under `/api/v1/`.

## Tech Stack

- **Backend Framework:** [Hono](https://github.com/honojs/hono)
- **Database:** SQLite (using bun built-in sqlite3)
- **Authentication:** JWT (via [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken))

## Getting Started

### Prerequisites

- [bunjs](https://bun.sh/docs/installation) 
- pnpm

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Alsadig-ahmed/online-store-api.git
   cd online-store-api
   ```
