import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FinancialsList from './components/FinancialsList';
import AdminPageHeader from '../components/AdminPageHeader';
import { createAdminSupabaseClient } from '@/lib/admin-actions';
import { getRefundPercentage } from '@/lib/refund-policy';

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
      guest:users!guest_id ( name, email ),
      property:properties!property_id ( 
        title,
        host:users!host_id ( name )
      )
    `)
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('Error fetching bookings for financials:', bookingsError);
  }

  // Fetch guest location info separately
  const guestIds = [...new Set((bookingsWithDetails || []).map((b: any) => b.guest_id).filter(Boolean))];
  const { data: guestPersonalInfo } = guestIds.length > 0
    ? await supabaseAdmin.from('user_personal_info').select('user_id, location').in('user_id', guestIds)
    : { data: [] };
  const locationMap: Record<string, string> = {};
  (guestPersonalInfo || []).forEach((info: any) => {
    if (info.location) locationMap[info.user_id] = info.location;
  });

  // Map bookings to the Transaction interface
  const mappedTransactions = (bookingsWithDetails || []).map(b => {
    const guestLocation = locationMap[b.guest_id];
    const guestEmail = b.guest?.email;
    const guestAddress = [guestEmail, guestLocation].filter(Boolean).join('\n') || 'Address not provided';
    
    const isRefund = (b.status === 'cancelled' || b.status === 'refunded');
    let cancellationLead = undefined;
    let appliedPolicy = undefined;
    let refundPercentage = undefined;

    if (isRefund && b.cancelled_at && b.check_in) {
      const policyResult = getRefundPercentage(
        b.check_in,
        b.cancelled_at,
        b.created_at,
        b.has_free_cancellation
      );
      cancellationLead = policyResult.daysBefore;
      appliedPolicy = policyResult.policy;
      refundPercentage = policyResult.percent;
    }

    return {
      id: b.id,
      transactionId: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
      propertyName: b.property?.title || 'Unknown Property',
      guestName: b.guest?.name || 'Unknown Guest',
      guestAddress,
      hostName: b.property?.host?.name || 'Unknown Host',
      amount: Number(b.total_price),
      date: b.created_at,
      status: (b.status === 'confirmed' || b.status === 'completed') ? 'completed' : 
              (b.status === 'refunded' ? 'refunded' : 'pending'),
      paymentMethod: 'Razorpay',
      daysBeforeCheckIn: cancellationLead,
      appliedPolicy: appliedPolicy,
      refundPercentage: refundPercentage,
      type: isRefund ? 'refund' : 'payment'
    };
  });

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
