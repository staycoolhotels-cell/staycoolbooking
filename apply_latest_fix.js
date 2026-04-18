const { Client } = require('pg');
const fs = require('fs');

const config = {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
};

const config2 = {
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 6543,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
};

async function applySql() {
    console.log('Connecting to database via port 6543 (Config 2)...');
    const client = new Client(config2);

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

    } catch (err) {
        console.error('Error with config 2:', err);
    } finally {
        await client.end();
        console.log('Disconnected config 2.');
    }
}

applySql();
