const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const { sort, category, availability, min_price, max_price } = req.query;
        console.log('Product Filter Params:', { sort, category, availability, min_price, max_price });

        let queryText = 'SELECT * FROM products WHERE 1=1';
        const queryParams = [];

        if (category) {
            queryParams.push(category);
            queryText += ` AND category = $${queryParams.length}`;
        }

        if (availability === 'in_stock') {
            queryParams.push(true);
            queryText += ` AND is_available = $${queryParams.length}`;
        } else if (availability === 'out_of_stock') {
            queryParams.push(false);
            queryText += ` AND is_available = $${queryParams.length}`;
        }

        if (min_price) {
            queryParams.push(min_price);
            queryText += ` AND price >= $${queryParams.length}`;
        }

        if (max_price) {
            queryParams.push(max_price);
            queryText += ` AND price <= $${queryParams.length}`;
        }

        if (sort === 'price_asc') {
            queryText += ' ORDER BY price ASC';
        } else if (sort === 'price_desc') {
            queryText += ' ORDER BY price DESC';
        } else if (sort === 'alphabetical_az') {
            queryText += ' ORDER BY title ASC';
        } else if (sort === 'alphabetical_za') {
            queryText += ' ORDER BY title DESC';
        } else if (sort === 'date_old_new') {
            queryText += ' ORDER BY created_at ASC';
        } else {
            queryText += ' ORDER BY created_at DESC'; // Default: Newest first
        }

        console.log('Final Query:', queryText, queryParams);
        const result = await db.query(queryText, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
