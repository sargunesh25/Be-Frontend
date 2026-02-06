-- Seed data for Wild-Breeze D1 Database

-- Hero Slides
INSERT OR REPLACE INTO hero_slides (id, image_url, banner_text, sort_order, is_active) VALUES 
('slide1', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920', 'SHOP THE LATEST COLLECTION', 1, 1),
('slide2', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920', 'FREE SHIPPING ON ORDERS OVER $50', 2, 1);

-- FAQs
INSERT OR REPLACE INTO faqs (id, question, answer, sort_order) VALUES 
('faq1', 'What payment methods do you accept?', 'We accept all major credit cards, PayPal, and Apple Pay.', 1),
('faq2', 'How long does shipping take?', 'Standard shipping takes 5-7 business days. Express shipping is 2-3 business days.', 2),
('faq3', 'What is your return policy?', 'We offer 30-day returns on all unworn items with original tags attached.', 3),
('faq4', 'Do you ship internationally?', 'Yes, we ship to over 50 countries worldwide. Shipping costs vary by location.', 4);
