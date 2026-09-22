import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FinancialsList from './components/FinancialsList';
import AdminPageHeader from '../components/AdminPageHeader';
import { createAdminSupabaseClient } from '@/lib/admin-actions';
import { getRefundPercentage, calculateRefundDistribution } from '@/lib/refund-policy';

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

  const [bookingsRes, transfersRes] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select(`
        *,
        guest:users!guest_id ( name, email, phone ),
        property:properties!property_id ( 
          title,
          location,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          room_type_prices,
          bulk_booking_discount,
          host_id,
          host:users!host_id ( name, email, phone )
        ),
        booking_rooms(rooms(room_type))
      `)
      .not('status', 'in', '("pending_payment","payment_failed")')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('payment_transfers').select('*')
  ]);

  const { data: bookingsWithDetails, error: bookingsError } = bookingsRes;
  const { data: transfersData } = transfersRes;

  if (bookingsError) {
    console.error('Error fetching bookings for financials:', bookingsError);
  }

  const transferMap: Record<string, any> = {};
  (transfersData || []).forEach((t: any) => {
    if (t.booking_id) transferMap[t.booking_id] = t;
  });

  // Fetch guest and host location / phone info from user_personal_info
  const userIds = [...new Set([
    ...(bookingsWithDetails || []).map((b: any) => b.guest_id),
    ...(bookingsWithDetails || []).map((b: any) => b.property?.host_id)
  ].filter(Boolean))];

  const { data: personalInfoRows } = userIds.length > 0
    ? await supabaseAdmin.from('user_personal_info').select('user_id, location, phone').in('user_id', userIds)
    : { data: [] };
  const locationMap: Record<string, string> = {};
  const phoneMap: Record<string, string> = {};
  (personalInfoRows || []).forEach((info: any) => {
    if (info.location) locationMap[info.user_id] = info.location;
    if (info.phone) phoneMap[info.user_id] = info.phone;
  });

  // Map bookings to the Transaction interface
  const mappedTransactions = (bookingsWithDetails || []).map(b => {
    const rawAmount = Number(b.total_price ?? b.amount ?? b.price ?? b.grand_total ?? 0);
    const amount = isNaN(rawAmount) ? 0 : rawAmount;
    const serviceFee = b.service_fee || (amount * 0.1);
    const netRevenue = amount - serviceFee;

    const guestEmail = b.guest?.email || '';
    const guestPhone = b.guest?.phone || phoneMap[b.guest_id] || '';
    const guestLocation = locationMap[b.guest_id] || '';
    const guestAddress = [guestEmail, guestPhone, guestLocation].filter(Boolean).join('\n') || 'Address not provided';

    const hostName = b.property?.host?.name || 'StayCool Host';
    const hostEmail = b.property?.host?.email || '';
    const hostPhone = b.property?.host?.phone || phoneMap[b.property?.host_id] || '';
    const hostLocation = locationMap[b.property?.host_id] || '';
    const propertyName = b.property?.title || 'Unknown Property';
    const propertyLocation = b.property?.location || [b.property?.city, b.property?.state].filter(Boolean).join(', ') || hostLocation || '';
    const propertyAddress = [b.property?.address_line1, b.property?.address_line2, b.property?.city, b.property?.state, b.property?.postal_code].filter(Boolean).join(', ') || propertyLocation;

    const checkIn = b.check_in ? new Date(b.check_in).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined;
    const checkOut = b.check_out ? new Date(b.check_out).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined;
    
    const isRefund = (b.status === 'cancelled' || b.status === 'refunded');
    let cancellationLead = undefined;
    let appliedPolicy = undefined;
    let refundPercentage = undefined;
    let guestRefundAmount = undefined;
    let hostShare = undefined;
    let adminShare = undefined;
    let retainedPenalty = undefined;
    let retainedServiceFee = undefined;
    let netRefundablePool = undefined;

    if (isRefund) {
      const dist = calculateRefundDistribution(
        amount,
        b.check_in || b.created_at,
        b.cancelled_at || new Date().toISOString(),
        b.created_at,
        b.has_free_cancellation,
        Number(b.free_cancellation_fee || 0)
      );
      cancellationLead = dist.daysBeforeCheckIn;
      appliedPolicy = dist.appliedPolicy;
      refundPercentage = dist.guestRefundPercent;
      guestRefundAmount = dist.guestRefundAmount;
      hostShare = dist.hostShare;
      adminShare = dist.adminShare;
      retainedPenalty = dist.netRefundablePool - dist.guestRefundAmount;
      retainedServiceFee = dist.platformFee;
      netRefundablePool = dist.netRefundablePool;
    }

    const transfer = transferMap[b.id];
    let hostPayoutAmount = undefined;
    let adminCommissionAmount = undefined;

    if (!isRefund) {
      if (transfer && Number(transfer.host_amount) > 0) {
        hostPayoutAmount = Math.round(Number(transfer.host_amount));
        adminCommissionAmount = Math.round(Number(transfer.platform_commission || (amount - hostPayoutAmount)));
      } else {
        const guestFee = serviceFee || Math.round((amount * 0.1) / 1.1);
        const hostRevenue = Math.max(0, amount - guestFee);
        const hostCommission = Math.round(hostRevenue * 0.10);
        hostPayoutAmount = Math.max(0, hostRevenue - hostCommission);
        adminCommissionAmount = Math.max(0, amount - hostPayoutAmount);
      }
    }

    const roomTypePrices = b.property?.room_type_prices || {};
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
    const nights = Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60 * 24)));
    const discountPct = (b.bulk_booking_discount || b.property?.bulk_booking_discount || 0) / 100;

    let baseAccommodationFromRoomType = 0;
    if (roomType) {
      roomType.split(', ').forEach((type: string) => {
        const match = type.match(/^(.*)\s\((\d+)\)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
        const count = match ? parseInt(match[2]) : 1;
        const pricePerUnit = match && match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
        baseAccommodationFromRoomType += count * pricePerUnit * nights;
      });
    }

    const amenitiesTotalFromBooking = b.amenities && Array.isArray(b.amenities) && b.amenities.length > 0
      ? b.amenities.reduce((sum: number, amenity: any) => sum + ((Number(amenity.price) || 0) * (Number(amenity.count) || 1)), 0)
      : 0;
    const freeCancellationFee = b.free_cancellation_fee || 0;
    const amenitiesTotal = amenitiesTotalFromBooking;

    let baseAccommodation = 0;
    let calculatedServiceFee = 0;
    let discountSavings = 0;

    if (baseAccommodationFromRoomType > 0) {
      baseAccommodation = baseAccommodationFromRoomType;
      calculatedServiceFee = Math.round(baseAccommodation * 0.1);
      discountSavings = Math.round(baseAccommodation * discountPct);
    } else {
      const accommodationAndFee = Math.max(0, amount - amenitiesTotal - freeCancellationFee);
      baseAccommodation = Math.round(accommodationAndFee / (1.1 - discountPct));
      calculatedServiceFee = Math.round(baseAccommodation * 0.1);
      discountSavings = Math.round(baseAccommodation * discountPct);
    }

    const computedBreakdown = {
      accommodation: baseAccommodation,
      service_fee: calculatedServiceFee,
      taxes: 0,
      discount: b.booking_type === 'bulk' ? discountSavings : 0,
      upgrades: amenitiesTotal,
      cancellation_fee: freeCancellationFee
    };

    return {
      id: b.id,
      transactionId: `TXN-${b.id.slice(0, 8).toUpperCase()}`,
      invoice_id: b.id.slice(0, 8).toUpperCase(),
      booking_id: b.id,
      propertyName,
      propertyLocation,
      propertyAddress,
      guestName: b.guest?.name || 'Unknown Guest',
      guestEmail,
      guestPhone,
      guestLocation,
      guestAddress,
      hostName,
      hostEmail,
      hostPhone,
      hostLocation,
      amount: amount,
      serviceFee: serviceFee,
      netRevenue: netRevenue,
      date: b.created_at,
      bookingDate: b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined,
      cancellationDate: b.cancelled_at
        ? new Date(b.cancelled_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : undefined,
      refundDate: b.status === 'refunded' && b.cancelled_at
        ? new Date(b.cancelled_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : undefined,
      status: ((b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed') ? 'completed' : 
              (b.status === 'refunded' ? 'refunded' : 'pending')) as 'pending' | 'completed' | 'failed' | 'refunded',
      paymentMethod: 'Razorpay',
      daysBeforeCheckIn: cancellationLead,
      appliedPolicy: appliedPolicy,
      refundPercentage: refundPercentage,
      guestRefundAmount,
      hostShare,
      adminShare,
      hostPayoutAmount,
      adminCommissionAmount,
      refundAmount: guestRefundAmount,
      retainedPenalty,
      retainedServiceFee,
      netRefundablePool,
      type: (isRefund ? 'refund' : 'payment') as 'payment' | 'refund',
      breakdown: computedBreakdown,
      room_type: roomType,
      checkIn,
      checkOut,
      nights,
      totalRooms: b.total_rooms_booked || 1
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
