const db = require('../config/db');

exports.getCart = async (req, res) => {
    const userId = req.user.id; // From auth middleware

    try {
        const result = await db.query(
            `SELECT c.id, c.quantity, p.id as product_id, p.title, p.price, p.image_url 
             FROM cart_items c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = $1`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addToCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    try {
        // Check if item exists in cart
        const check = await db.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (check.rows.length > 0) {
            // Update quantity
            const updated = await db.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
                [quantity, userId, productId]
            );
            return res.json(updated.rows[0]);
        } else {
            // Insert new item
            const newItem = await db.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
                [userId, productId, quantity]
            );
            return res.status(201).json(newItem.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.removeFromCart = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    try {
        await db.query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );
        res.json({ message: 'Item removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.mergeCart = async (req, res) => {
    const userId = req.user.id;
    const { guestCart } = req.body; // Array of { product_id, quantity }

    if (!Array.isArray(guestCart) || guestCart.length === 0) {
        return res.status(200).json({ message: 'No items to merge' });
    }

    try {
        await db.query('BEGIN');

        for (const item of guestCart) {
            // Check if item exists in user cart
            const check = await db.query(
                'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
                [userId, item.product_id]
            );

            if (check.rows.length > 0) {
                // Update quantity
                await db.query(
                    'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
                    [item.quantity, userId, item.product_id]
                );
            } else {
                // Insert new item
                await db.query(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                    [userId, item.product_id, item.quantity]
                );
            }
        }

        await db.query('COMMIT');

        // Return updated cart
        const result = await db.query(
            `SELECT c.id, c.quantity, p.id as product_id, p.title, p.price, p.image_url 
             FROM cart_items c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = $1`,
            [userId]
        );
        res.json(result.rows);

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error during merge' });
    }
};
