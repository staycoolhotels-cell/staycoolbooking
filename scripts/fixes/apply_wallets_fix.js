const { Client } = require('pg');
const fs = require('fs');


const dbUrl = `postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres`;
const config = {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
}

async function applySql() {
    console.log('Connecting to Supabase...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected! Applying FIX_USER_WALLETS.sql...');

        const sql = fs.readFileSync('FIX_USER_WALLETS.sql', 'utf8');

        await client.query(sql);
        console.log('SQL executed successfully!');


        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Notified schema reload.');

    } catch (err) {
        console.error('Error applying SQL:', err.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

applySql();
