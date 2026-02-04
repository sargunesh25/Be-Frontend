const { Client } = require('pg');
require('dotenv').config();

async function addStockColumn() {
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

        // 1. Add stock_quantity column
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 10;
        `);
        console.log('Column stock_quantity ensured (Default 10).');

        // 2. Add description column (extra as suggested)
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS description TEXT;
        `);
        console.log('Column description ensured.');

        // 3. Update 'Sardine Crew' to have 0 stock (since we marked it unavailable)
        await client.query(`
            UPDATE products 
            SET stock_quantity = 0 
            WHERE is_available = FALSE;
        `);
        console.log('Updated Out of Stock items to have 0 quantity.');

        // 4. Verify data
        const res = await client.query('SELECT id, title, price, is_available, stock_quantity, created_at FROM products ORDER BY id');
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await client.end();
    }
}

addStockColumn();
