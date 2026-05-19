const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.argv[2] || '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync('REFERRAL_SYSTEM_SETUP.sql', 'utf8');

async function applyMigration() {
    let client;
    try {
        console.log('Connecting to database...');
        client = await pool.connect();
        console.log('Connected! Applying referral system migration...');
        await client.query(sql);
        console.log('SUCCESS: Referral system database setup complete.');
    } catch (err) {
        console.error('Migration Failed:', err.message);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

applyMigration();
