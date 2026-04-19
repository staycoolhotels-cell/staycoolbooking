const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAdminFetch() {
  console.log(`Logging in as ${process.env.ADMIN_EMAIL}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  console.log('Login successful. Fetching bookings...');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, total_price, status');

  if (bookingsError) {
    console.error('Bookings fetch error:', bookingsError.message);
  } else {
    console.log(`Successfully fetched ${bookings.length} bookings as admin.`);
    const total = bookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    console.log('Total Price sum:', total);
  }
}

testAdminFetch();
