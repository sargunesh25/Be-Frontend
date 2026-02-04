const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    const dbName = process.env.DB_NAME || 'wild_breeze';
    const config = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };

    // Connect to default 'postgres' database to check/create target DB
    const client = new Client({ ...config, database: 'postgres' });

    try {
        await client.connect();
        console.log('Connected to postgres database to check for existence...');

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
        if (res.rowCount === 0) {
            console.log(`Database ${dbName} does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created successfully.`);
        } else {
            console.log(`Database ${dbName} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }

    // Now connect to the new database and run migrations
    console.log(`Connecting to ${dbName} to apply migrations...`);
    const dbClient = new Client({ ...config, database: dbName });

    try {
        await dbClient.connect();
        const migrationPath = path.join(__dirname, 'migration.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await dbClient.query(migrationSql);
        console.log('Migration applied successfully.');

    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();
