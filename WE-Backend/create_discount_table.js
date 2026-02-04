const db = require('./config/db');

const createDiscountTable = async () => {
    try {
        console.log('Creating discount_signups table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS discount_signups (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Created discount_signups table.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
};

createDiscountTable();
