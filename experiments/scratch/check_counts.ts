
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDetails() {
  try {
    const { data: bookings, error } = await supabase.from('bookings').select('status');
    if (error) throw error;

    const statuses = bookings.reduce((acc: any, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Booking Statuses:', statuses);

    const { data: properties, error: pe } = await supabase.from('properties').select('status');
    const pStatuses = properties?.reduce((acc: any, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    console.log('Property Statuses:', pStatuses);

  } catch (err: any) {
    console.error('Fatal:', err.message);
  }
}

checkDetails();
