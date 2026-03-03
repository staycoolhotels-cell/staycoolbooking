const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const config = {
    host: "aws-0-ap-south-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    user: "postgres.dlislsrlwovcxsuqdlvy",
    password: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false }
};

async function applySql() {
    console.log('Connecting to database...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected!');

        const sql = fs.readFileSync('SUPABASE_APPLY_ME.sql', 'utf8');
        console.log('Executing SQL (this might take a moment if it is a large file)...');

        await client.query(sql);
        console.log('SQL executed successfully!');

        // Notify PostgREST to reload schema
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified schema reload.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
