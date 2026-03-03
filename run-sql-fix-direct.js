const { Client } = require('pg');
const fs = require('fs');

const config = {
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
};

async function applySql() {
    console.log('Connecting to database via direct port 5432...');
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
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
