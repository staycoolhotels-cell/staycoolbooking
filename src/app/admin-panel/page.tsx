import type { Metadata } from 'next';
import AdminPanelMotionWrapper from './components/AdminPanelMotionWrapper';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUsersData, syncAndFetchUsers } from '@/lib/admin-actions';

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
    .from('users')
    .select('role')
    .eq('id', session?.user?.id)
    .single();

  if (error || !session || adminProfile?.role !== 'admin') {
    redirect('/auth');
  }

  const profiles = await syncAndFetchUsers();
  const authUsers = await getUsersData();

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*');

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

  // Transform activities to match the RecentActivity interface
  const transformedActivities = activities?.map((activity: any) => ({
    id: activity.id,
    type: activity.type || 'user_action',
    title: activity.title || 'Activity',
    description: activity.description || '',
    timestamp: activity.created_at
      ? new Date(activity.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      : 'Just now',
    status: activity.status || 'info'
  })) || [];

  const adminData = {
    profiles: profiles,
    authUsers: authUsers,
    properties,
    bookings,
    transactions,
    reviews,
    disputes,
    verifications,
    activities: transformedActivities,
  };

  return <AdminPanelMotionWrapper adminData={adminData} />;
}
