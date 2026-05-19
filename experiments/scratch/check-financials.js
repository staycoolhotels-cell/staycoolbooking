const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFinancials() {
  console.log('Checking bookings...');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, total_price, status');

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
  } else {
    console.log(`Found ${bookings.length} bookings.`);
    console.log('Bookings Sample:', bookings.slice(0, 5));
    const totalConfirmed = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);
    console.log('Calculated Total Revenue from Bookings:', totalConfirmed);
  }

  console.log('\nChecking transactions table...');
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('count', { count: 'exact', head: true });

  if (txError) {
    console.error('Error fetching transactions count (might not exist):', txError.message);
  } else {
    console.log(`Found ${transactions?.length || 0} tracks in transactions table.`);
  }
}

checkFinancials();
