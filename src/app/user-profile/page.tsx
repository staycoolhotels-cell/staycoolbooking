import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import UserProfileInteractive from './components/UserProfileInteractive';
import { calculateRefundAmount } from '@/lib/refund-policy';
import { autoProcessCheckedInBookings } from '@/lib/booking-actions';

export default async function ProfilePage() {
  // Automatically process check-in bookings asynchronously in background without blocking page render
  autoProcessCheckedInBookings().catch((err) => {
    console.error('[AutoCheckIn background error in ProfilePage]:', err);
  });

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

  // Use getUser() for better security instead of getSession()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth');
  }

  const { data: profile, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (userError || !profile) {
    console.error('Error fetching user data or user not found:', JSON.stringify(userError, null, 2));
    redirect('/signup');
  }

  // Role-based access control
  // Redirect admins to admin panel
  if (profile.role === 'admin') {
    redirect('/admin-panel');
  }

  // Redirect hosts to host dashboard
  if (profile.role === 'host') {
    redirect('/host-dashboard');
  }

  // Only guests should access this page
  if (profile.role !== 'guest') {
    redirect('/');
  }

  // Concurrently fetch all auxiliary profile data in a single parallel batch
  const [
    profilePointsRes,
    personalInfoRes,
    verificationsRes,
    reviewsRes,
    bookingsRes,
    activitiesRes
  ] = await Promise.all([
    supabase.from('profiles').select('reward_points').eq('id', user.id).maybeSingle(),
    supabase.from('user_personal_info').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('verifications').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('reviews').select('*, reviewer:users!reviewer_id(name)').eq('receiver_id', user.id),
    supabase
      .from('bookings')
      .select('*, properties!inner(*, host:users!host_id(name, avatar:avatar_url)), booking_rooms(rooms(room_type))')
      .eq('guest_id', user.id)
      .not('status', 'in', '("pending","pending_payment","payment_failed")') // Hide uncompleted checkout bookings from guest panel
      .order('created_at', { ascending: false }),
    supabase.from('activities').select('*').eq('type', 'booking_amenities').eq('user_id', user.id),
  ]);

  const userData = {
    ...profile,
    email: user.email,
    name: user.user_metadata.name || profile.name,
    avatar_url: user.user_metadata.avatar_url || profile.avatar_url,
    reward_points: profilePointsRes.data?.reward_points ?? 0,
  };

  const personalInfo = personalInfoRes.data;
  const verifications = verificationsRes.data;
  const rawReviews = reviewsRes.data;
  const rawBookings = bookingsRes.data;
  const bookingActivities = activitiesRes.data;

  const reviews = rawReviews?.map((rev: any) => ({
    ...rev,
    guestName: rev.reviewer?.name || 'Host',
  })) || [];

  // Only show bookings that are confirmed, active, completed, cancelled, or refunded
  // Never show unpaid/pending-payment or failed checkout bookings to the guest
  const bookings = (rawBookings || [])
    .filter((b: any) => b.status !== 'pending' && b.status !== 'pending_payment' && b.status !== 'payment_failed')
    .map((b: any) => {
    const activity = (bookingActivities || []).find((a: any) => {
      try {
        const payload = JSON.parse(a.description);
        return payload.bookingId === b.id;
      } catch {
        return false;
      }
    });

    let selectedAmenities = [];
    if (activity) {
      try {
        selectedAmenities = JSON.parse(activity.description).amenities || [];
      } catch (err) {
        // Ignore JSON parse errors for robust parsing
      }
    }

    const roomTypePrices = b.properties?.room_type_prices || {};
    const roomTypeCounts = (b.booking_rooms || []).reduce((acc: Record<string, number>, br: any) => {
      const type = br.rooms?.room_type || br.room?.room_type;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});
    const roomType = Object.keys(roomTypeCounts).length > 0 
      ? Object.entries(roomTypeCounts).map(([type, count]) => {
          const price = roomTypePrices[type];
          return `${type} (${count})${price ? ` ₹${Number(price).toLocaleString('en-IN')}` : ''}`;
        }).join(', ') 
      : null;

    return {
      ...b,
      amenities: selectedAmenities,
      room_type: roomType,
    };
  });

  const { data: achievements, error: achievementsError } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id);

  // Transactions: only confirmed/completed = payment, refunded = refund. Skip pending entirely.
  const mappedTransactions = (bookings || []).filter((b: any) =>
    ['confirmed', 'checked_in', 'completed', 'cancelled', 'refunded'].includes(b.status)
  ).map(b => {
    const isCancelledOrRefunded = b.status === 'cancelled' || b.status === 'refunded';
    const bTotalPrice = Number(b.total_price || 0);
    const bServiceFee = (b.service_fee !== undefined && b.service_fee !== null)
      ? Number(b.service_fee)
      : Math.round((bTotalPrice * 0.1) / 1.1);
    const bAccommodation = Math.max(0, bTotalPrice - bServiceFee);

    return {
      id: b.id,
      transactionId: b.id.slice(0, 8).toUpperCase(),
      booking_id: b.id.slice(0, 8).toUpperCase(),
      guestName: userData.name || user.user_metadata?.name || 'Valued Guest',
      guestAddress: [user.email, personalInfo?.location].filter(Boolean).join('\n') || 'Address not provided',
      propertyName: b.properties?.title || 'Property',
      hostName: 'StayCool Host',
      amount: isCancelledOrRefunded
        ? calculateRefundAmount(bTotalPrice, b.check_in, b.cancelled_at || b.created_at, b.created_at, b.has_free_cancellation)
        : bTotalPrice,
      serviceFee: bServiceFee,
      date: new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      bookingDate: new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      cancellationDate: b.cancelled_at
        ? new Date(b.cancelled_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : undefined,
      refundDate: b.status === 'refunded' && b.cancelled_at
        ? new Date(b.cancelled_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : undefined,
      type: (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed') ? 'payment' : 
            isCancelledOrRefunded ? 'refund' : 'other',
      status: (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed') ? 'completed' : 
              (b.status === 'refunded' ? 'refunded' : 'pending'),
      paymentMethod: 'Razorpay',
      room_type: b.room_type,
      breakdown: {
        accommodation: bAccommodation,
        service_fee: bServiceFee,
        taxes: 0
      }
    };
  });

  const { data: wishlist, error: wishlistError } = await supabase
    .from('wishlist')
    .select('*, properties(*)')
    .eq('user_id', user.id);

  const allUserData = {
    ...userData,
    ...personalInfo,
    email: user.email, // Ensure email is not overwritten by null in personalInfo
    verifications,
    reviews,
    bookings,
    achievements,
    transactions: mappedTransactions,
    wishlist,
  };

  return (
    <main className="min-h-screen bg-[#080808] pb-12">

      {/* Main Profile Component renders Overview, Reviews, or Settings based on user interaction */}
      <div className="py-2">
        {allUserData && <UserProfileInteractive userData={allUserData as any} />}
      </div>
    </main>
  );
}
