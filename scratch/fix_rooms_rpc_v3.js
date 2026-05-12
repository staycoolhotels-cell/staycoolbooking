const { Client } = require('pg');

const connectionString = 'postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres';

async function fixFunction() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    console.log('Applying fix to get_rooms_realtime_status...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.get_rooms_realtime_status(p_property_id UUID)
      RETURNS TABLE (
          id UUID,
          name TEXT,
          status TEXT,
          current_guest TEXT,
          booking_id UUID
      ) 
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      #variable_conflict use_column
      DECLARE
          v_check_out_time_str TEXT;
          v_check_out_time TIME;
          v_current_time TIME;
          v_current_date DATE;
      BEGIN
          SELECT check_out_time INTO v_check_out_time_str FROM public.properties WHERE properties.id = p_property_id;
          
          BEGIN
              IF v_check_out_time_str IS NOT NULL THEN
                  v_check_out_time := CAST(v_check_out_time_str AS TIME);
              ELSE
                  v_check_out_time := TIME '11:00:00';
              END IF;
          EXCEPTION WHEN OTHERS THEN
              v_check_out_time := TIME '11:00:00';
          END;

          v_current_time := CURRENT_TIME;
          v_current_date := CURRENT_DATE;

          RETURN QUERY
          SELECT 
              r.id,
              r.name,
              CASE 
                  WHEN r.status = 'maintenance' THEN 'maintenance'
                  WHEN EXISTS (
                      SELECT 1 FROM public.booking_rooms br
                      JOIN public.bookings b ON b.id = br.booking_id
                      WHERE br.room_id = r.id
                      AND b.status IN ('confirmed', 'pending_payment')
                      AND (
                          (b.check_in <= v_current_date AND b.check_out > v_current_date)
                          OR
                          (b.check_out = v_current_date AND v_current_time < v_check_out_time)
                      )
                  ) THEN 'booked'
                  ELSE 'available'
              END as status,
              (
                  SELECT u.name FROM public.bookings b
                  JOIN public.booking_rooms br ON br.booking_id = b.id
                  JOIN public.users u ON u.id = b.guest_id
                  WHERE br.room_id = r.id
                  AND b.status IN ('confirmed', 'pending_payment')
                  AND (
                      (b.check_in <= v_current_date AND b.check_out > v_current_date)
                      OR
                      (b.check_out = v_current_date AND v_current_time < v_check_out_time)
                  )
                  LIMIT 1
              ) as current_guest,
              (
                  SELECT b.id FROM public.bookings b
                  JOIN public.booking_rooms br ON br.booking_id = b.id
                  WHERE br.room_id = r.id
                  AND b.status IN ('confirmed', 'pending_payment')
                  AND (
                      (b.check_in <= v_current_date AND b.check_out > v_current_date)
                      OR
                      (b.check_out = v_current_date AND v_current_time < v_check_out_time)
                  )
                  LIMIT 1
              ) as booking_id
          FROM public.rooms r
          WHERE r.property_id = p_property_id;
      END;
      $$;
    `);

    console.log('Fixes applied successfully.');
  } catch (err) {
    console.error('Error applying fixes:', err);
  } finally {
    await client.end();
  }
}

fixFunction();
