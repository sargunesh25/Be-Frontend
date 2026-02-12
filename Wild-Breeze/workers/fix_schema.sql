-- Drop existing tables and recreate with proper schema
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS discount_signups;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS hero_slides;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Users table (replaces Firebase Auth + users collection)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    category TEXT,
    is_available INTEGER DEFAULT 1,
    is_sale INTEGER DEFAULT 0,
    original_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hero slides table
CREATE TABLE hero_slides (
    id TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    banner_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

-- FAQs table
CREATE TABLE faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Contact messages table
CREATE TABLE contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table with all required columns
-- Cart items table with all required columns
CREATE TABLE cart_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Discount signups table
CREATE TABLE discount_signups (
    id TEXT PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_hero_slides_active ON hero_slides(is_active);
