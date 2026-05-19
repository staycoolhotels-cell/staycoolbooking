const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres', // Must be postgres for this pooler, user has the ref
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function applyFix() {
    let client;
    try {
        console.log('Connecting to Supabase Pooler...');
        client = await pool.connect();
        console.log('Connected!');

        const sql = fs.readFileSync('SUPABASE_APPLY_ME.sql', 'utf8');
        console.log('Executing SQL...');

        await client.query(sql);
        console.log('SQL executed successfully!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Reloaded schema.');

    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

applyFix();
