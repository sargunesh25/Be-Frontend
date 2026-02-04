const db = require('./config/db');

const alterUsersTable = async () => {
    try {
        console.log('Altering users table...');

        // Add phone_number column
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number') THEN
                    ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
                END IF;
            END
            $$;
        `);
        console.log('Added phone_number column.');

        // Add constraint to ensure at least one of email or phone_number is present
        // First convert email to nullable
        await db.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL;');
        console.log('Made email column nullable.');

        // Add check constraint (optional but good practice, keeping it simple for now as requested)

        console.log('Users table updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error altering users table:', err);
        process.exit(1);
    }
};

alterUsersTable();
