# Wild-Breeze Cloudflare Workers API

This is the backend API for Wild-Breeze, powered by Cloudflare Workers and D1 database.

## Setup

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Create D1 Database

```bash
# Navigate to workers directory
cd workers

# Create the D1 database
wrangler d1 create wild-breeze-db

# Copy the database_id from the output and update wrangler.toml
```

### Initialize Database Schema

```bash
# Initialize the database with schema
npm run db:init

# For local development
npm run db:init:local
```

### Set Environment Secrets

```bash
# Set JWT secret (use a strong random string)
wrangler secret put JWT_SECRET

# Set Printful API token (if using Printful)
wrangler secret put PRINTFUL_API_TOKEN
```

## Development

```bash
# Start local development server
npm run dev
```

The API will be available at `http://localhost:8787`.

## Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check |
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login, returns JWT |
| `/api/products` | GET | No | Get all products |
| `/api/hero-slides` | GET | No | Get hero slides |
| `/api/faqs` | GET | No | Get FAQs |
| `/api/contact` | POST | No | Submit contact form |
| `/api/cart` | GET | Yes | Get user's cart |
| `/api/cart` | POST | Yes | Add item to cart |
| `/api/cart/:productId` | DELETE | Yes | Remove item from cart |
| `/api/cart/merge` | POST | Yes | Merge guest cart |
| `/api/subscribe` | POST | No | Discount signup |
| `/api/printful/products` | GET | No | Get Printful products |

## Database Schema

See `schema.sql` for the complete database schema.
