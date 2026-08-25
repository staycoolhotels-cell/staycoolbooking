import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminPageHeader from '../components/AdminPageHeader';
import { createAdminSupabaseClient } from '@/lib/admin-actions';
import AdminBookingHistory from './components/AdminBookingHistory';

export const metadata = {
  title: 'Booking History - Admin Panel',
  description: 'View and filter complete platform booking history with day, week, month, and year filters.',
};

const BookingHistoryPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Role-based check: only admins can access
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/auth');
  }

  // Use admin client to fetch all bookings with details bypassing RLS
  const supabaseAdmin = await createAdminSupabaseClient();

  const { data: rawBookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      guest:users!guest_id ( name, email, avatar_url ),
      property:properties!property_id ( 
        title,
        room_type_prices,
        host:users!host_id ( name, email )
      ),
      booking_rooms(rooms(room_type))
    `)
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('Error fetching bookings for admin booking history:', JSON.stringify(bookingsError, null, 2));
  }

  return (
    <div className="space-y-0">
      <AdminPageHeader
        title="Booking History"
        subtitle="Comprehensive platform booking analytics with day, week, month, and year filtering"
      />
      <AdminBookingHistory initialBookings={rawBookings || []} />
    </div>
  );
};

export default BookingHistoryPage;
