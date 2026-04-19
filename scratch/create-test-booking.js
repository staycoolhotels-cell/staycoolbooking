const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for insertion
);

async function createTestBooking() {
  console.log('Fetching a property and a guest...');
  const { data: properties } = await supabase.from('properties').select('id').limit(1);
  const { data: users } = await supabase.from('users').select('id').eq('role', 'guest').limit(1);

  if (!properties?.length || !users?.length) {
    console.error('No properties or guests found to create a test booking.');
    return;
  }

  const propertyId = properties[0].id;
  const guestId = users[0].id;

  console.log(`Creating test booking for property ${propertyId} and guest ${guestId}...`);
  const { data: booking, error } = await supabase.from('bookings').insert({
    property_id: propertyId,
    guest_id: guestId,
    check_in: new Date().toISOString(),
    check_out: new Date(Date.now() + 86400000).toISOString(),
    total_price: 5000,
    status: 'confirmed',
    guests: 2,
    booking_type: 'single'
  }).select().single();

  if (error) {
    console.error('Error creating test booking:', error);
  } else {
    console.log('Test booking created successfully:', booking.id);
    console.log('Total Price: ₹5000');
    console.log('Status: confirmed (should map to completed)');
  }
}

createTestBooking();
