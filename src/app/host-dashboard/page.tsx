import type { Metadata } from 'next';

import HostDashboardInteractive from './components/HostDashboardInteractive';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

  const { data: host, error: hostError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Role-based access control
  if (hostError || !host) {
    await supabase.auth.signOut();
    redirect('/auth');
  }

  /* 
  if (host.role === 'admin') {
    redirect('/admin-panel');
  }
  */

  // Redirect guests to user profile
  if (host.role === 'guest') {
    redirect('/user-profile');
  }

  // Check if user is host with proper status
  if (host.role === 'host') {
    // HOST APPROVAL REMOVED: Allow pending hosts to access dashboard
    // if (host.status === 'pending') {
    //   await supabase.auth.signOut();
    //   redirect('/auth?error=pending');
    // }
    if (host.status === 'rejected' || host.status === 'suspended') {
      await supabase.auth.signOut();
      redirect('/auth?error=rejected');
    }
  } else {
    // Not a host at all
    redirect('/');
  }

  const accessToken = user.id; // Use user ID instead of access token

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('host_id', user.id);

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('receiver_id', user.id);

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, properties!inner(*), guest:users!guest_id(name, avatar_url)')
    .in('properties.host_id', [user.id])
    .order('created_at', { ascending: false });

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('host_id', user.id);

  // Group transactions by month for the chart
  const monthlyEarningsMap: Record<string, number> = {};
  transactions?.forEach((t: any) => {
    const month = new Date(t.date).toLocaleString('default', { month: 'short' });
    monthlyEarningsMap[month] = (monthlyEarningsMap[month] || 0) + (Number(t.amount) || 0);
  });

  const earnings = Object.entries(monthlyEarningsMap).map(([month, earnings]) => ({
    month,
    earnings,
  }));

  const hostData = {
    ...host,
    properties,
    bookings,
    earnings,
    transactions: transactions || [],
    reviews: reviews || [],
  };

  return (
    <>

      <HostDashboardInteractive hostData={hostData as any} accessToken={accessToken} />
    </>
  );
}
