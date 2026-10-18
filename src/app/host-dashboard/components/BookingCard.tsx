'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { Booking } from '@/lib/types';
import { approveBooking, rejectBooking } from '@/lib/booking-actions';
import { generateInvoicePDF } from '@/lib/pdf-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createDispute } from '@/lib/dispute-actions';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import ActionConfirmModal from '@/components/ui/ActionConfirmModal';
import GuestDetailsModal from './GuestDetailsModal';
import { calculateRefundDistribution } from '@/lib/refund-policy';

interface BookingCardProps {
  booking: Booking;
  onAction: (tab: string, data?: any) => void;
}

const getStatusStyles = (status: Booking['status']) => {
  switch (status) {
    case 'confirmed':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30',
        shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]',
        indicator: 'bg-emerald-400 animate-pulse',
        glow: 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0'
      };
    case 'checked_in':
      return {
        bg: 'bg-teal-500/20',
        text: 'text-teal-300',
        border: 'border-teal-500/30',
        shadow: 'shadow-[0_0_15px_rgba(20,184,166,0.15)]',
        indicator: 'bg-teal-400 animate-pulse',
        glow: 'from-teal-500/0 via-teal-500/20 to-teal-500/0'
      };
    case 'pending':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
        shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]',
        indicator: 'bg-amber-400 animate-pulse',
        glow: 'from-amber-500/0 via-amber-500/20 to-amber-500/0'
      };
    case 'cancelled':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-300',
        border: 'border-red-500/30',
        shadow: 'shadow-[0_0_15px_rgba(248,113,113,0.15)]',
        indicator: 'bg-red-400',
        glow: 'from-red-500/0 via-red-500/20 to-red-500/0'
      };
    case 'completed':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        indicator: 'bg-blue-400',
        glow: 'from-blue-500/0 via-blue-500/20 to-blue-500/0'
      };
    case 'pending_payment':
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-300',
        border: 'border-orange-500/30',
        shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
        indicator: 'bg-orange-400 animate-pulse',
        glow: 'from-orange-500/0 via-orange-500/20 to-orange-500/0'
      };
    case 'payment_failed':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-300',
        border: 'border-red-500/30',
        shadow: 'shadow-[0_0_15px_rgba(248,113,113,0.15)]',
        indicator: 'bg-red-400',
        glow: 'from-red-500/0 via-red-500/20 to-red-500/0'
      };
    default:
      return {
        bg: 'bg-zinc-500/20',
        text: 'text-zinc-300',
        border: 'border-zinc-500/30',
        shadow: '',
        indicator: 'bg-zinc-400',
        glow: 'from-transparent via-zinc-500/20 to-transparent'
      };
  }
};

const BookingCard = ({ booking, onAction }: BookingCardProps) => {
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
  const [isGuestDetailsModalOpen, setIsGuestDetailsModalOpen] = useState(false);
  const [guestIdDoc, setGuestIdDoc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [issueType, setIssueType] = useState('Damage to property');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [mounted, setMounted] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'reject' | 'cancel' | null;
  }>({ isOpen: false, type: null });

  useEffect(() => {
    setMounted(true);
    
    // Fetch guest ID document info
    const fetchGuestId = async () => {
      try {
        const { getGuestVerification } = await import('@/lib/booking-actions');
        const result = await getGuestVerification(booking.guest_id);
        
        if (result.success && result.fileUrl) {
          setGuestIdDoc(result.fileUrl);
        }
      } catch (err) {
        console.error('Failed to fetch guest ID:', err);
      }
    };

    if (booking.guest_id) {
      fetchGuestId();
    }
  }, [booking.guest_id]);

  const statusStyles = getStatusStyles(booking.status);

  const hostPricing = (() => {
    const nights = Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)));
    const totalAmount = Number(booking.total_price || 0);
    const isBulkBooking = booking.booking_type === 'bulk';
    const discountPct = isBulkBooking ? ((booking.bulk_booking_discount || (booking as any).properties?.bulk_booking_discount || 0) / 100) : 0;
    const amenitiesTotal = (booking as any).amenities && Array.isArray((booking as any).amenities) && (booking as any).amenities.length > 0
      ? (booking as any).amenities.reduce((sum: number, amenity: any) => sum + ((Number(amenity.price) || 0) * (Number(amenity.count) || 1)), 0)
      : 0;
    const freeCancellationFee = booking.free_cancellation_fee || 0;

    let baseAccommodation = 0;
    if (booking.room_type) {
      booking.room_type.split(', ').forEach((type) => {
        const match = type.match(/^(.*)\s\((\d+)\)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
        const count = match ? parseInt(match[2]) : 1;
        const pricePerUnit = match && match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
        baseAccommodation += count * pricePerUnit * nights;
      });
    }

    const netAccommodationFromTotal = totalAmount > 0
      ? Math.round((Math.max(0, totalAmount - amenitiesTotal - freeCancellationFee) / 1.1) / (discountPct < 1 ? (1 - discountPct) : 1))
      : 0;

    if (baseAccommodation === 0 || (netAccommodationFromTotal > 0 && Math.abs(baseAccommodation - netAccommodationFromTotal) > 50)) {
      if (netAccommodationFromTotal > 0) {
        baseAccommodation = netAccommodationFromTotal;
      } else {
        const propPrice = Number((booking.properties as any)?.standard_price || (booking.properties as any)?.price_per_night || (booking.properties as any)?.price || 0);
        if (propPrice > 0) {
          baseAccommodation = propPrice * nights;
        }
      }
    }

    const hostBaseAmount = baseAccommodation;
    const hostGrossAmount = hostBaseAmount + amenitiesTotal;
    const hostCommission = Math.round(hostGrossAmount * 0.10);
    const hostPayout = Math.max(0, hostGrossAmount - hostCommission);

    let hostPenaltyShare = 0;
    if (booking.status === 'cancelled') {
      const cancelDate = booking.cancelled_at ? new Date(booking.cancelled_at) : new Date(booking.created_at || Date.now());
      const dist = calculateRefundDistribution(
        totalAmount,
        booking.check_in,
        cancelDate,
        booking.created_at,
        booking.has_free_cancellation,
        freeCancellationFee
      );
      hostPenaltyShare = dist.hostShare;
    }

    return {
      nights,
      totalAmount,
      isBulkBooking,
      discountPct,
      amenitiesTotal,
      freeCancellationFee,
      hostBaseAmount,
      hostGrossAmount,
      hostCommission,
      hostPayout,
      hostPenaltyShare
    };
  })();

  const roomDetails = (() => {
    const nights = hostPricing.nights;
    const totalRooms = booking.total_rooms_booked || 1;
    const baseAmount = hostPricing.hostBaseAmount;
    const unitPricePerNight = baseAmount > 0 ? Math.round(baseAmount / (nights * totalRooms)) : 0;

    // 1. If explicit room_type was set (from booking_rooms):
    if (booking.room_type) {
      const match = booking.room_type.match(/^(.*?)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
      if (match) {
        const name = match[1].trim();
        const price = match[2] ? `₹${match[2]}` : (unitPricePerNight > 0 ? `₹${unitPricePerNight.toLocaleString('en-IN')}` : '');
        return { name, price, fullString: `${name}${price ? ` ${price}` : ''}`, unitPricePerNight };
      }
      const price = unitPricePerNight > 0 ? `₹${unitPricePerNight.toLocaleString('en-IN')}` : '';
      return { name: booking.room_type, price, fullString: `${booking.room_type}${price ? ` ${price}` : ''}`, unitPricePerNight };
    }

    // 2. Derive room type name based on property tier, room types, and booking price
    const propTier = (((booking.properties as any)?.tier || (booking.properties as any)?.type || '') as string).trim().toLowerCase();
    const propertyRoomTypes: string[] = Array.isArray((booking.properties as any)?.room_types)
      ? (booking.properties as any).room_types
      : ((booking.properties as any)?.room_type_counts ? Object.keys((booking.properties as any).room_type_counts) : []);

    let name = '';

    if (propTier === 'resort') {
      const standardPrice = Number((booking.properties as any)?.standard_price || 0);
      // Entire Resort is ONLY valid if the booking rate per night is consistent with an Entire Resort buyout (e.g. >= 10,000 or >= 50% standard_price)
      const isEntireResortRate = unitPricePerNight >= Math.min(10000, standardPrice > 0 ? standardPrice * 0.5 : 10000);
      const hasEntireResort = propertyRoomTypes.includes('Entire Resort');

      if (hasEntireResort && isEntireResortRate) {
        name = `Entire Resort (${totalRooms})`;
      } else {
        const nonEntireTypes = propertyRoomTypes.filter(t => t !== 'Entire Resort');
        name = nonEntireTypes.length > 0 ? `${nonEntireTypes[0]} (${totalRooms})` : `Standard Room (${totalRooms})`;
      }
    } else if (propTier === 'home stay' || propTier === 'homestay') {
      name = `Entire Home (${totalRooms})`;
    } else if (propTier === 'apartment') {
      name = `Entire Apartment (${totalRooms})`;
    } else if (propTier === 'villa') {
      name = `Entire Villa (${totalRooms})`;
    } else if (propTier === 'tent' || propTier === 'camp' || propTier === 'tents') {
      name = `Tent (${totalRooms})`;
    } else if (propTier === 'hotel') {
      const nonEntireTypes = propertyRoomTypes.filter(t => t !== 'Entire Resort');
      if (nonEntireTypes.length > 0) {
        const roomTypePrices = (booking.properties as any)?.room_type_prices || {};
        let closestType = nonEntireTypes[0];
        let smallestDiff = Infinity;
        for (const t of nonEntireTypes) {
          if (roomTypePrices[t]) {
            const diff = Math.abs(Number(roomTypePrices[t]) - unitPricePerNight);
            if (diff < smallestDiff) {
              smallestDiff = diff;
              closestType = t;
            }
          }
        }
        name = `${closestType} (${totalRooms})`;
      } else {
        name = `Standard Room (${totalRooms})`;
      }
    } else {
      const nonEntireTypes = propertyRoomTypes.filter(t => t !== 'Entire Resort');
      name = nonEntireTypes.length > 0 ? `${nonEntireTypes[0]} (${totalRooms})` : `Standard Room (${totalRooms})`;
    }

    // 3. Price to display: based on actual booking base accommodation rate per night
    let price = '';
    if (unitPricePerNight > 0) {
      price = `₹${unitPricePerNight.toLocaleString('en-IN')}`;
    } else {
      const fallbackPrice = Number((booking.properties as any)?.standard_price || (booking.properties as any)?.price_per_night || (booking.properties as any)?.price || 0);
      if (fallbackPrice > 0) {
        price = `₹${fallbackPrice.toLocaleString('en-IN')}`;
      }
    }

    return {
      name,
      price,
      fullString: `${name}${price ? ` ${price}` : ''}`,
      unitPricePerNight
    };
  })();

  const displayRoomTypes = roomDetails.fullString;

  const handleDownloadInvoice = async () => {
    try {
      const nights = Math.max(1, hostPricing?.nights || 1);
      const isBulkBooking = !!hostPricing?.isBulkBooking;
      const displayRoomType = roomDetails?.fullString || booking.room_type || 'Standard Room';

      const baseAccommodation = (hostPricing?.hostBaseAmount && hostPricing.hostBaseAmount > 0)
        ? hostPricing.hostBaseAmount
        : Math.round(Math.max(0, Number(booking.total_price || 0) - (hostPricing?.amenitiesTotal || 0) - (hostPricing?.freeCancellationFee || 0)) / (1.1 - (hostPricing?.discountPct || 0)));
      const serviceFee = Math.round(baseAccommodation * 0.1);
      const discountSavings = Math.round(baseAccommodation * (hostPricing?.discountPct || 0));

      const computedBreakdown = {
        accommodation: baseAccommodation || 0,
        service_fee: serviceFee || 0,
        taxes: 0,
        discount: isBulkBooking ? discountSavings : 0,
        upgrades: hostPricing?.amenitiesTotal || 0,
        cancellation_fee: hostPricing?.freeCancellationFee || 0
      };

      const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
      };

      const isCancelled = booking.status === 'cancelled' || booking.status === 'refunded';
      if (booking.status === 'pending_payment' || booking.status === 'payment_failed') {
        toast.error('Invoice is not available for unpaid or pending payment bookings.');
        return;
      }
      const cancelDateObj = booking.cancelled_at ? new Date(booking.cancelled_at) : new Date(booking.created_at || Date.now());
      const computedRefund = calculateRefundDistribution(
        Number(booking.total_price || 0),
        booking.check_in,
        cancelDateObj,
        booking.created_at,
        booking.has_free_cancellation,
        booking.free_cancellation_fee || 0
      );
      const refundAmount = (booking as any).refund_amount || computedRefund.guestRefundAmount || 0;

      const hostPayout = hostPricing?.hostPayout !== undefined ? hostPricing.hostPayout : Math.max(0, Math.round(Number(booking.total_price || 0) * 0.9));
      const adminCommission = Math.max(0, Number(booking.total_price || 0) - hostPayout);

      const resolvedGuestName = booking.guest?.name || (booking as any)?.guestName || 'Valued Guest';
      const resolvedGuestEmail = (booking.guest as any)?.email || (booking as any)?.guestEmail || '';
      const resolvedGuestPhone = (booking.guest as any)?.phone || (booking as any)?.guestPhone || '';

      const transactionData = {
        id: booking.id,
        invoice_id: booking.id.slice(0, 8).toUpperCase(),
        amount: Number(booking.total_price || 0),
        date: formatDate(booking.created_at),
        status: booking.status,
        type: isCancelled ? 'refund' : 'payment',
        guestName: resolvedGuestName,
        guestEmail: resolvedGuestEmail,
        guestPhone: resolvedGuestPhone,
        hostName: (booking.properties as any)?.host?.name || 'Host',
        guestAddress: [resolvedGuestEmail, resolvedGuestPhone].filter(Boolean).join('\n') || 'Address not provided',
        propertyName: booking.properties?.title || (booking.properties as any)?.name || 'Property',
        booking_id: booking.id,
        room_type: displayRoomType,
        paymentMethod: 'Razorpay',
        breakdown: computedBreakdown,
        bookingDate: formatDate(booking.created_at),
        checkIn: formatDate(booking.check_in),
        checkOut: formatDate(booking.check_out),
        nights: nights,
        appliedPolicy: computedRefund.appliedPolicy,
        daysBeforeCheckIn: computedRefund.daysBeforeCheckIn,
        refundPercentage: computedRefund.guestRefundPercent,
        cancellationDate: booking.cancelled_at ? formatDate(booking.cancelled_at) : undefined,
        refundAmount: refundAmount,
        retainedPenalty: Math.max(0, computedRefund.netRefundablePool - computedRefund.guestRefundAmount),
        retainedServiceFee: computedRefund.commissionAmount,
        netRefundablePool: computedRefund.netRefundablePool,
        hostPayoutAmount: hostPayout,
        adminCommissionAmount: adminCommission,
        audience: 'host'
      };

      await generateInvoicePDF(transactionData as any);
      toast.success('Invoice generated successfully.');
    } catch (err) {
      console.error('Invoice generation failed in BookingCard:', err);
      toast.error('Failed to generate invoice. Please try again.');
    }
  };

  const bookingCode = (booking as any).booking_code
    ? `#${(booking as any).booking_code}`
    : `#BK${booking.id.slice(0, 5).toUpperCase()}`;

  return (
    <div className={`relative group overflow-hidden bg-[#0d101c] backdrop-blur-2xl border ${statusStyles.border} rounded-[1.8rem] md:rounded-[2.2rem] p-3.5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.85)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.95)] transition-all duration-300`}>

      {/* Top Status Glow Bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${statusStyles.glow} opacity-80 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10 space-y-4">
        {/* 1. Top Bar: Booking ID & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5">
          <span className="px-2.5 sm:px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-lg text-xs md:text-sm tracking-wider shrink-0">
            {bookingCode}
          </span>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end">
            {/* Booking Status */}
            <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full border backdrop-blur-xl whitespace-nowrap ${statusStyles.bg} ${statusStyles.border} ${statusStyles.text} ${statusStyles.shadow}`}>
              {booking.status.replace(/_/g, ' ')}
            </span>

            {/* Payout Transfer Status (shown only for confirmed/checked_in/completed) */}
            {(booking.status === 'confirmed' || booking.status === 'checked_in' || booking.status === 'completed') && (() => {
              const ps = (booking as any).payoutTransferStatus as 'completed' | 'pending' | 'failed' | undefined;
              const failReason = (booking as any).payoutFailureReason as string | undefined;
              const cfg = ps === 'completed'
                ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse', statusText: 'Settled' }
                : ps === 'failed'
                ? { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-400', statusText: 'Failed' }
                : { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400 animate-pulse', statusText: 'Pending' };
              return (
                <span
                  title={ps === 'failed' && failReason ? failReason : undefined}
                  className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-lg border backdrop-blur-md whitespace-nowrap ${cfg.bg} ${cfg.border} ${cfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="hidden sm:inline">Payout: </span>
                  <span>{cfg.statusText}</span>
                </span>
              );
            })()}
          </div>
        </div>


        {/* 2. Header Row: Avatar + Name & Property + Booking Type */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {/* Circle Avatar */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-base sm:text-lg md:text-xl shrink-0 overflow-hidden shadow-lg">
              {booking.guest?.avatar_url ? (
                <img
                  src={booking.guest.avatar_url}
                  alt={booking.guest?.name || 'Guest'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(booking.guest?.name?.trim() || 'G').charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Name & Property */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-heading font-black text-white leading-tight break-words">
                {booking.guest?.name?.trim() ? booking.guest.name : 'Verified Guest'}
              </h3>
              <p className="text-xs md:text-sm text-zinc-400 font-bold flex items-center gap-1.5 mt-0.5 break-words">
                <Icon name="HomeIcon" size={14} className="text-emerald-400/80 shrink-0" />
                <span className="opacity-90">{booking.properties?.title || booking.properties?.name || 'Property'}</span>
              </p>
            </div>
          </div>

          {/* Booking Type Pill Badge */}
          <div className="shrink-0 self-start sm:self-center mt-1 sm:mt-0">
            {booking.booking_type === 'bulk' ? (
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                Bulk {booking.bulk_booking_discount || booking.properties?.bulk_booking_discount ? `(${booking.bulk_booking_discount || booking.properties?.bulk_booking_discount}%)` : ''}
              </span>
            ) : (
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                NORMAL BOOKING
              </span>
            )}
          </div>
        </div>

        {/* 3. Middle Grid Section: 2 Columns Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* LEFT COLUMN: Guests/Rooms Box + Dates Box */}
          <div className="space-y-3 flex flex-col justify-between">
            {/* Guests & Room Box */}
            <div className="bg-[#0e131c]/80 border border-white/5 p-3 md:p-3.5 rounded-2xl flex items-center justify-around shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Icon name="UsersIcon" size={18} />
                </div>
                <div>
                  <span className="block text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">GUESTS</span>
                  <span className="block text-base md:text-lg font-black text-white">{booking.guests}</span>
                </div>
              </div>

              <div className="w-[1px] h-8 bg-white/10 mx-2" />

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Icon name="HomeModernIcon" size={18} />
                </div>
                <div>
                  <span className="block text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest">ROOM</span>
                  <span className="block text-base md:text-lg font-black text-white">{booking.total_rooms_booked || 1}</span>
                </div>
              </div>
            </div>

            {/* Check-In / Check-Out Box */}
            <div className="bg-[#0e131c]/80 border border-white/5 p-3 md:p-3.5 rounded-2xl flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Icon name="CalendarDaysIcon" size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                    <span>CHECK-IN</span>
                    <span>/</span>
                    <span>CHECK-OUT</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm font-black text-white tracking-wide">
                    <span>{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} {new Date(booking.check_in).getDate()}</span>
                    <span className="text-zinc-500">/</span>
                    <span>{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} {new Date(booking.check_out).getDate()}</span>
                    <span className="text-indigo-400/60 text-xs ml-1">{new Date(booking.check_out).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Booked Room Types Box + View Details Button */}
          <div className="flex flex-col justify-between space-y-3">
            {/* Booked Room Types Box */}
            <div className="bg-[#0e131c]/80 border border-emerald-500/20 p-3 md:p-3.5 rounded-2xl flex-1 flex flex-col justify-center space-y-1.5 shadow-inner min-h-[76px]">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Icon name="KeyIcon" size={13} className="text-emerald-400 shrink-0" />
                BOOKED ROOM TYPES
              </p>

              <div className="space-y-0.5">
                <p className="text-xs md:text-sm font-bold text-emerald-300">
                  {roomDetails.name}
                </p>
                {roomDetails.price && (
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                    <span className="text-sm md:text-base font-black text-white shrink-0">
                      {roomDetails.price}
                    </span>
                    <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      booking.status === 'cancelled'
                        ? hostPricing.hostPenaltyShare > 0
                          ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                          : 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                        : 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                    }`}>
                      {booking.status === 'cancelled'
                        ? hostPricing.hostPenaltyShare > 0
                          ? `Payout: +₹${hostPricing.hostPenaltyShare.toLocaleString('en-IN')}`
                          : 'Payout: Cancelled'
                        : `Payout: ₹${hostPricing.hostPayout.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* View Details Button */}
            <button
              onClick={() => setIsGuestDetailsModalOpen(true)}
              className="w-full py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99]"
            >
              <span>VIEW DETAILS</span>
              <Icon name="ChevronRightIcon" size={14} />
            </button>
          </div>
        </div>

        {/* 4. Action Buttons & Authorize/Reject */}
        {booking.status === 'pending' && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              disabled={isApproving || isRejecting}
              onClick={async () => {
                setIsApproving(true);
                try {
                  await approveBooking(booking.id);
                  toast.success('Successfully authorized the release!');
                } catch (err: any) {
                  toast.error('Failed to authorize release. Please try again.');
                } finally {
                  setIsApproving(false);
                }
              }}
              className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(52,211,153,0.1)] hover:shadow-[0_0_30px_rgba(52,211,153,0.2)] disabled:opacity-50"
            >
              {isApproving ? <Icon name="ArrowPathIcon" size={16} className="animate-spin" /> : <Icon name="CheckCircleIcon" size={16} />}
              <span>Authorize</span>
            </button>

            <button
              disabled={isApproving || isRejecting}
              onClick={() => {
                setConfirmModal({ isOpen: true, type: 'reject' });
              }}
              className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isRejecting ? <Icon name="ArrowPathIcon" size={16} className="animate-spin" /> : <Icon name="NoSymbolIcon" size={16} />}
              <span>Reject</span>
            </button>
          </div>
        )}

        {/* Bottom 4 Action Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
          <button
            onClick={() => onAction('unified-inbox', {
              guest_id: booking.guest_id,
              sender_name: booking.guest?.name || 'Verified Guest',
              sender_avatar: booking.guest?.avatar_url,
              property_id: booking.property_id,
              property_name: booking.properties?.title || booking.properties?.name || 'Property'
            })}
            className="px-3 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={14} /> <span>MESSAGE</span>
          </button>

          <button
            onClick={() => setIsDisputeModalOpen(true)}
            className="px-3 py-2.5 bg-zinc-800/60 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-red-400 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
          >
            <Icon name="ScaleIcon" size={14} /> <span>DISPUTE</span>
          </button>

          <button
            onClick={() => {
              if (guestIdDoc) setIsIdModalOpen(true);
              else toast.error('ID not uploaded.');
            }}
            className={`px-3 py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
              guestIdDoc ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-900/50 border-white/5 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Icon name="FingerPrintIcon" size={14} /> <span>ID</span>
          </button>

          <button
            onClick={handleDownloadInvoice}
            className="px-3 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-sky-900/10"
          >
            <Icon name="DocumentTextIcon" size={14} /> <span>INVOICE</span>
          </button>
        </div>
      </div>

      {/* Dispute Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isDisputeModalOpen && (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto" onClick={() => setIsDisputeModalOpen(false)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-[#0a0a0f] border border-red-500/20 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_100px_rgba(220,38,38,0.15)] overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex items-center gap-4 mb-8">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]">
                    <Icon name="ScaleIcon" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-black text-white drop-shadow-lg">Dispute Initiator</h3>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Target ID: {booking.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    const res = await createDispute({
                      booking_id: booking.id,
                      guest_id: booking.guest_id,
                      host_id: booking.properties?.host_id || '',
                      property_id: booking.property_id,
                      guestName: booking.guest?.name || 'Guest',
                      hostName: 'Current Host',
                      propertyName: booking.properties?.title || 'Property',
                      issueType,
                      description,
                      priority,
                    });

                    if (res.success) {
                      toast.success("Dispute escalation successfully recorded.");
                      setIsDisputeModalOpen(false);
                      setDescription('');
                    } else {
                      toast.error("Escalation failed: " + res.error);
                    }
                    setIsSubmitting(false);
                  }}
                  className="space-y-6 relative z-10"
                >
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dispute Classification</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-red-500/50 hover:border-white/30 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="Damage to property" className="bg-zinc-900">Physical Asset Damage</option>
                      <option value="House rules violation" className="bg-zinc-900">Policy Breach Configuration</option>
                      <option value="Extra guests without notice" className="bg-zinc-900">Unauthorized Occupancy</option>
                      <option value="Smoking/Noise complaints" className="bg-zinc-900">Environmental Disturbance</option>
                      <option value="Other" className="bg-zinc-900">Unclassified Anomaly</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tactical Assessment (Details)</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide a comprehensive breakdown of the incident..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-red-500/50 hover:border-white/30 transition-all font-medium placeholder:text-zinc-600 resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Severity Matrix</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${priority === p
                            ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)] scale-[1.02]'
                            : 'bg-white/5 border-transparent text-zinc-500 hover:text-white/80 hover:bg-white/10'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 mt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsDisputeModalOpen(false)}
                      className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !description.trim()}
                      className="w-full sm:w-auto px-8 py-3.5 bg-red-600/90 hover:bg-red-500 border border-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                    >
                      <Icon name={isSubmitting ? "ArrowPathIcon" : "BoltIcon"} size={16} className={isSubmitting ? "animate-spin" : ""} />
                      {isSubmitting ? 'Transmitting...' : 'Execute Escalation'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ID Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isIdModalOpen && (
            <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6" onClick={() => setIsIdModalOpen(false)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-auto md:h-[85vh] bg-[#0a0a0f] border border-white/10 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3.5 md:p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg">
                      <Icon name="FingerPrintIcon" size={18} className="text-emerald-400 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm md:text-lg leading-tight">Identity: {booking.guest?.name || 'Verified Guest'}</h3>
                      <p className="text-[7px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-0.5">
                        Secure Access Control • Encrypted
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsIdModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                  >
                    <Icon name="XMarkIcon" size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-10 flex items-center justify-center bg-[#050507]">
                  {(() => {
                    const url = guestIdDoc;
                    if (!url) return <p className="text-zinc-500 italic">No document available</p>;

                    const isPdf = url.includes('.pdf') || url.includes('pdf');

                    return (
                      <div className="relative w-full h-full flex items-center justify-center group">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] pointer-events-none" />
                        {isPdf ? (
                          <iframe
                            src={url}
                            className="w-full h-full rounded-xl border border-white/10 relative z-10 bg-white"
                            title="ID Document PDF"
                          />
                        ) : (
                          <img
                            src={url}
                            alt="Guest ID Proof"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10 relative z-10"
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="p-3.5 md:p-6 bg-black/60 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-emerald-400/60 font-medium text-[11px] uppercase tracking-widest">
                    <Icon name="ShieldCheckIcon" size={14} />
                    <span>Secure Host Access Protocol</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                    {guestIdDoc && (
                      <a
                        href={guestIdDoc}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 md:gap-2"
                      >
                        <Icon name="ArrowDownTrayIcon" size={14} className="md:w-4 md:h-4" />
                        Download
                      </a>
                    )}
                    <button
                      onClick={() => setIsIdModalOpen(false)}
                      className="flex-1 sm:flex-none px-4 md:px-8 py-2.5 md:py-3 bg-white hover:bg-zinc-200 text-black rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Confirmation Modal */}
      <ActionConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={async () => {
          const type = confirmModal.type;
          setConfirmModal({ isOpen: false, type: null });
          
          setIsRejecting(true);
          try {
            await rejectBooking(booking.id);
            toast.success(type === 'reject' ? 'Booking rejected successfully.' : 'Booking cancelled.');
          } catch (err: any) {
            toast.error(type === 'reject' ? 'Failed to reject booking.' : 'Cancellation failed.');
          } finally {
            setIsRejecting(false);
          }
        }}
        title={confirmModal.type === 'reject' ? "Reject Reservation?" : "Cancel Reservation?"}
        description={confirmModal.type === 'reject' 
          ? "Are you sure you want to reject this booking? This will notify the guest and release the dates."
          : "Are you sure you want to cancel this confirmed booking? This may impact your hosting metrics."
        }
        confirmLabel={confirmModal.type === 'reject' ? "Reject" : "Cancel"}
        variant="warning"
      />

      {/* Guest Details & Price Breakdown Modal */}
      <GuestDetailsModal
        userId={booking.guest_id}
        isOpen={isGuestDetailsModalOpen}
        onClose={() => setIsGuestDetailsModalOpen(false)}
        booking={booking}
      />
    </div>
  );
};

export default BookingCard;
