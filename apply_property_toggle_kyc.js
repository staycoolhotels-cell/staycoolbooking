const { Client } = require('pg');
const fs = require('fs');

async function applySql() {
    console.log('Connecting to database...');
    const client = new Client({
        host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
        port: 6543,
        database: 'postgres',
        user: 'postgres',
        password: '2bFZKr8g15GBpfng',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        console.log('Connected!');

        const sql = fs.readFileSync('FIX_PROPERTY_TOGGLE_KYC.sql', 'utf8');
        console.log('Executing SQL...');

        await client.query(sql);
        console.log('SQL executed successfully! KYC-property-status constraints applied.');

        // Notify PostgREST to reload schema
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified schema reload.');

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
