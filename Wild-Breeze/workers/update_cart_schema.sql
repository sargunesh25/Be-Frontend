-- Migration to add details to cart_items
ALTER TABLE cart_items ADD COLUMN title TEXT;
ALTER TABLE cart_items ADD COLUMN price REAL;
ALTER TABLE cart_items ADD COLUMN image_url TEXT;
ALTER TABLE cart_items ADD COLUMN selected_size TEXT;
ALTER TABLE cart_items ADD COLUMN selected_color TEXT;
