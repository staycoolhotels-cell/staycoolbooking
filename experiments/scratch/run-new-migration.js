const { Client } = require('pg');

async function apply() {
    const uri = 'postgresql://postgres:DefaultPassword123!@db.dlislsrlwovcxsuqdlvy.supabase.co:6543/postgres';
    const client = new Client({ 
        connectionString: uri,
        ssl: { rejectUnauthorized: false }
    });
    try {
        console.log('Connecting with URI...');
        await client.connect();
        console.log('Connected. Running ALTER TABLE queries...');
        
        await client.query(`
            ALTER TABLE public.payment_transfers 
            ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id);

            ALTER TABLE public.payment_transfers 
            ADD COLUMN IF NOT EXISTS referrer_amount NUMERIC(12, 2) DEFAULT 0;

            NOTIFY pgrst, 'reload schema';
        `);
        console.log('ALTER TABLE queries executed successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
apply();
