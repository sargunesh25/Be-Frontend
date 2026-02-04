const { Client } = require('pg');
require('dotenv').config();

async function updateSchema() {
    const config = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME || 'wild_breeze'
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to database...');

        // 1. Add is_available column if not exists
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
        `);
        console.log('Column is_available ensured.');

        // 2. Add is_sale column if not exists
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT FALSE;
        `);
        console.log('Column is_sale ensured.');

        // 3. Update 'Sardine Crew' to be out of stock for testing
        // Using ILIKE to be case-insensitive just in case
        await client.query(`
            UPDATE products 
            SET is_available = FALSE 
            WHERE title ILIKE '%Sardine%';
        `);
        console.log('Updated Sardine Crew to be Out of Stock.');

        // 4. Verify data
        const res = await client.query('SELECT title, is_available FROM products');
        console.log('Current Product Status:', res.rows);

    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await client.end();
    }
}

updateSchema();
