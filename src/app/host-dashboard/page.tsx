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

  // Run automatic check-ins asynchronously in the background so it never blocks page load
  autoProcessCheckedInBookings().catch((err) => {
    console.error('[AutoCheckIn background error]:', err);
  });

  const adminSupabase = createServiceClient();

  // Fetch all dashboard data concurrently in a single parallel batch
  const [properties, rawBookings, supportAdmin, bookingActivitiesRes, reviewsRes] = await Promise.all([
    getHostProperties(user.id),
    getHostBookings(user.id),
    getSupportAdmin(),
    adminSupabase.from('activities').select('*').eq('type', 'booking_amenities'),
    supabase.from('reviews').select('*').eq('receiver_id', user.id)
  ]);

  // If the host has not created any property yet, redirect to onboarding step 1.
  // Banking & KYC is optional during onboarding — host can skip and complete it later from their dashboard.
  if (!properties?.length) {
    redirect('/host-onboarding');
  }

  const bookingActivities = bookingActivitiesRes.data || [];
  const reviews = reviewsRes.data || [];

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

  const mappedTransactions = (bookings || [])
    .filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed')
    .map(b => {
      const grossTotal = Number(b.total_price) || 0;
      // Platform service fee is strictly 100% retained by Admin. It must never be shared with host.
      const guestServiceFee = Number(b.service_fee) || Math.round((grossTotal * 0.1) / 1.1);
      const hostRevenue = Math.max(0, grossTotal - guestServiceFee);
      const hostCommission = Math.round(hostRevenue * 0.10);
      const hostNetPayout = hostRevenue - hostCommission;

      return {
        id: b.id,
        transactionId: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
        propertyName: b.properties?.title || 'Unknown Property',
        guestName: b.guest?.name || 'Unknown Guest',
        hostName: host.name || 'Me',
        amount: hostNetPayout, // Host net earnings (₹0 from platform service fee)
        serviceFee: guestServiceFee,
        netRevenue: hostNetPayout,
        date: new Date(b.created_at).toLocaleDateString(),
        status: (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed') ? 'completed' : 'pending',
        paymentMethod: 'Razorpay',
        room_type: b.room_type,
        breakdown: {
          accommodation: hostRevenue,
          service_fee: guestServiceFee,
          taxes: 0,
        }
      };
    });

  // Group transactions by month for the chart
  const monthlyEarningsMap: Record<string, number> = {};
  const confirmedBookingsForChart = (bookings || []).filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed');
  confirmedBookingsForChart.forEach((b: any) => {
    const month = new Date(b.created_at).toLocaleString('default', { month: 'short' });
    const grossTotal = Number(b.total_price) || 0;
    const guestServiceFee = Number(b.service_fee) || Math.round((grossTotal * 0.1) / 1.1);
    const hostRevenue = Math.max(0, grossTotal - guestServiceFee);
    const hostNetPayout = Math.round(hostRevenue * 0.90);
    monthlyEarningsMap[month] = (monthlyEarningsMap[month] || 0) + hostNetPayout;
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
