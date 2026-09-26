'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PersonalInfo, UserVerificationStatus, Booking } from '@/lib/types';
import { getGuestProfileForHost } from '@/lib/guest-actions';
import { calculateRefundDistribution } from '@/lib/refund-policy';
import { format, addDays } from 'date-fns';
import { createPortal } from 'react-dom';

interface GuestDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking;
}

const computePricing = (booking?: Booking) => {
  if (!booking) return null;

  const isCancelled = booking.status === 'cancelled';
  const nights = Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)));
  const totalAmount = Number(booking.total_price || 0);
  const isBulkBooking = booking.booking_type === 'bulk';
  const discountPct = isBulkBooking ? ((booking.bulk_booking_discount || (booking as any).properties?.bulk_booking_discount || 0) / 100) : 0;
  const amenitiesTotal = (booking as any).amenities?.reduce((sum: number, a: any) => sum + (a.price * a.count), 0) || 0;
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

  // Derive net accommodation directly from booking financial reality (totalAmount = (accommodation * (1 - discount) + amenities) * 1.1 + freeCancellation)
  const netAccommodationFromTotal = totalAmount > 0
    ? Math.round((Math.max(0, totalAmount - amenitiesTotal - freeCancellationFee) / 1.1) / (discountPct < 1 ? (1 - discountPct) : 1))
    : 0;

  // If baseAccommodation wasn't in room_type or heavily deviates from totalAmount (e.g. stale standard_price fallback)
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

  // Host Set Property Amount (Listing price set by host)
  const hostBaseAmount = baseAccommodation;
  const hostGrossAmount = hostBaseAmount + amenitiesTotal;
  const hostCommission = Math.round(hostGrossAmount * 0.10);
  const hostEarnings = Math.max(0, hostGrossAmount - hostCommission);

  let refundInfo = null;
  let cancelDateObj = new Date();
  if (isCancelled) {
    cancelDateObj = booking.cancelled_at ? new Date(booking.cancelled_at) : new Date(booking.created_at || Date.now());
    refundInfo = calculateRefundDistribution(
      totalAmount,
      booking.check_in,
      cancelDateObj,
      booking.created_at,
      booking.has_free_cancellation,
      freeCancellationFee
    );
  }

  const formatDateShort = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const checkInShort = formatDateShort(booking.check_in);
  const checkOutShort = formatDateShort(booking.check_out);
  const dateRangeStr = `${checkInShort} – ${new Date(booking.check_out).getDate()}`;

  const cancelDateFormatted = format(cancelDateObj, 'dd MMM');
  const refundInitiatedDateFormatted = format(cancelDateObj, 'dd MMM');
  const estimatedCreditRangeFormatted = `${format(addDays(cancelDateObj, 2), 'dd MMM')} - ${format(addDays(cancelDateObj, 7), 'dd MMM')}`;

  return {
    isCancelled,
    nights,
    totalAmount,
    baseAccommodation,
    hostBaseAmount,
    hostGrossAmount,
    hostCommission,
    hostEarnings,
    amenitiesTotal,
    refundInfo,
    dateRangeStr,
    checkInShort,
    checkOutShort,
    cancelDateFormatted,
    refundInitiatedDateFormatted,
    estimatedCreditRangeFormatted
  };
};

const GuestDetailsModal: React.FC<GuestDetailsModalProps> = ({ userId, isOpen, onClose, booking }) => {
  const [activeTab, setActiveTab] = useState<'price_details' | 'guest_profile'>('price_details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState<User | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [verifications, setVerifications] = useState<UserVerificationStatus | null>(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('price_details');
      if (userId) {
        fetchGuestDetails();
      }
    }
  }, [isOpen, userId]);

  const fetchGuestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getGuestProfileForHost(userId);
      
      if (result.success && result.data) {
        setGuest(result.data.guest);
        setPersonalInfo(result.data.personalInfo);
        setVerifications(result.data.verifications);
        setBookingCount(result.data.bookingCount);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching guest details:', error);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const pricing = computePricing(booking);

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        {/* Backdrop Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 pointer-events-none"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-[1.8rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl my-auto max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Glow Decoration */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500/20 via-emerald-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 p-4 sm:p-8 overflow-y-auto flex-1 max-h-[75vh] space-y-6 scrollbar-thin">
            
            {/* Top Tab Bar Navigation */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('price_details')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'price_details'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon name="BanknotesIcon" size={14} />
                <span>Price Details</span>
              </button>
              <button
                onClick={() => setActiveTab('guest_profile')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'guest_profile'
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon name="UserIcon" size={14} />
                <span>Guest Profile</span>
              </button>
            </div>

            {/* TAB 1: HOST PAYOUT & COMMISSION DETAILS */}
            {activeTab === 'price_details' && pricing && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Price details</h2>
                  {pricing.isCancelled ? (
                    <span className="text-xs text-rose-400 font-bold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center gap-1.5">
                      <Icon name="XCircleIcon" size={14} className="text-rose-400" />
                      Cancelled Booking
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      {pricing.nights} {pricing.nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  )}
                </div>

                {pricing.isCancelled ? (
                  <div className="space-y-4">
                    {/* 1. ADMIN TO HOST PAYOUT & SETTLEMENT TIMELINE */}
                    <div className="bg-[#111422] border border-white/10 rounded-xl p-3 sm:p-3.5 shadow-lg space-y-3">
                      {/* Card Header: Admin to Host Payout & Guest Info */}
                      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                              Admin to Host Payout :{' '}
                              <span className={`font-bold font-mono text-sm sm:text-base ${
                                (pricing.refundInfo?.hostShare || 0) > 0 ? 'text-amber-400' : 'text-zinc-400'
                              }`}>
                                ₹{(pricing.refundInfo?.hostShare || 0).toLocaleString('en-IN')}
                              </span>
                            </span>
                            <div className="relative group cursor-pointer text-zinc-400 hover:text-white transition-colors" title="Penalty compensation transferred from Admin to Host">
                              <Icon name="InformationCircleIcon" size={14} className="text-amber-400/80" />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 flex-wrap font-medium">
                            <span className="flex items-center gap-1">
                              <Icon name="UserIcon" size={12} className="text-zinc-500 shrink-0" />
                              <span>Guest: <strong className="text-zinc-200">{guest?.name || 'All Guests'}</strong></span>
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">
                              Status: <strong className="text-rose-400 font-mono">Cancelled</strong>
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 shrink-0">
                          Cancelled
                        </span>
                      </div>

                      {/* 3-Step Horizontal Stepper for Host Settlement */}
                      <div className="py-1 px-1 sm:px-2">
                        <div className="relative flex items-start justify-between">
                          {/* Connecting Progress Line (Behind circles) */}
                          <div className="absolute top-3 sm:top-3.5 left-[16%] right-[16%] h-[2px] bg-zinc-700/60 -z-0">
                            {/* Progress fill from Step 1 to Step 2 */}
                            <div className={`h-full ${(pricing.refundInfo?.hostShare || 0) > 0 ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'} w-1/2 transition-all duration-500`} />
                          </div>

                          {/* Step 1: Cancelled */}
                          <div className="relative z-10 flex flex-col items-center text-center w-1/3">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-[0_0_10px_rgba(16,185,129,0.4)] border-2 border-[#111422]">
                              <Icon name="CheckIcon" size={12} />
                            </div>
                            <p className="text-[11px] sm:text-xs font-semibold text-emerald-400 mt-1.5 leading-tight">
                              Cancelled
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-medium">
                              {pricing.cancelDateFormatted}
                            </p>
                          </div>

                          {/* Step 2: Compensation / Payout Initiated */}
                          <div className="relative z-10 flex flex-col items-center text-center w-1/3">
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${(pricing.refundInfo?.hostShare || 0) > 0 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'} text-white flex items-center justify-center font-bold text-[10px] sm:text-xs border-2 border-[#111422]`}>
                              <Icon name="CheckIcon" size={12} />
                            </div>
                            <p className="text-[11px] sm:text-xs font-semibold text-zinc-200 mt-1.5 leading-tight">
                              {(pricing.refundInfo?.hostShare || 0) > 0 ? 'Payout Initiated' : 'Refund Processed'}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-medium">
                              {pricing.refundInitiatedDateFormatted}
                            </p>
                          </div>

                          {/* Step 3: Credited to account */}
                          <div className="relative z-10 flex flex-col items-center text-center w-1/3">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-600 flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm">
                              3
                            </div>
                            <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 mt-1.5 leading-tight">
                              {(pricing.refundInfo?.hostShare || 0) > 0 ? 'Credited to Bank' : 'Completed'}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5 font-medium whitespace-nowrap">
                              {(pricing.refundInfo?.hostShare || 0) > 0 ? pricing.estimatedCreditRangeFormatted : 'No Host Share'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. CANCELLED BOOKING BREAKDOWN */}
                    <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                      {/* Accommodation Rate / Value */}
                      <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                        <div className="flex flex-col">
                          <span className="text-zinc-200">Accommodation Value</span>
                          <span className="text-xs text-zinc-500 font-normal">
                            {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'} · {pricing.dateRangeStr}
                          </span>
                        </div>
                        <span className="font-bold text-white text-base sm:text-lg">
                          ₹{pricing.hostBaseAmount.toLocaleString('en-IN')}.00
                        </span>
                      </div>

                      {/* Cancellation Policy */}
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-zinc-300">Cancellation Policy</span>
                          <span className="text-xs text-zinc-500 font-normal">{pricing.refundInfo?.appliedPolicy || 'Standard Policy'}</span>
                        </div>
                        <span className="font-bold text-rose-400 text-xs sm:text-sm">Cancelled</span>
                      </div>

                      {/* Guest Refund */}
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-zinc-300">Refund to Guest ({pricing.refundInfo?.guestRefundPercent || 100}%)</span>
                          <span className="text-xs text-zinc-500 font-normal">
                            {pricing.refundInfo?.guestRefundPercent || 100}% of ₹{pricing.hostBaseAmount.toLocaleString('en-IN')} accommodation returned to guest
                          </span>
                        </div>
                        <span className="font-bold text-emerald-400 text-sm sm:text-base font-mono">
                          ₹{(pricing.refundInfo?.guestRefundAmount || pricing.totalAmount).toLocaleString('en-IN')}.00
                        </span>
                      </div>

                      {/* Host Share from Penalty if any */}
                      {pricing.refundInfo && pricing.refundInfo.hostShare > 0 ? (
                        <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold pt-2 border-t border-white/10">
                          <div className="flex flex-col">
                            <span className="text-amber-300">Host Penalty Compensation</span>
                            <span className="text-xs text-zinc-500 font-normal">
                              50% share of retained penalty (₹{Math.max(0, pricing.hostBaseAmount - (pricing.refundInfo?.guestRefundAmount || 0)).toLocaleString('en-IN')} × 50%)
                            </span>
                          </div>
                          <span className="font-bold text-amber-400 text-sm sm:text-base font-mono">
                            +₹{pricing.refundInfo.hostShare.toLocaleString('en-IN')}.00
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 text-sm font-semibold pt-2 border-t border-white/5">
                          <span className="text-zinc-400">Host Compensation</span>
                          <span className="font-bold text-zinc-500 text-sm">₹0.00 (100% Refunded to Guest)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ACTIVE / CONFIRMED BOOKING BREAKDOWN */
                  <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                    {/* Total Booking Amount (Host Set Rate) */}
                    <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                      <div className="flex flex-col">
                        <span className="text-zinc-200">Total Booking Amount</span>
                        <span className="text-xs text-zinc-500 font-normal">
                          {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'} · {pricing.dateRangeStr}
                        </span>
                      </div>
                      <span className="font-bold text-white text-base sm:text-lg">
                        ₹{pricing.hostBaseAmount.toLocaleString('en-IN')}.00
                      </span>
                    </div>

                    {/* Exclusive Upgrades if any */}
                    {pricing.amenitiesTotal > 0 && (
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold pt-2 border-t border-white/5">
                        <span className="text-zinc-300">Add-on Upgrades</span>
                        <span className="font-bold text-white">₹{pricing.amenitiesTotal.toLocaleString('en-IN')}.00</span>
                      </div>
                    )}

                    {/* Host Commission Cut */}
                    <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold pt-2 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="text-zinc-200">Host Commission (10%)</span>
                        <span className="text-xs text-zinc-500 font-normal">Platform fee deducted from booking</span>
                      </div>
                      <span className="font-bold text-rose-400 text-sm sm:text-base">
                        -₹{pricing.hostCommission.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>
                )}

                {/* HOST NET EARNINGS / PAYOUT BOX */}
                {pricing.isCancelled ? (
                  pricing.refundInfo && pricing.refundInfo.hostShare > 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
                      <div>
                        <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Icon name="BanknotesIcon" size={15} />
                          Cancellation Compensation (Host Share)
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">Penalty compensation credited under cancellation policy</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl sm:text-3xl font-black text-amber-400">
                          ₹{pricing.refundInfo.hostShare.toLocaleString('en-IN')}.00
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
                      <div>
                        <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Icon name="XCircleIcon" size={15} />
                          Host Net Payout: Cancelled
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">Guest cancelled before check-in. No payout credited.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl sm:text-3xl font-black text-zinc-400">
                          ₹0.00
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon name="BanknotesIcon" size={15} />
                        Host Net Earnings (Your Payout)
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">Amount credited after commission deduction</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                        ₹{pricing.hostEarnings.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GUEST PROFILE */}
            {activeTab === 'guest_profile' && (
              loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-xs sm:text-sm font-medium animate-pulse">Fetching guest profile...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Icon name="ExclamationTriangleIcon" size={28} className="text-red-500" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-base sm:text-lg font-bold text-white">Guest Not Found</h2>
                    <p className="text-xs text-zinc-400 max-w-[250px] mx-auto leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Profile Header */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5 pt-2 sm:pt-0">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                        {guest?.avatar_url ? (
                          <img src={guest.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="UserIcon" size={32} className="text-zinc-600" />
                        )}
                      </div>
                      {verifications?.isIdVerified && (
                        <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-lg border-2 border-[#0a0a0f] shadow-lg">
                          <Icon name="CheckBadgeIcon" size={12} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl font-heading font-black text-white break-words">{guest?.name || 'Guest User'}</h2>
                      <p className="text-xs sm:text-sm text-zinc-400 font-medium break-all">{guest?.email}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          {guest?.role || 'Guest'}
                        </span>
                        <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border ${
                          guest?.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }`}>
                          {guest?.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                    <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Location</p>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">{personalInfo?.location || 'Not provided'}</p>
                    </div>

                    <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Nationality</p>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">{personalInfo?.nationality || 'Not specified'}</p>
                    </div>

                    <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Bookings</p>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">{bookingCount} Bookings</p>
                    </div>

                    <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Languages</p>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
                        {personalInfo?.languages && personalInfo.languages.length > 0 
                          ? personalInfo.languages.join(', ') 
                          : 'English'}
                      </p>
                    </div>
                  </div>

                  {/* Bio Section */}
                  {personalInfo?.bio && (
                    <div className="p-4 sm:p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                      <p className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Icon name="ChatBubbleBottomCenterTextIcon" size={12} />
                        About this guest
                      </p>
                      <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 italic break-words">
                        "{personalInfo.bio}"
                      </p>
                    </div>
                  )}

                  {/* Verification Status */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Trust & Verification</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 p-3 bg-white/5 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="EnvelopeIcon" size={16} className="text-zinc-500 shrink-0" />
                          <span className="text-xs sm:text-sm text-zinc-200 font-medium truncate">Email Address</span>
                        </div>
                        {verifications?.isEmailVerified ? (
                          <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                            Verified <Icon name="CheckCircleIcon" size={13} />
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0">Unverified</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 p-3 bg-white/5 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="PhoneIcon" size={16} className="text-zinc-500 shrink-0" />
                          <span className="text-xs sm:text-sm text-zinc-200 font-medium truncate">Phone Number</span>
                        </div>
                        {verifications?.isPhoneVerified ? (
                          <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                            Verified <Icon name="CheckCircleIcon" size={13} />
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0">Unverified</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 p-3 bg-white/5 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="IdentificationIcon" size={16} className="text-zinc-500 shrink-0" />
                          <span className="text-xs sm:text-sm text-zinc-200 font-medium truncate">Identity Document</span>
                        </div>
                        {verifications?.isIdVerified ? (
                          <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                            Verified <Icon name="CheckCircleIcon" size={13} />
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0">Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Bottom Clear / Close Button */}
          <div className="relative z-10 p-4 sm:px-8 sm:py-4 border-t border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md">
            <button
              onClick={onClose}
              type="button"
              className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.99] border border-white/15 text-white font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:border-white/30"
            >
              Clear
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default GuestDetailsModal;
