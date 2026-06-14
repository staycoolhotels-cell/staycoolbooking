const { Client } = require('pg');

const config = {
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
};

async function run() {
    console.log('Connecting to database directly via IPv6 host...');
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Connected!');

        console.log('Adding standard_price column...');
        await client.query(`
            ALTER TABLE public.properties 
            ADD COLUMN IF NOT EXISTS standard_price INTEGER;

            UPDATE public.properties 
            SET standard_price = price_per_night 
            WHERE standard_price IS NULL;
        `);
        console.log('Successfully added standard_price column!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('PostgREST schema reload notified.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await client.end();
        console.log('Connection closed.');
    }
}

run();
