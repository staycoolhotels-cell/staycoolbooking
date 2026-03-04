'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming simple tabs or I'll use custom
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '@/lib/supabaseClient'; // Ensure this matches your project structure
import { toast } from 'sonner';

interface BookingCardProps {
  propertyId: string;
  pricePerNight: number;
  currency: string;
  isAvailable: boolean;
  hostResponseRate: number;
  hostResponseTime: string;
  totalRooms: number;
}

const BookingCard = ({
  propertyId,
  pricePerNight,
  currency,
  isAvailable: initialIsAvailable,
  hostResponseRate,
  hostResponseTime,
  totalRooms,
}: BookingCardProps) => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [isGuestOpen, setIsGuestOpen] = useState(false);

  // Bulk Booking State
  const [bookingType, setBookingType] = useState<'single' | 'bulk'>('single');
  const [selectedRooms, setSelectedRooms] = useState(1);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<number>(totalRooms);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);

    // Fetch user and role
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserRole(user.user_metadata?.role?.toLowerCase() || 'guest');
      }
    };
    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserRole(session?.user?.user_metadata?.role?.toLowerCase() || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check availability when dates change
  useEffect(() => {
    const checkRoomAvailability = async () => {
      if (!checkIn || !checkOut || !propertyId) return;

      setCheckingAvailability(true);
      try {
        const { data, error } = await supabase.rpc('check_availability', {
          p_check_in: checkIn.toISOString().split('T')[0], // Send YYYY-MM-DD
          p_check_out: checkOut.toISOString().split('T')[0],
          p_property_id: propertyId,
        });

        if (error) {
          console.error('Error checking availability:', JSON.stringify(error, null, 2));
          console.error('Error properties:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          // Fallback to initial availability or assume some availability to avoid blocking
          // setAvailableRooms(0); 
        } else {
          console.log("Availability RPC Result:", data);
          // If RPC doesn't exist yet (migration pending), it returns error.
          // We should handle this gracefully.
          if (typeof data === 'number') {
            setAvailableRooms(data);
          }
        }
      } catch (err) {
        console.error('Failed to check availability', err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    if (checkIn && checkOut) {
      checkRoomAvailability();
    }
  }, [checkIn, checkOut, propertyId]);


  if (!isHydrated) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm sticky top-24">
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = checkOut.getTime() - checkIn.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  // Price Calculation
  const roomsToBook = bookingType === 'bulk' ? selectedRooms : 1;
  const baseTotal = nights * pricePerNight * roomsToBook;

  // Discounts
  let discount = 0;
  if (bookingType === 'bulk') {
    if (roomsToBook === totalRooms && totalRooms > 1) {
      discount = baseTotal * 0.10; // 10% off for entire property
    } else if (roomsToBook >= 5) {
      discount = baseTotal * 0.05; // 5% off for 5+ rooms
    }
  }

  const discountedTotal = Math.max(0, baseTotal - discount);
  const serviceFee = discountedTotal * 0.1;
  const total = discountedTotal + serviceFee;

  const handleBookClick = () => {
    if (bookingType === 'bulk') {
      setShowConfirmation(true);
    } else {
      proceedToBooking();
    }
  };

  const proceedToBooking = () => {
    const params = new URLSearchParams({
      propertyId,
      checkIn: checkIn ? checkIn.toISOString() : '',
      checkOut: checkOut ? checkOut.toISOString() : '',
      guests: guests.toString(),
      bookingType,
      roomCount: roomsToBook.toString(),
    });
    router.push(`/guest-booking-flow?${params.toString()}`);
  };

  const isDateSelected = !!checkIn && !!checkOut && nights > 0;
  // Determine if bookable
  // For single: need at least 1 room available.
  // For bulk: need selectedRooms <= availableRooms.
  // If we haven't checked availability (no dates), assume available based on initial prop.
  // But initialIsAvailable is boolean.

  const isBookable = isDateSelected
    ? (availableRooms >= roomsToBook)
    : initialIsAvailable;

  const unavailableMessage = checkingAvailability
    ? 'Checking availability...'
    : (isDateSelected && availableRooms < roomsToBook
      ? `Only ${availableRooms} rooms available`
      : 'Unavailable');

  // Custom styles for MUI DatePicker
  const datePickerSx = {
    width: '100%',
    '& .MuiInputBase-root': {
      color: '#ffffff !important',
      backgroundColor: 'rgba(30, 41, 59, 0.7)', // Slightly more opaque for better contrast
      borderRadius: '0.75rem',
      border: '1px solid rgba(51, 65, 85, 0.6)',
      fontSize: '0.875rem',
      fontWeight: '600', // Making text bolder for better visibility
      '&:hover': {
        borderColor: 'rgba(59, 130, 246, 0.5)',
      },
      '&.Mui-focused': {
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
      },
      '& .MuiInputBase-input': {
        color: '#ffffff !important',
        WebkitTextFillColor: '#ffffff !important',
        padding: '12px 14px',
        '&::placeholder': {
          color: '#94a3b8 !important',
          opacity: 1,
        }
      }
    },
    '& .MuiSvgIcon-root': {
      color: '#60a5fa', // Brightening the icon color
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '& .MuiInputLabel-root': {
      color: '#94a3b8',
      fontSize: '0.75rem',
      fontWeight: '600',
      '&.Mui-focused': {
        color: '#60a5fa',
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-blue-500/20 shadow-xl shadow-blue-900/10 rounded-3xl p-6 sticky top-28 z-30">
        {(userRole === 'host' || userRole === 'admin') ? (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <Icon name="ShieldCheckIcon" size={32} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Booking Restricted</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Property booking is only available for <span className="text-blue-400 font-semibold">Guest</span> accounts.
              As a <span className="text-indigo-400 font-semibold uppercase">{userRole}</span>, you can browse listings but cannot make reservations.
            </p>
            <div className="p-4 bg-blue-950/20 rounded-2xl border border-blue-500/10">
              <p className="text-[11px] text-blue-300/60 uppercase font-black tracking-widest">
                Switch accounts to book
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header: Price & Rating */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-3xl font-bold text-white">
                  {currency}{pricePerNight.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-400 text-sm font-medium ml-1">
                  {bookingType === 'bulk' ? '/ room / night' : '/ night'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/20">
                <Icon name="StarIcon" size={14} variant="solid" className="text-yellow-400" />
                <span className="font-semibold text-gray-200">4.92</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400 font-medium">128 reviews</span>
              </div>
            </div>

            {/* Booking Type Toggle */}
            {totalRooms > 1 && (
              <div className="mb-6 p-1 bg-slate-800/50 rounded-xl flex">
                <button
                  onClick={() => { setBookingType('single'); setSelectedRooms(1); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${bookingType === 'single'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Single Room
                </button>
                <button
                  onClick={() => setBookingType('bulk')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${bookingType === 'bulk'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Bulk Booking
                </button>
              </div>
            )}

            {/* Booking Form Interface */}
            <div className="space-y-4 mb-6">

              {/* Date Pickers Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-blue-100/80 uppercase tracking-wider mb-1 pl-1">
                    Check-in
                  </label>
                  <DatePicker
                    value={checkIn}
                    onChange={(newValue) => setCheckIn(newValue)}
                    disablePast
                    slotProps={{ textField: { size: 'small', placeholder: 'Add date' } }}
                    sx={datePickerSx}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-100/80 uppercase tracking-wider mb-1 pl-1">
                    Check-out
                  </label>
                  <DatePicker
                    value={checkOut}
                    onChange={(newValue) => setCheckOut(newValue)}
                    minDate={checkIn || new Date()}
                    slotProps={{ textField: { size: 'small', placeholder: 'Add date' } }}
                    sx={datePickerSx}
                  />
                </div>
              </div>

              {/* Guest Input */}
              <div className="relative">
                <div
                  className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-blue-500/40 transition-colors cursor-pointer flex justify-between items-center group"
                  onClick={() => setIsGuestOpen(!isGuestOpen)}
                >
                  <div>
                    <label className="block text-[10px] font-bold text-blue-100/80 uppercase tracking-wider mb-1 group-hover:text-blue-400 transition-colors">
                      Guests
                    </label>
                    <div className="text-sm font-medium text-gray-200">
                      {guests} {guests === 1 ? 'guest' : 'guests'}
                    </div>
                  </div>
                  <Icon
                    name="ChevronDownIcon"
                    size={18}
                    className={`text-gray-400 transition-transform duration-300 ${isGuestOpen ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Dropdown */}
                {isGuestOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-[#1e293b] border border-slate-700 p-4 shadow-xl rounded-xl z-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200">Guests</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setGuests(Math.max(1, guests - 1)); }}
                          disabled={guests <= 1}
                          className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-gray-300 hover:border-gray-400 hover:text-white disabled:opacity-30 disabled:hover:border-slate-600 transition-colors"
                        >
                          <Icon name="MinusIcon" size={12} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium text-white">{guests}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGuests(Math.min(10 + (selectedRooms * 2), guests + 1)); }}
                          className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-gray-300 hover:border-gray-400 hover:text-white transition-colors"
                        >
                          <Icon name="PlusIcon" size={12} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsGuestOpen(false)}
                      className="w-full mt-4 text-sm font-semibold underline text-right text-gray-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

              {/* Rooms Input (Only for Bulk) */}
              {bookingType === 'bulk' && (
                <div className="relative">
                  <div
                    className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-blue-500/40 transition-colors cursor-pointer flex justify-between items-center group"
                    onClick={() => setIsRoomOpen(!isRoomOpen)}
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-blue-100/80 uppercase tracking-wider mb-1 group-hover:text-blue-400 transition-colors">
                        Rooms
                      </label>
                      <div className="text-sm font-medium text-gray-200">
                        {selectedRooms} {selectedRooms === 1 ? 'room' : 'rooms'}
                      </div>
                    </div>
                    <Icon
                      name="ChevronDownIcon"
                      size={18}
                      className={`text-gray-400 transition-transform duration-300 ${isRoomOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {isRoomOpen && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-[#1e293b] border border-slate-700 p-4 shadow-xl rounded-xl z-50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-200">Rooms to Book</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRooms(Math.max(1, selectedRooms - 1)); }}
                            disabled={selectedRooms <= 1}
                            className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-gray-300 hover:border-gray-400 hover:text-white disabled:opacity-30 disabled:hover:border-slate-600 transition-colors"
                          >
                            <Icon name="MinusIcon" size={12} />
                          </button>
                          <span className="w-4 text-center text-sm font-medium text-white">{selectedRooms}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRooms(Math.min(totalRooms, selectedRooms + 1)); }}
                            disabled={selectedRooms >= totalRooms}
                            className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-gray-300 hover:border-gray-400 hover:text-white disabled:opacity-30 disabled:hover:border-slate-600 transition-colors"
                          >
                            <Icon name="PlusIcon" size={12} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => { setSelectedRooms(totalRooms); setIsRoomOpen(false); }}
                        className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg text-sm font-semibold transition-colors mb-2"
                      >
                        Book Entire Property ({totalRooms} rooms)
                      </button>

                      <button
                        onClick={() => setIsRoomOpen(false)}
                        className="w-full mt-2 text-sm font-semibold underline text-right text-gray-400 hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Primary CTA */}
            <button
              onClick={handleBookClick}
              disabled={!isBookable || checkingAvailability}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed mb-6"
            >
              {isBookable
                ? (nights ? (bookingType === 'bulk' ? 'Request Bulk Booking' : 'Reserve') : 'Select dates')
                : unavailableMessage}
            </button>

            {/* Price Breakdown */}
            {nights > 0 && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-center text-sm text-gray-400">You won't be charged yet</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span className="underline decoration-gray-600">
                      {currency}{pricePerNight.toLocaleString()} x {nights} nights
                      {roomsToBook > 1 && ` x ${roomsToBook} rooms`}
                    </span>
                    <span>{currency}{baseTotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="flex items-center gap-1">
                        <Icon name="TagIcon" size={14} />
                        Bulk Discount
                      </span>
                      <span>-{currency}{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-300">
                    <span className="underline decoration-gray-600">Service fee</span>
                    <span>{currency}{serviceFee.toLocaleString()}</span>
                  </div>
                </div>
                <div className="border-t border-slate-700/50 pt-4 flex justify-between font-bold text-lg text-white">
                  <span>Total</span>
                  <span>{currency}{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Trust Footer */}
            {!nights && (
              <div className="mt-2 flex items-center gap-3 justify-center text-xs text-blue-300/60 bg-blue-950/30 p-3 rounded-xl border border-blue-500/10">
                <div className="flex items-center gap-1.5">
                  <Icon name="CheckBadgeIcon" size={14} />
                  <span>Price Match</span>
                </div>
                <div className="w-1 h-1 bg-blue-300/20 rounded-full"></div>
                <div className="flex items-center gap-1.5">
                  <Icon name="ShieldCheckIcon" size={14} />
                  <span>Secure Checkout</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={proceedToBooking}
        bookingDetails={{
          roomCount: selectedRooms,
          nights: nights,
          pricePerNight: pricePerNight,
          totalPrice: total,
          discount: discount,
          propertyName: 'this property' // We might want to pass name as prop too
        }}
      />
    </LocalizationProvider>
  );
};

export default BookingCard;
