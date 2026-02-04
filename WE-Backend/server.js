const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./config/db'); // Initialize DB connection

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const heroRoutes = require('./routes/heroRoutes');
const faqRoutes = require('./routes/faqRoutes');
const contactRoutes = require('./routes/contactRoutes');
const cartRoutes = require('./routes/cartRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/hero-slides', heroRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/cart', cartRoutes);

app.get('/', (req, res) => {
    res.send('Wild Breeze API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Force DB connection to test
    const db = require('./config/db');
    db.pool.connect().then(client => {
        console.log('Database connected successfully');
        client.release();
    }).catch(err => {
        console.error('Database connection failed:', err);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
