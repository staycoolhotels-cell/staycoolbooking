import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfill() {
  console.log('Starting transaction backfill...');

  // 1. Fetch all confirmed bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, property:properties(*)');

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
    return;
  }

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  console.log(`Found ${confirmedBookings.length} confirmed bookings.`);

  for (const booking of confirmedBookings) {
    // 2. Check if transaction already exists
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();

    if (existingTransaction) {
      console.log(`Transaction already exists for booking ${booking.id}. Skipping.`);
      continue;
    }

    // 3. Get financial details from payment_transfers if available
    const { data: transfer } = await supabase
      .from('payment_transfers')
      .select('*')
      .eq('booking_id', booking.id)
      .maybeSingle();

    let amount = Number(booking.total_price);
    let platformFee = amount * 0.20;
    let hostPayout = amount - platformFee;

    if (transfer) {
      platformFee = Number(transfer.platform_commission);
      hostPayout = Number(transfer.host_amount);
    }

    const hostId = booking.property?.host_id;

    // 4. Create transaction record
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        booking_id: booking.id,
        guest_id: booking.guest_id,
        host_id: hostId,
        property_id: booking.property_id,
        amount: amount,
        platform_fee: platformFee,
        host_payout: hostPayout,
        status: 'completed',
        created_at: booking.created_at
      });

    if (insertError) {
      console.error(`Failed to insert transaction for booking ${booking.id}:`, insertError);
    } else {
      console.log(`Successfully created transaction for booking ${booking.id}. Amount: ₹${amount}`);
    }
  }

  console.log('Backfill complete.');
}

backfill();
