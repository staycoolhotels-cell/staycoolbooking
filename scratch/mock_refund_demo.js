const { createClient } = require('@supabase/supabase-js');
const { differenceInDays, startOfDay, parseISO } = require('date-fns');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Refund logic imported from src/lib/refund-policy.ts (simplified)
function getRefundPercentage(checkIn, now, createdAt, hasFreeCancellation) {
  const checkInDate = startOfDay(parseISO(checkIn));
  const today = startOfDay(now);
  const createdDate = parseISO(createdAt);
  
  // 1. Within 6 hours of booking -> 100%
  const hoursSinceBooking = (now - createdDate) / (1000 * 60 * 60);
  if (hoursSinceBooking <= 6) return 100;

  // 2. Same day booking & cancellation -> 100%
  if (startOfDay(createdDate).getTime() === today.getTime()) return 100;

  // 3. Free Cancellation
  if (hasFreeCancellation) return 100;

  // 4. Standard Policy
  const daysUntil = differenceInDays(checkInDate, today);
  if (daysUntil > 10) return 100;
  if (daysUntil >= 5) return 70;
  if (daysUntil >= 2) return 50;
  return 30;
}

async function runMockRefund(bookingId) {
  console.log(`--- STARTING MOCK REFUND FOR BOOKING: ${bookingId} ---`);

  // 1. Mock "Payment Success"
  console.log('Step 1: Mocking payment confirmation...');
  await supabase.from('bookings').update({ 
    status: 'confirmed',
    razorpay_payment_id: 'pay_MOCK_' + Math.random().toString(36).substring(7)
  }).eq('id', bookingId);
  console.log('Payment confirmed in database.');

  // 2. Fetch Booking for Cancellation
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  
  // 3. Calculate Refund
  console.log('Step 2: Calculating refund based on policy...');
  const now = new Date(); // Current time
  const percent = getRefundPercentage(
    booking.check_in,
    now,
    booking.created_at,
    booking.has_free_cancellation
  );

  const totalPrice = Number(booking.total_price);
  const platformFee = totalPrice * 0.10;
  const refundableBase = totalPrice - platformFee;
  const refundAmount = (refundableBase * percent) / 100;

  console.log(`Total Price: ₹${totalPrice}`);
  console.log(`Platform Fee (10%): ₹${platformFee.toFixed(2)}`);
  console.log(`Refundable Base: ₹${refundableBase.toFixed(2)}`);
  console.log(`Refund Percentage: ${percent}%`);
  console.log(`Final Refund Amount to Guest: ₹${refundAmount.toFixed(2)}`);

  // 4. Update Database
  console.log('Step 3: Updating database status to CANCELLED...');
  await supabase.from('bookings').update({ 
    status: 'cancelled'
  }).eq('id', bookingId);
  
  // Create a record in payment_transfers or similar if needed
  await supabase.from('payment_transfers').upsert({
    booking_id: bookingId,
    total_amount: totalPrice,
    platform_commission: platformFee + (refundableBase - refundAmount),
    host_amount: 0,
    transfer_status: 'reversed'
  });

  console.log('--- MOCK REFUND COMPLETED SUCCESSFULLY ---');
  console.log(`Guest will receive: ₹${refundAmount.toFixed(2)}`);
  console.log(`Admin keeps: ₹${(totalPrice - refundAmount).toFixed(2)}`);
}

const TEST_ID = 'e0e38201-29e4-4089-8e87-100ee0434a1f';
runMockRefund(TEST_ID);
