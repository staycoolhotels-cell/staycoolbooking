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

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    redirect('/auth');
  }

  const accessToken = session.access_token;

  const { data: host, error: hostError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('host_id', session.user.id);

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, properties!inner(*)')
    .in('properties.host_id', [session.user.id]);

  const { data: earnings, error: earningsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('host_id', session.user.id);

  const hostData = {
    ...host,
    properties,
    bookings,
    earnings,
  };

  return (
    <>
      
      <HostDashboardInteractive hostData={hostData as any} accessToken={accessToken} />
    </>
  );
}
