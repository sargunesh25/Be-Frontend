const db = require('../config/db');

exports.getHeroSlides = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM hero_slides WHERE is_active = TRUE ORDER BY sort_order ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
