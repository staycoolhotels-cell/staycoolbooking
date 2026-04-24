import type { Metadata } from 'next';
import AdminPanelMotionWrapper from './components/AdminPanelMotionWrapper';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUsersData, syncAndFetchUsers } from '@/lib/admin-actions';
import { createAdminSupabaseClient } from '@/lib/admin-actions';
import { Suspense } from 'react';

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

  // Use the admin client to bypass RLS for dashboard stats
  const supabaseAdmin = await createAdminSupabaseClient();

  const { data: properties, error: propertiesError } = await supabaseAdmin
    .from('properties')
    .select('*');

  const { data: bookingsWithDetails, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      guest:users!guest_id ( name, email ),
      property:properties!property_id ( 
        title,
        host:users!host_id ( name )
      )
    `)
    .order('created_at', { ascending: false });

  // Fetch guest location info separately
  const guestIds = [...new Set((bookingsWithDetails || []).map((b: any) => b.guest_id).filter(Boolean))];
  const { data: guestPersonalInfo } = guestIds.length > 0
    ? await supabaseAdmin.from('user_personal_info').select('user_id, location').in('user_id', guestIds)
    : { data: [] };
  const locationMap: Record<string, string> = {};
  (guestPersonalInfo || []).forEach((info: any) => {
    if (info.location) locationMap[info.user_id] = info.location;
  });

  // Map confirmed bookings to the Transaction interface
  const mappedTransactions = (bookingsWithDetails || []).map(b => {
    const amount = Number(b.total_price);
    const serviceFee = b.service_fee || (amount * 0.1); // Fallback to 10%
    const netRevenue = amount - serviceFee;
    const guestLocation = locationMap[b.guest_id];
    const guestEmail = b.guest?.email;
    const guestAddress = [guestEmail, guestLocation].filter(Boolean).join('\n') || 'Address not provided';
    
    return {
      id: b.id,
      transactionId: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
      propertyName: b.property?.title || 'Unknown Property',
      guestName: b.guest?.name || 'Unknown Guest',
      guestAddress,
      hostName: b.property?.host?.name || 'Unknown Host',
      amount: amount,
      serviceFee: serviceFee,
      netRevenue: netRevenue,
      type: (b.status === 'confirmed' || b.status === 'completed') ? 'payment' : 
            (b.status === 'cancelled' || b.status === 'refunded') ? 'refund' : 'other',
      breakdown: {
        accommodation: amount - serviceFee,
        service_fee: serviceFee,
        taxes: 0 // Default for now
      },
      date: new Date(b.created_at).toLocaleDateString(),
      rawDate: b.created_at,
      status: (b.status === 'confirmed' || b.status === 'completed') ? 'completed' : 
              (b.status === 'refunded' ? 'refunded' : 'pending'),
      paymentMethod: 'Razorpay'
    };
  });

  const { data: reviews, error: reviewsError } = await supabaseAdmin.from('reviews').select('*');
  const { data: disputes, error: disputesError } = await supabaseAdmin.from('disputes').select('*');
  const { data: verifications, error: verificationsError } = await supabaseAdmin
    .from('verifications')
    .select('*');
  const { data: activities, error: activitiesError } = await supabaseAdmin
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
    profiles: profiles || [],
    authUsers: authUsers || [],
    properties: properties || [],
    bookings: bookingsWithDetails || [],
    transactions: mappedTransactions || [],
    reviews: reviews || [],
    disputes: disputes || [],
    verifications: verifications || [],
    activities: transformedActivities || [],
  };

  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading Admin Panel...</div>}>
      <AdminPanelMotionWrapper adminData={adminData} />
    </Suspense>
  );
}
