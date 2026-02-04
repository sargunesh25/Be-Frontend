const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, hash]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.subscribe = async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        exports.subscribe = async (req, res) => {
            const { phoneNumber } = req.body;

            if (!phoneNumber) {
                return res.status(400).json({ error: 'Phone number is required' });
            }

            try {
                // Check if phone already registered for discount
                const check = await db.query('SELECT * FROM discount_signups WHERE phone_number = $1', [phoneNumber]);

                if (check.rows.length === 0) {
                    // Store new signup
                    await db.query(
                        'INSERT INTO discount_signups (phone_number) VALUES ($1)',
                        [phoneNumber]
                    );
                }

                // Return success WITHOUT token (User remains guest)
                return res.status(200).json({
                    message: 'Discount activated!',
                    discountActive: true
                });

            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Server error' });
            }
        };
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
