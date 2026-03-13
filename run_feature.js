const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 5432,
    database: 'dlislsrlwovcxsuqdlvy',
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function applySql() {
    let client;
    try {
        console.log('Connecting to database via pooler...');
        client = await pool.connect();
        console.log('Connected!');

        const sql = fs.readFileSync('CREATE_ROOMS_FEATURE.sql', 'utf8');
        console.log('Executing SQL (this might take a moment if it is a large file)...');

        await client.query(sql);
        console.log('SQL executed successfully!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified PostgREST.');

    } catch (err) {
        console.error('Failed:', err.message);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
        console.log('Disconnected.');
    }
}

applySql();
