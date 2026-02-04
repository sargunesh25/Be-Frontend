const db = require('../config/db');

exports.getFAQs = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM faqs ORDER BY sort_order ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
