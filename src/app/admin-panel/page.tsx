import type { Metadata } from 'next';
import AdminPanelMotionWrapper from './components/AdminPanelMotionWrapper';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUsersData } from '@/lib/admin-actions';

export const metadata: Metadata = {
  title: 'Admin Panel - StayCool',
  description: 'Administrative control center for StayCool platform oversight.',
};

export default async function AdminPanelPage() {
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

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session?.user?.id)
    .single();

  if (error || !session || adminProfile?.role !== 'admin') {
    redirect('/auth');
  }

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
  const authUsers = await getUsersData();

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('host_id');

  const { data: bookings, error: bookingsError } = await supabase.from('bookings').select('*');
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*');
  const { data: reviews, error: reviewsError } = await supabase.from('reviews').select('*');
  const { data: disputes, error: disputesError } = await supabase.from('disputes').select('*');
  const { data: verifications, error: verificationsError } = await supabase
    .from('verifications')
    .select('*');
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const adminData = {
    profiles: profiles,
    authUsers: authUsers,
    properties,
    bookings,
    transactions,
    reviews,
    disputes,
    verifications,
    activities,
  };

  return <AdminPanelMotionWrapper adminData={adminData} />;
}
