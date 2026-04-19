import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FinancialsList from './components/FinancialsList';
import AdminPageHeader from '../components/AdminPageHeader';
import { createAdminSupabaseClient } from '@/lib/admin-actions';

const FinancialsPage = async () => {
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

  // Role-based check: only admins can access this page
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/auth');
  }

  // Use the admin client to bypass RLS for financial data
  const supabaseAdmin = await createAdminSupabaseClient();

  // Fetch bookings as the primary source of truth for financials
  const { data: bookingsWithDetails, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      guest:users!guest_id ( name ),
      property:properties!property_id ( 
        title,
        host:users!host_id ( name )
      )
    `)
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('Error fetching bookings for financials:', bookingsError);
  }

  // Map bookings to the Transaction interface
  const mappedTransactions = (bookingsWithDetails || []).map(b => ({
    id: b.id,
    transactionId: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
    propertyName: b.property?.title || 'Unknown Property',
    guestName: b.guest?.name || 'Unknown Guest',
    hostName: b.property?.host?.name || 'Unknown Host',
    amount: Number(b.total_price),
    date: b.created_at,
    status: (b.status === 'confirmed' || b.status === 'completed') ? 'completed' : 
            (b.status === 'cancelled' || b.status === 'refunded') ? 'refunded' : 'pending',
    paymentMethod: 'Razorpay'
  }));

  return (
    <div className="space-y-0">
      <AdminPageHeader
        title="Financial Oversight"
        subtitle="Monitor transactions and platform revenue"
      />
      <FinancialsList initialTransactions={mappedTransactions || []} />
    </div>
  );
};

export default FinancialsPage;
