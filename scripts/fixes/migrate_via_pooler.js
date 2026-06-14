const { Client } = require('pg');

const config = {
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.dlislsrlwovcxsuqdlvy',
  password: '2bFZKr8g15GBpfng',
  ssl: { rejectUnauthorized: false }
};

async function run() {
    console.log('Connecting to Supabase pooler on port 6543...');
    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected!');

        console.log('Adding columns...');
        await client.query(`
            ALTER TABLE public.properties 
            ADD COLUMN IF NOT EXISTS room_type_prices JSONB DEFAULT '{}'::JSONB;

            ALTER TABLE public.properties 
            ADD COLUMN IF NOT EXISTS room_type_weekend_prices JSONB DEFAULT '{}'::JSONB;

            ALTER TABLE public.properties 
            ADD COLUMN IF NOT EXISTS room_type_counts JSONB DEFAULT '{}'::JSONB;
        `);
        console.log('Columns added successfully!');
        
        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('PostgREST schema reload notified.');

    } catch (err) {
        console.error('Error executing query:', err.message);
    } finally {
        await client.end();
        console.log('Connection closed.');
    }
}

run();
