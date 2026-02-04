const { Client } = require('pg');
require('dotenv').config();

async function checkStock() {
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
        console.log('Connected to database... Fetching Stock Status:');
        console.log('------------------------------------------------');

        const res = await client.query('SELECT id, title, price, is_available, stock_quantity, description, created_at FROM products ORDER BY id');
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('Error fetching stock:', err);
    } finally {
        await client.end();
    }
}

checkStock();
