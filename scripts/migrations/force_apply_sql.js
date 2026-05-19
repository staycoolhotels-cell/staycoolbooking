const { Client } = require('pg');

const config = {
    host: 'db.dlislsrlwovcxsuqdlvy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
};

async function testConnection() {
    const client = new Client(config);
    try {
        console.log('Testing connection to port 5432...');
        await client.connect();
        console.log('SUCCESS: Connected to port 5432!');

        const res = await client.query("SELECT version()");
        console.log('Postgres Version:', res.rows[0].version);

        // Try to apply the fix
        console.log('Applying missing columns...');
        await client.query(`
            ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1;
            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'single';
            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_rooms_booked INTEGER DEFAULT 1;
            GRANT ALL ON TABLE public.rooms TO anon, authenticated, service_role;
            GRANT ALL ON TABLE public.booking_rooms TO anon, authenticated, service_role;
            GRANT EXECUTE ON FUNCTION public.check_availability(DATE, DATE, UUID) TO anon, authenticated, service_role;
            GRANT EXECUTE ON FUNCTION public.create_bulk_booking(TEXT, DATE, DATE, UUID, UUID, INTEGER, NUMERIC) TO authenticated, service_role;
            NOTIFY pgrst, 'reload schema';
        `);
        console.log('SUCCESS: Schema updated!');

    } catch (err) {
        console.error('ERROR on port 5432:', err.message);

        console.log('Testing connection to port 6543 (Pooler)...');
        const clientPooler = new Client({ ...config, port: 6543 });
        try {
            await clientPooler.connect();
            console.log('SUCCESS: Connected to port 6543!');
            await clientPooler.query(`
                ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1;
                ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'single';
                ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_rooms_booked INTEGER DEFAULT 1;
                GRANT ALL ON TABLE public.rooms TO anon, authenticated, service_role;
                GRANT ALL ON TABLE public.booking_rooms TO anon, authenticated, service_role;
                GRANT EXECUTE ON FUNCTION public.check_availability(DATE, DATE, UUID) TO anon, authenticated, service_role;
                GRANT EXECUTE ON FUNCTION public.create_bulk_booking(TEXT, DATE, DATE, UUID, UUID, INTEGER, NUMERIC) TO authenticated, service_role;
                NOTIFY pgrst, 'reload schema';
            `);
            console.log('SUCCESS: Schema updated via Pooler!');
        } catch (poolerErr) {
            console.error('ERROR on port 6543:', poolerErr.message);
        } finally {
            await clientPooler.end();
        }
    } finally {
        await client.end();
    }
}

testConnection();
