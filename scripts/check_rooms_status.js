const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRooms() {
  const { data: properties, error: pError } = await supabase
    .from('properties')
    .select('id, title, check_out_time')
    .limit(5);

  if (pError) {
    console.error('Error fetching properties:', pError);
    return;
  }

  for (const prop of properties) {
    console.log(`\nProperty: ${prop.title} (ID: ${prop.id}), Check-out Time: ${prop.check_out_time}`);
    
    const { data: rooms, error: rError } = await supabase
      .from('rooms')
      .select('id, name, status')
      .eq('property_id', prop.id);

    if (rError) {
      console.error('Error fetching rooms:', rError);
      continue;
    }

    console.log('Rooms:');
    rooms.forEach(r => console.log(` - ${r.name}: ${r.status}`));

    const { data: bookings, error: bError } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, status')
      .eq('property_id', prop.id)
      .in('status', ['confirmed', 'pending_payment']);

    if (bError) {
      console.error('Error fetching bookings:', bError);
      continue;
    }

    console.log('Active Bookings:');
    bookings.forEach(b => console.log(` - ${b.id}: ${b.check_in} to ${b.check_out} (${b.status})`));
  }
}

checkRooms();
