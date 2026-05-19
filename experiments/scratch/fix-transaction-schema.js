const { Pool } = require('pg');

const pool = new Pool({
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
    let client;
    try {
        console.log('Connecting to database directly...');
        client = await pool.connect();
        console.log('Connected! Fixing transactions table schema...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.transactions (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                booking_id uuid,
                guest_id uuid,
                host_id uuid,
                property_id uuid,
                amount numeric,
                platform_fee numeric,
                host_payout numeric,
                status text DEFAULT 'completed'::text,
                created_at timestamp with time zone DEFAULT now(),
                CONSTRAINT transactions_pkey PRIMARY KEY (id)
            );

            -- Add missing columns if table existed but was primitive
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS booking_id uuid;
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS guest_id uuid;
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS host_id uuid;
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS property_id uuid;
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount numeric;
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS platform_fee numeric;
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS host_payout numeric;
            ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';
            
            -- Reload schema cache
            NOTIFY pgrst, 'reload schema';
        `);
        
        console.log('SUCCESS: Transactions table schema fixed and cache reloaded.');

    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

fixSchema();
