const { Client } = require('pg');
const fs = require('fs');

const config = {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.dlislsrlwovcxsuqdlvy', // Pooling usually needs this format
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
};

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
