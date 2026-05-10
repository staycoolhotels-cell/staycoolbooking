const { Client } = require('pg');
const fs = require('fs');

const dbUrl = `postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres`;
const config = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
}

async function applySql() {
    console.log('Connecting to database...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected!');

        const sql = fs.readFileSync('ADD_SUBSCRIPTION_COLUMNS.sql', 'utf8');
        console.log('Executing SQL...');

        await client.query(sql);
        console.log('SQL executed successfully!');
        
        // Notify PostgREST to reload schema
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified schema reload.');

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
