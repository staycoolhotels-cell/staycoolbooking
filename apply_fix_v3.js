const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function applyFix() {
    let client;
    try {
        console.log('Connecting to Supabase Pooler...');
        client = await pool.connect();
        console.log('Connected!');

        console.log('Adding missing columns and tables if they dont exist...');
        const initSql = `
            ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1;
            
            CREATE TABLE IF NOT EXISTS public.rooms (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                status TEXT DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'booked')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS public.booking_rooms (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
                room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'single';
            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_rooms_booked INTEGER DEFAULT 1;
        `;
        await client.query(initSql);
        console.log('Schema updated!');

        const funcSql = fs.readFileSync(path.join(__dirname, 'fix_check_availability.sql'), 'utf8');
        console.log('Applying check_availability function...');
        await client.query(funcSql);
        console.log('Function applied!');

        await client.query("NOTIFY pgrst, 'reload schema'");
        console.log('Reloaded schema.');

    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

applyFix();
