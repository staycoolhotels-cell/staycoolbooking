const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, razorpay_payment_id, total_price, check_in')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent Bookings:');
  console.table(data);
  
  const paidBookings = data.filter(b => b.razorpay_payment_id);
  console.log('\nBookings with Payment ID:', paidBookings.length);
  if (paidBookings.length > 0) {
    console.table(paidBookings);
  }
}

check();
