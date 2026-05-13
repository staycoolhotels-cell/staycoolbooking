import { redirect } from 'next/navigation';
import { getHostProperties, getHostBookings, getCachedUser, getSupportAdmin } from '@/lib/data-service';
import { createServerClient } from '@supabase/ssr';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import HostDashboardInteractive from './components/HostDashboardInteractive';

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
        // Subscription expired
        console.log('❌ BLOCKING: Host subscription expired:', host.subscription_expiry);
        // We could redirect to a renewal page, but for now let's just show an error or sign out
        // redirect('/host-renewal'); // Future implementation
        await supabase.auth.signOut();
        redirect('/auth?error=subscription_expired');
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

  // Use cached data services for better performance
  const propertiesPromise = getHostProperties(user.id);
  const bookingsPromise = getHostBookings(user.id);

  const [properties, bookings, supportAdmin] = await Promise.all([
    propertiesPromise, 
    bookingsPromise,
    getSupportAdmin()
  ]);

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('receiver_id', user.id);

  const mappedTransactions = (bookings || [])
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .map(b => ({
      id: b.id,
      transactionId: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
      propertyName: b.properties?.title || 'Unknown Property',
      guestName: b.guest?.name || 'Unknown Guest',
      hostName: host.name || 'Me',
      amount: Number(b.total_price),
      date: new Date(b.created_at).toLocaleDateString(),
      status: (b.status === 'confirmed' || b.status === 'completed') ? 'completed' : 'pending',
      paymentMethod: 'Razorpay'
    }));

  // Group transactions by month for the chart
  const monthlyEarningsMap: Record<string, number> = {};
  const confirmedBookingsForChart = (bookings || []).filter(b => b.status === 'confirmed' || b.status === 'completed');
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
