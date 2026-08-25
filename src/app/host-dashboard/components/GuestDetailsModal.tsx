'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PersonalInfo, UserVerificationStatus, Booking } from '@/lib/types';
import { getGuestProfileForHost } from '@/lib/guest-actions';
import { createPortal } from 'react-dom';

interface GuestDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking;
}

const computePricing = (booking?: Booking) => {
  if (!booking) return null;

  const nights = Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)));
  const totalAmount = Number(booking.total_price || 0);
  const discountPct = (booking.bulk_booking_discount || (booking as any).properties?.bulk_booking_discount || 0) / 100;
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

  if (baseAccommodation === 0) {
    const netAccommodation = Math.max(0, totalAmount - amenitiesTotal - freeCancellationFee);
    baseAccommodation = Math.round(netAccommodation / (1.1 - discountPct));
  }

  const taxesAndServiceFee = Math.round(baseAccommodation * 0.1);
  const discountSavings = Math.round(baseAccommodation * discountPct);
  const originalAccommodation = baseAccommodation + discountSavings;
  const avgRatePerNight = nights > 0 ? Math.round(baseAccommodation / nights) : baseAccommodation;
  const origRatePerNight = nights > 0 ? Math.round(originalAccommodation / nights) : originalAccommodation;

  // Host Net Earnings = Total Paid by Guest - Platform Service Fee
  const hostEarnings = Math.max(0, totalAmount - taxesAndServiceFee);

  const formatDateShort = (dStr: string) => {
    const d = new Date(dStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const checkInShort = formatDateShort(booking.check_in);
  const checkOutShort = formatDateShort(booking.check_out);
  const dateRangeStr = `${checkInShort} – ${new Date(booking.check_out).getDate()}`;

  return {
    nights,
    totalAmount,
    baseAccommodation,
    originalAccommodation,
    taxesAndServiceFee,
    discountSavings,
    avgRatePerNight,
    origRatePerNight,
    amenitiesTotal,
    freeCancellationFee,
    hostEarnings,
    dateRangeStr,
    checkInShort,
    checkOutShort
  };
};

const GuestDetailsModal: React.FC<GuestDetailsModalProps> = ({ userId, isOpen, onClose, booking }) => {
  const [activeTab, setActiveTab] = useState<'price_details' | 'price_breakdown' | 'guest_profile'>('price_details');
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

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
          >
            <Icon name="XMarkIcon" size={18} />
          </button>

          <div className="relative z-10 p-4 sm:p-8 overflow-y-auto max-h-[85vh] space-y-6 scrollbar-thin">
            
            {/* Top Tab Bar Navigation */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('price_details')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'price_details' || activeTab === 'price_breakdown'
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

            {/* TAB 1: PRICE DETAILS (Image 1) */}
            {activeTab === 'price_details' && pricing && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Price details</h2>

                <div className="space-y-5">
                  {/* Nightly Accommodation */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                      <span className="text-zinc-200">
                        {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'} x ₹{pricing.avgRatePerNight.toLocaleString('en-IN')}.00
                      </span>
                      <div className="text-right">
                        {pricing.discountSavings > 0 && (
                          <span className="line-through text-zinc-500 mr-2 text-xs sm:text-sm">
                            ₹{pricing.originalAccommodation.toLocaleString('en-IN')}.00
                          </span>
                        )}
                        <span className="font-bold text-white">
                          ₹{pricing.baseAccommodation.toLocaleString('en-IN')}.00
                        </span>
                      </div>
                    </div>
                    {pricing.discountSavings > 0 && (
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Discount ({booking?.bulk_booking_discount || booking?.properties?.bulk_booking_discount || 10}%) applied for these dates.
                      </p>
                    )}
                  </div>

                  {/* Exclusive Upgrades if any */}
                  {pricing.amenitiesTotal > 0 && (
                    <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                      <span className="text-zinc-200">Exclusive Upgrades</span>
                      <span className="font-bold text-white">₹{pricing.amenitiesTotal.toLocaleString('en-IN')}.00</span>
                    </div>
                  )}

                  {/* Taxes / Service Fee */}
                  <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                    <span className="text-zinc-200">Service Fee / Taxes</span>
                    <span className="font-bold text-white">₹{pricing.taxesAndServiceFee.toLocaleString('en-IN')}.00</span>
                  </div>

                  {/* Total Paid by Guest */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between gap-3 text-base sm:text-lg font-bold">
                      <span className="text-white">Total <span className="underline decoration-1 underline-offset-4 font-normal">INR</span> (Guest Paid)</span>
                      <span className="text-xl sm:text-2xl font-black text-white">₹{pricing.totalAmount.toLocaleString('en-IN')}.00</span>
                    </div>
                  </div>

                  {/* HOST NET EARNINGS / PAYOUT BOX */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between mt-3 shadow-lg">
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon name="BanknotesIcon" size={14} />
                        Host Net Earnings (Your Payout)
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">Amount credited after service fee deduction</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-emerald-400">
                        ₹{pricing.hostEarnings.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>

                  {/* Link to Price breakdown */}
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('price_breakdown')}
                      className="text-sm font-bold text-white underline underline-offset-4 hover:text-emerald-400 transition-colors"
                    >
                      Price breakdown
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRICE BREAKDOWN (Image 2) */}
            {activeTab === 'price_breakdown' && pricing && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Price breakdown</h2>

                <div className="space-y-5">
                  {/* Date Range & Nights */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                      <span className="text-zinc-200">
                        {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'} · {pricing.dateRangeStr}
                      </span>
                      <div className="text-right">
                        {pricing.discountSavings > 0 && (
                          <span className="line-through text-zinc-500 mr-2 text-xs sm:text-sm">
                            ₹{pricing.originalAccommodation.toLocaleString('en-IN')}.00
                          </span>
                        )}
                        <span className="font-bold text-white">
                          ₹{pricing.baseAccommodation.toLocaleString('en-IN')}.00
                        </span>
                      </div>
                    </div>
                    {pricing.discountSavings > 0 && (
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Discount ({booking?.bulk_booking_discount || booking?.properties?.bulk_booking_discount || 10}%) applied for these dates.
                      </p>
                    )}
                  </div>

                  {/* Taxes / Service Fee */}
                  <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                    <span className="text-zinc-200 underline underline-offset-4">Taxes & Service Fee</span>
                    <span className="font-bold text-white">₹{pricing.taxesAndServiceFee.toLocaleString('en-IN')}.00</span>
                  </div>

                  {/* Exclusive Upgrades if any */}
                  {pricing.amenitiesTotal > 0 && (
                    <div className="flex items-center justify-between gap-3 text-sm sm:text-base font-semibold">
                      <span className="text-zinc-200">Upgrades</span>
                      <span className="font-bold text-white">₹{pricing.amenitiesTotal.toLocaleString('en-IN')}.00</span>
                    </div>
                  )}

                  {/* Total Paid by Guest */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between gap-3 text-base sm:text-lg font-bold">
                      <span className="text-white">Total <span className="underline decoration-1 underline-offset-4 font-normal">INR</span> (Guest Paid)</span>
                      <span className="text-xl sm:text-2xl font-black text-white">₹{pricing.totalAmount.toLocaleString('en-IN')}.00</span>
                    </div>
                  </div>

                  {/* HOST NET EARNINGS / PAYOUT BOX */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between mt-3 shadow-lg">
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon name="BanknotesIcon" size={14} />
                        Host Net Earnings (Your Payout)
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">Amount credited after service fee deduction</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-emerald-400">
                        ₹{pricing.hostEarnings.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>

                  {/* Link to Price details */}
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('price_details')}
                      className="text-sm font-bold text-white underline underline-offset-4 hover:text-emerald-400 transition-colors"
                    >
                      Price details
                    </button>
                  </div>
                </div>
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
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default GuestDetailsModal;
