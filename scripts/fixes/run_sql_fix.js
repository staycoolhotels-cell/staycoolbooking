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

const sql = fs.readFileSync('SUPABASE_APPLY_ME.sql', 'utf8');

async function applyAll() {
    let client;
    try {
        console.log('Connecting to database directly...');
        client = await pool.connect();
        console.log('Connected! Applying all missing schemas...');
        await client.query(sql);
        console.log('SUCCESS: All schemas and migrations applied.');
    } catch (err) {
        console.error('Failed:', err.message);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

applyAll();
