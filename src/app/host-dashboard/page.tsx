import { redirect } from 'next/navigation';
import { getHostProperties, getHostBookings, getCachedUser, getSupportAdmin } from '@/lib/data-service';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import HostDashboardInteractive from './components/HostDashboardInteractive';
import { autoProcessCheckedInBookings } from '@/lib/booking-actions';

export const metadata: Metadata = {
  title: 'Host Dashboard - StayCool',
  description:
    'Manage your properties, bookings, and earnings with comprehensive host management tools including real-time availability toggle, earnings analytics, and guest communication center.',
};

export default async function HostDashboardPage() {
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

  // Use cached user fetch
  const host = await getCachedUser(user.id);

  // Role-based access control
  if (!host) {
    redirect('/auth');
  }

  /* 
  if (host.role === 'admin') {
    redirect('/admin-panel');
  }
  */

  // Redirect guests to user profile
  if (host.role === 'guest') {
    redirect('/');
  }

  // Check if user is host with proper status
  if (host.role === 'host') {
    // Subscription Check
    if (host.subscription_expiry) {
      const expiryDate = new Date(host.subscription_expiry);
      const now = new Date();
      if (now > expiryDate) {
        // Subscription expired - We let the page load so they can see the renewal overlay in the center of the screen
        console.log('⚠️ Host subscription expired. Letting dashboard load so they can pay/renew:', host.subscription_expiry);
      }
    }

    if (host.status === 'rejected' || host.status === 'suspended') {
      await supabase.auth.signOut();
      redirect('/auth?error=rejected');
    }
  } else {
    // Not a host at all
    redirect('/');
  }

  const accessToken = user.id; // Use user ID instead of access token

  // Run automatic check-ins first
  await autoProcessCheckedInBookings();

  // Use cached data services for better performance
  const propertiesPromise = getHostProperties(user.id);
  const bookingsPromise = getHostBookings(user.id);

  const [properties, rawBookings, supportAdmin] = await Promise.all([
    propertiesPromise, 
    bookingsPromise,
    getSupportAdmin()
  ]);

  // The main dashboard is available only after the two mandatory host setup steps.
  const { data: hostKyc } = await createServiceClient()
    .from('host_kyc_details')
    .select('kyc_status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!properties?.length || hostKyc?.kyc_status !== 'activated') {
    redirect('/host-onboarding');
  }

  // Fetch amenities log from activities table to load selected amenities for host bookings
  const adminSupabase = createServiceClient();
  const { data: bookingActivities } = await adminSupabase
    .from('activities')
    .select('*')
    .eq('type', 'booking_amenities');

  const bookings = (rawBookings || []).map((b: any) => {
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

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('receiver_id', user.id);

  const mappedTransactions = (bookings || [])
    .filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed')
    .map(b => ({
      id: b.id,
      transactionId: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
      propertyName: b.properties?.title || 'Unknown Property',
      guestName: b.guest?.name || 'Unknown Guest',
      hostName: host.name || 'Me',
      amount: Number(b.total_price),
      date: new Date(b.created_at).toLocaleDateString(),
      status: (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed') ? 'completed' : 'pending',
      paymentMethod: 'Razorpay',
      room_type: b.room_type
    }));

  // Group transactions by month for the chart
  const monthlyEarningsMap: Record<string, number> = {};
  const confirmedBookingsForChart = (bookings || []).filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed');
  confirmedBookingsForChart.forEach((b: any) => {
    const month = new Date(b.created_at).toLocaleString('default', { month: 'short' });
    monthlyEarningsMap[month] = (monthlyEarningsMap[month] || 0) + (Number(b.total_price) || 0);
  });

  const earnings = Object.entries(monthlyEarningsMap).map(([month, earnings]) => ({
    month,
    earnings,
  }));

  const hostData = {
    ...host,
    properties: properties || [],
    bookings: bookings || [],
    earnings,
    transactions: mappedTransactions || [],
    reviews: reviews || [],
    supportAdmin: supportAdmin || null,
  };

  return (
    <>

      <HostDashboardInteractive hostData={hostData as any} accessToken={accessToken} />
    </>
  );
}
