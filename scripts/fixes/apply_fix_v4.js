const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'dlislsrlwovcxsuqdlvy', // Using REF as DB name
    user: 'postgres.dlislsrlwovcxsuqdlvy',
    password: '2bFZKr8g15GBpfng',
    ssl: { rejectUnauthorized: false }
});

async function applyFix() {
    let client;
    try {
        console.log('Connecting to Supabase Pooler (DB: dlislsrlwovcxsuqdlvy)...');
        client = await pool.connect();
        console.log('Connected!');

        const sql = `
            ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 1;
            
            -- Update RPC with dynamic room count
            CREATE OR REPLACE FUNCTION public.check_availability(
                p_check_in DATE,
                p_check_out DATE,
                p_property_id UUID
            )
            RETURNS INTEGER
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public
            AS $$
            DECLARE
                v_total_rooms INTEGER;
                v_booked_rooms INTEGER;
            BEGIN
                -- Get total rooms from the rooms table if possible, fallback to column
                SELECT COUNT(*) INTO v_total_rooms
                FROM public.rooms
                WHERE property_id = p_property_id;

                IF v_total_rooms = 0 THEN
                    SELECT total_rooms INTO v_total_rooms
                    FROM public.properties
                    WHERE id = p_property_id;
                END IF;

                -- Count rooms that are already booked
                SELECT COUNT(DISTINCT br.room_id) INTO v_booked_rooms
                FROM public.booking_rooms br
                JOIN public.bookings b ON b.id = br.booking_id
                WHERE 
                    b.property_id = p_property_id
                    AND b.status IN ('confirmed', 'pending_payment')
                    AND (
                        (p_check_in BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                        (p_check_out - INTERVAL '1 day' BETWEEN b.check_in AND b.check_out - INTERVAL '1 day') OR
                        (b.check_in BETWEEN p_check_in AND p_check_out - INTERVAL '1 day')
                    );

                -- Return available rooms
                RETURN COALESCE(v_total_rooms, 1) - COALESCE(v_booked_rooms, 0);
            END;
            $$;

            GRANT EXECUTE ON FUNCTION public.check_availability(DATE, DATE, UUID) TO anon, authenticated, service_role;
            NOTIFY pgrst, 'reload schema';
        `;

        await client.query(sql);
        console.log('SUCCESS: SQL applied!');

    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

applyFix();
