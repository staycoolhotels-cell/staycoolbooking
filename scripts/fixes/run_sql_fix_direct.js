const { Client } = require('pg');
const fs = require('fs');

const config = {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'dlislsrlwovcxsuqdlvy',
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
};

async function applySql() {
    console.log('Connecting to database via direct port 5432...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected!');

        const sql1 = fs.readFileSync('FIX_MISSING_COLUMNS.sql', 'utf8');
        const sql2 = fs.readFileSync('UPDATE_CREATE_PROPERTY_FUNCTION.sql', 'utf8');
        console.log('Executing SQL...');

        await client.query(sql1);
        console.log('SQL1 executed successfully!');
        
        await client.query(sql2);
        console.log('SQL2 executed successfully!');

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
