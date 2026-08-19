import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Removes an unfinished checkout so it never appears as a host booking or blocks availability.
export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'payment_failed' })
      .eq('id', bookingId)
      .eq('guest_id', user.id)
      .eq('status', 'pending_payment');

    if (error) {
      console.error('Failed to cancel unfinished booking:', error);
      return NextResponse.json({ error: 'Could not cancel unfinished booking.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invalid unfinished-booking cancellation request:', error);
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
