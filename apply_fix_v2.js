const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function applyFix() {
    let client;
    try {
        console.log('Connecting to db.dlislsrlwovcxsuqdlvy.supabase.co...');
        client = await pool.connect();
        console.log('Connected!');

        const sql = fs.readFileSync(path.join(__dirname, 'fix_check_availability.sql'), 'utf8');
        console.log('Executing SQL from fix_check_availability.sql...');

        await client.query(sql);
        console.log('SUCCESS: SQL applied successfully!');

        // Notify PostgREST to reload schema
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified schema reload.');

    } catch (err) {
        console.error('Failed to apply fix:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

applyFix();
