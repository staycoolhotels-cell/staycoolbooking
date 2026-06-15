'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Booking } from '@/lib/types';
import { approveBooking, rejectBooking } from '@/lib/booking-actions';
import { useState } from 'react';
import { generateInvoicePDF } from '@/lib/pdf-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createDispute } from '@/lib/dispute-actions';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import ActionConfirmModal from '@/components/ui/ActionConfirmModal';


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

  const handleDownloadInvoice = async () => {
    try {
      const nights = Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)));
      const discountPct = (booking.bulk_booking_discount || (booking as any).properties?.bulk_booking_discount || 0) / 100;

      const displayRoomType = (() => {
        if (booking.room_type) return booking.room_type;
        const totalRooms = booking.total_rooms_booked || 1;
        const propertyRoomTypes = (booking.properties as any)?.room_types || 
                              ((booking.properties as any)?.room_type_counts 
                                ? Object.keys((booking.properties as any).room_type_counts) 
                                : []);
        const standardPrice = booking.properties?.standard_price || booking.properties?.price || 0;
        if (propertyRoomTypes.length > 0) {
            return `${propertyRoomTypes[0]} (${totalRooms})${standardPrice ? ` ₹${Number(standardPrice).toLocaleString('en-IN')}` : ''}`;
        }
        return `Standard Room (${totalRooms})${standardPrice ? ` ₹${Number(standardPrice).toLocaleString('en-IN')}` : ''}`;
      })();

      // Compute pre-discount base from room_type breakdown × nights
      let baseAccommodationFromRoomType = 0;
      if (displayRoomType) {
        displayRoomType.split(', ').forEach((type) => {
            const match = type.match(/^(.*)\s\((\d+)\)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
            const count = match ? parseInt(match[2]) : 1;
            const pricePerUnit = match && match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
            baseAccommodationFromRoomType += count * pricePerUnit * nights;
        });
      }

      // Amenities & Cancellation Fee
      const amenitiesTotalFromBooking = (booking as any).amenities?.reduce((sum: number, amenity: any) => sum + (amenity.price * amenity.count), 0) || 0;
      const freeCancellationFee = booking.free_cancellation_fee || 0;

      let baseAccommodation = 0;
      let serviceFee = 0;
      let discountSavings = 0;

      // Source of truth for display: room breakdown if available, else reverse-engineer from total_price
      if (baseAccommodationFromRoomType > 0) {
        baseAccommodation = baseAccommodationFromRoomType;
        serviceFee = Math.round(baseAccommodation * 0.1);
        discountSavings = Math.round(baseAccommodation * discountPct);
      } else {
        // Reverse engineer from total_price
        const accommodationAndFee = booking.total_price - amenitiesTotalFromBooking - freeCancellationFee;
        baseAccommodation = Math.round(accommodationAndFee / (1.1 - discountPct));
        serviceFee = Math.round(baseAccommodation * 0.1);
        discountSavings = Math.round(baseAccommodation * discountPct);
      }

      const accommodationSubtotal = Math.round(baseAccommodation + serviceFee - discountSavings) + freeCancellationFee;
      const dynamicAmenitiesTotal = booking.total_price - accommodationSubtotal;
      const amenitiesTotal = dynamicAmenitiesTotal > 0 ? dynamicAmenitiesTotal : amenitiesTotalFromBooking;

      const computedBreakdown = {
        accommodation: baseAccommodation,
        service_fee: serviceFee,
        taxes: 0,
        discount: booking.booking_type === 'bulk' ? discountSavings : 0,
        upgrades: amenitiesTotal,
        cancellation_fee: freeCancellationFee
      };

      const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const transactionData = {
        id: booking.id,
        invoice_id: booking.id.slice(0, 8).toUpperCase(),
        amount: booking.total_price,
        date: formatDate(booking.created_at),
        status: booking.status,
        type: (booking.status === 'cancelled' || booking.status === 'refunded') ? 'refund' : 'payment',
        guestName: booking.guest?.name || 'Valued Guest',
        guestAddress: (booking.guest as any)?.email || 'Address not provided',
        propertyName: booking.properties?.title || booking.properties?.name || 'Property',
        booking_id: booking.id,
        room_type: displayRoomType,
        paymentMethod: 'Razorpay',
        breakdown: computedBreakdown
      };

      await generateInvoicePDF(transactionData as any);
      toast.success('Invoice generated successfully.');
    } catch (err) {
      console.error('Invoice generation failed:', err);
      toast.error('Failed to generate invoice. Please try again.');
    }
  };

  const displayRoomTypes = (() => {
    if (booking.room_type) return booking.room_type;
    
    const totalRooms = booking.total_rooms_booked || 1;
    const propertyRoomTypes = (booking.properties as any)?.room_types || 
                          ((booking.properties as any)?.room_type_counts 
                            ? Object.keys((booking.properties as any).room_type_counts) 
                            : []);
                            
    if (propertyRoomTypes.length > 0) {
      return `${propertyRoomTypes[0]} (${totalRooms})`;
    }
    return `Standard Room (${totalRooms})`;
  })();

  return (
    <div className="relative group overflow-hidden bg-[#0a0a0f] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-all duration-500">

      {/* Animated Top Border Glow */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${statusStyles.glow}`} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-5 md:p-8 gap-6 relative z-10">
        {/* Left: Guest & Property & Dates */}
        <div className="flex flex-row flex-nowrap items-center sm:items-start gap-4 md:gap-6 flex-1 min-w-0">
          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-all bg-zinc-900 shadow-2xl relative">
              {booking.guest?.avatar_url ? (
                <img
                  src={booking.guest.avatar_url}
                  alt={booking.guest?.name || 'Guest'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="UserIcon" size={24} className="text-zinc-600" />
              )}
              {/* Subtle Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            {/* Status Dot */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0a0a0f] rounded-lg flex items-center justify-center border border-white/10 shadow-lg">
              <div className={`w-2.5 h-2.5 rounded-full ${statusStyles.indicator}`} />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h3 className="text-lg md:text-xl font-heading font-black text-white truncate tracking-tight">
                  {booking.guest?.name?.trim() ? booking.guest.name : 'Verified Guest'}
                </h3>
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg border backdrop-blur-xl shrink-0 ${statusStyles.bg} ${statusStyles.border} ${statusStyles.text} ${statusStyles.shadow}`}>
                  {booking.status.replace('_', ' ')}
                </span>
                {booking.booking_type === 'bulk' ? (
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                    Bulk {booking.bulk_booking_discount || booking.properties?.bulk_booking_discount ? `(${booking.bulk_booking_discount || booking.properties?.bulk_booking_discount}%)` : ''}
                  </span>
                ) : (
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    Normal Booking
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <p className="text-xs md:text-sm text-zinc-400 font-bold truncate flex items-center gap-2">
                  <Icon name="HomeIcon" size={14} className="text-indigo-400/70 shrink-0" /> 
                  <span className="truncate opacity-80">{booking.properties?.title || booking.properties?.name || 'Property'}</span>
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Icon name="UsersIcon" size={14} className="text-indigo-400/70" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Icon name="HomeModernIcon" size={14} className="text-indigo-400/70" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{booking.total_rooms_booked || 1} {(booking.total_rooms_booked || 1) === 1 ? 'Room' : 'Rooms'}</span>
                  </div>
                  {booking.properties?.type && (
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Icon name="TagIcon" size={14} className="text-indigo-400/70" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {booking.properties.type.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booked Room Types */}
            {displayRoomTypes && (
              <div className="mt-3 py-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 w-fit max-w-full">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Icon name="KeyIcon" size={11} className="text-emerald-400 shrink-0" />
                  Booked Room Types
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayRoomTypes.split(', ').map((room: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      {room}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Premium Amenities */}
            {(booking as any).amenities && (booking as any).amenities.length > 0 && (
              <div className="mt-3 py-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 w-fit max-w-full">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Icon name="SparklesIcon" size={11} className="text-indigo-400 shrink-0" />
                  Exclusive Upgrades
                </p>
                <div className="flex flex-wrap gap-2">
                  {(booking as any).amenities.map((amenity: any, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      {amenity.name} (Qty: {amenity.count})
                    </span>
                  ))}
                </div>
              </div>
            )}


            {/* Date Container */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 py-2 px-3 rounded-xl w-fit shadow-inner group-hover:bg-white/[0.05] transition-colors">
              <Icon name="CalendarDaysIcon" size={14} className="text-indigo-400/80 shrink-0" />
              <div suppressHydrationWarning className="flex items-center gap-2.5 text-white font-bold uppercase tracking-widest leading-none">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] md:text-[9px] text-zinc-500 font-black mb-0.5">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                  <span className="text-sm md:text-base text-white font-black">{new Date(booking.check_in).getDate()}</span>
                </div>
                <span className="text-zinc-700 font-light mx-0.5">/</span>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] md:text-[9px] text-zinc-500 font-black mb-0.5">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                  <span className="text-sm md:text-base text-white font-black">{new Date(booking.check_out).getDate()}</span>
                </div>
                <span className="text-indigo-400/40 font-black ml-1.5 text-[10px] md:text-[11px] self-end mb-0.5">{new Date(booking.check_out).getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-3 shrink-0 lg:pl-8 lg:border-l border-white/5">
          {booking.status === 'pending' && (
            <div className="grid grid-cols-2 gap-2 w-full lg:w-auto">
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

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => onAction('unified-inbox', {
                guest_id: booking.guest_id,
                sender_name: booking.guest?.name || 'Verified Guest',
                sender_avatar: booking.guest?.avatar_url,
                property_id: booking.property_id,
                property_name: booking.properties?.title || booking.properties?.name || 'Property'
              })}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={14} /> <span>Message</span>
            </button>

            {booking.status === 'confirmed' && (
              <button
                disabled={isRejecting}
                onClick={() => {
                  setConfirmModal({ isOpen: true, type: 'cancel' });
                }}

                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
              >
                <Icon name="NoSymbolIcon" size={14} /> <span>Cancel</span>
              </button>
            )}

            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 text-zinc-500 hover:text-red-400 rounded-xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
            >
              <Icon name="ScaleIcon" size={14} /> <span>Dispute</span>
            </button>

            <button
              onClick={() => {
                if (guestIdDoc) setIsIdModalOpen(true);
                else toast.error('ID not uploaded.');
              }}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border font-bold text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                guestIdDoc ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900/50 border-white/5 text-zinc-700 cursor-not-allowed'
              }`}
            >
              <Icon name="FingerPrintIcon" size={14} /> <span>ID</span>
            </button>

            <button
              onClick={handleDownloadInvoice}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 rounded-xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-lg shadow-sky-900/10"
            >
              <Icon name="DocumentTextIcon" size={14} /> <span>Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dispute Modal (Ultra-Premium) */}
      {mounted && createPortal(
        <AnimatePresence>
          {isDisputeModalOpen && (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto" onClick={() => setIsIdModalOpen(false)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-[#0a0a0f] border border-red-500/20 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_100px_rgba(220,38,38,0.15)] overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Deep Ambient Glow */}
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
    </div>

  );
};

export default BookingCard;
