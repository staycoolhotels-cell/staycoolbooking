const { Client } = require('pg');
const fs = require('fs');

const config = {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'dlislsrlwovcxsuqdlvy',
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false },
    statement_timeout: 10000
};

async function applySql() {
    console.log('Connecting to database via pooler...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected!');

        const sql = fs.readFileSync('CREATE_ROOMS_FEATURE.sql', 'utf8');
        console.log('Executing SQL (this might take a moment if it is a large file)...');

        await client.query(sql);
        console.log('SQL executed successfully!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified PostgREST.');

    } catch (err) {
        console.error('Error MESSAGE:', err.message);
        console.error('Error HINT:', err.hint);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
