const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'dlislsrlwovcxsuqdlvy', // Using REF as DB name
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync('SUPABASE_APPLY_ME.sql', 'utf8');

async function applyAll() {
    let client;
    try {
        console.log('Connecting to database via pooler...');
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
