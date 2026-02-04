-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url TEXT,
    is_sale BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hero Slides Table
DROP TABLE IF EXISTS hero_slides;
CREATE TABLE hero_slides (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    promo_text VARCHAR(255),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Seed Data (Optional - useful for testing)
INSERT INTO products (title, price, image_url, is_sale) VALUES 
('Teddy Bear Crew', 45.00, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', false),
('Sardine Crew', 35.00, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', false)
ON CONFLICT DO NOTHING;

INSERT INTO hero_slides (image_url, promo_text, title, subtitle, sort_order) VALUES
('/hero-background.png', 'All orders $100+ ship for free!', 'Looking for something cozy?', 'New arrivals are here!', 1),
('/hero-bg-2.png', 'New Arrivals: Check out our latest collection!', 'Summer Collection', 'Fresh styles for sunny days', 2)
ON CONFLICT DO NOTHING;

INSERT INTO faqs (question, answer, sort_order) VALUES
('WHEN WILL MY ORDER SHIP?', 'All orders... will ship after January 1st!', 1),
('WHAT SIZE SHOULD I ORDER?', 'All state flower apparel is unisex...', 2)
ON CONFLICT DO NOTHING;
