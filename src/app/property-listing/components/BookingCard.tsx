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

interface UpsellAmenity {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: string;
}

interface BookingCardProps {
  propertyId: string;
  pricePerNight: number;
  currency: string;
  isAvailable: boolean;
  hostResponseRate: number;
  hostResponseTime: string;
  totalRooms: number;
  selectedAmenities?: Record<string, number>;
  upsellAmenities?: UpsellAmenity[];
  rating?: number;
  reviewCount?: number;
}

const BookingCard = ({
  propertyId,
  pricePerNight,
  currency,
  isAvailable: initialIsAvailable,
  hostResponseRate,
  hostResponseTime,
  totalRooms,
  selectedAmenities = {},
  upsellAmenities = [],
  rating = 0,
  reviewCount = 0,
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

  // New Sub-units State
  const [availableRoomsList, setAvailableRoomsList] = useState<any[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);


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
            message: 'An unexpected error occurred.',
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

    const fetchAvailableRooms = async () => {
      if (!checkIn || !checkOut || !propertyId) return;
      
      setLoadingRooms(true);
      try {
        const { data, error } = await supabase.rpc('get_available_rooms', {
          p_property_id: propertyId,
          p_check_in: checkIn.toISOString().split('T')[0],
          p_check_out: checkOut.toISOString().split('T')[0],
        });

        if (error) {
          console.error('Error fetching available rooms (Raw):', error);
          console.error('Error details:', {
             message: 'An unexpected error occurred.',
             details: error.details,
             hint: error.hint,
             code: error.code
          });
          
          if (!data || error) {
            toast.error('Sub-units fetch failed. Ensure SQL migrations are applied.');
          }
        } else {
          setAvailableRoomsList(data || []);
          // Auto-select first available room for single booking if none selected
          if (bookingType === 'single' && (data || []).filter((r: any) => r.is_available).length > 0) {
            const firstAvailable = data.find((r: any) => r.is_available);
            if (firstAvailable) setSelectedRoomIds([firstAvailable.id]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      } finally {
        setLoadingRooms(false);
      }
    };

    if (checkIn && checkOut) {
      checkRoomAvailability();
      fetchAvailableRooms();
    }
  }, [checkIn, checkOut, propertyId, bookingType]);


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

  // Calculate selected upgrades total
  const upgradesTotal = Object.entries(selectedAmenities).reduce((sum, [id, qty]) => {
    const amenity = upsellAmenities.find(a => a.id === id);
    return amenity ? sum + amenity.price * qty : sum;
  }, 0);

  const total = discountedTotal + serviceFee + upgradesTotal;

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
      selectedRoomIds: JSON.stringify(selectedRoomIds),
    });
    
    if (Object.keys(selectedAmenities).length > 0) {
      params.append('amenities', JSON.stringify(selectedAmenities));
    }
    
    router.push(`/guest-booking-flow?${params.toString()}`);
  };

  const isDateSelected = !!checkIn && !!checkOut && nights > 0;
  // Determine if bookable
  // For single: need at least 1 room available.
  // For bulk: need selectedRooms <= availableRooms.
  // If we haven't checked availability (no dates), assume available based on initial prop.
  // But initialIsAvailable is boolean.

  const isBookable = isDateSelected
    ? (bookingType === 'single' ? selectedRoomIds.length === 1 : selectedRoomIds.length > 0 && selectedRoomIds.length <= availableRooms)
    : initialIsAvailable;

  const unavailableMessage = checkingAvailability
    ? 'Checking availability...'
    : (isDateSelected 
      ? (selectedRoomIds.length === 0 ? 'Select a unit' : `Only ${availableRooms} available`)
      : 'Unavailable');

  const popperSx = {
    '& .MuiPaper-root': {
      backgroundColor: 'rgba(15, 23, 42, 0.65) !important', // Glassy dark background
      backdropFilter: 'blur(16px) !important',
      WebkitBackdropFilter: 'blur(16px) !important',
      border: '1px solid rgba(56, 189, 248, 0.2) !important',
      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8) !important',
      borderRadius: '20px !important',
      color: '#f8fafc !important',
      padding: '8px',
    },
    '& .MuiPickersDay-root': {
      color: '#f8fafc !important',
      backgroundColor: 'transparent',
      fontWeight: '500',
    },
    '& .MuiPickersDay-root:hover': {
      backgroundColor: 'rgba(56, 189, 248, 0.2) !important',
    },
    '& .MuiPickersDay-root.Mui-selected': {
      backgroundColor: '#0ea5e9 !important',
      color: '#fff !important',
      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4) !important',
    },
    '& .MuiPickersDay-today': {
      border: '1px solid #38bdf8 !important',
    },
    '& .MuiPickersCalendarHeader-root': {
      color: '#f8fafc !important',
      paddingTop: '8px',
    },
    '& .MuiPickersCalendarHeader-label': {
      color: '#f8fafc !important',
      fontWeight: '700 !important',
      fontSize: '1.1rem',
    },
    '& .MuiIconButton-root': {
      color: '#38bdf8 !important',
      backgroundColor: 'rgba(56, 189, 248, 0.05)',
    },
    '& .MuiIconButton-root:hover': {
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
    },
    '& .MuiTypography-root': { // Day names (S M T W T F S)
      color: '#94a3b8 !important',
      fontWeight: '600',
    },
    '& .MuiPickersYear-yearButton': {
      color: '#f8fafc !important',
    },
    '& .MuiPickersYear-yearButton.Mui-selected': {
      backgroundColor: '#0ea5e9 !important',
    }
  };

  // Custom styles for MUI DatePicker — premium flat style inside unified container
  const datePickerSx = {
    width: '100%',
    '& .MuiInputBase-root': {
      backgroundColor: 'transparent',
      borderRadius: '0',
      border: 'none',
    },
    '& .MuiInputBase-input, & input': {
      color: '#ffffff !important',
      WebkitTextFillColor: '#ffffff !important',
      padding: '8px 0px 8px 6px',
      fontSize: '0.72rem',
      fontWeight: '600',
      cursor: 'pointer',
      opacity: '1 !important',
      '&::placeholder': {
        color: '#ffffff !important',
        WebkitTextFillColor: '#ffffff !important',
        opacity: '1 !important', // Pure white placeholder
      },
      '&::-webkit-input-placeholder': {
        color: '#ffffff !important',
        WebkitTextFillColor: '#ffffff !important',
        opacity: '1 !important',
      },
      '&::-moz-placeholder': {
        color: '#ffffff !important',
        WebkitTextFillColor: '#ffffff !important',
        opacity: '1 !important',
      },
    },
    // Fix for disabled/readonly states which MUI often dims
    '& .Mui-disabled, & .Mui-readOnly, & .MuiInputBase-input.Mui-disabled': {
      color: '#ffffff !important',
      WebkitTextFillColor: '#ffffff !important',
      opacity: '1 !important',
    },
    '& .MuiSvgIcon-root': {
      color: '#38bdf8 !important',
      fontSize: '0.85rem',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none !important',
    },
    '& .MuiInputLabel-root': {
      display: 'none',
    },
    '& .MuiInputAdornment-root': {
      marginLeft: '0',
      marginRight: '0',
    },
    '& .MuiIconButton-root': {
      padding: '2px !important',
    },
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="bg-zinc-900/95 backdrop-blur-md border border-sky-500/30 shadow-xl shadow-sky-900/20 rounded-3xl p-4 md:p-5 sticky top-28 z-30">
        {(userRole === 'host' || userRole === 'admin') ? (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-sky-500/20">
              <Icon name="ShieldCheckIcon" size={32} className="text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Booking Restricted</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Property booking is only available for <span className="text-sky-400 font-semibold">Guest</span> accounts.
              As a <span className="text-sky-300 font-semibold uppercase">{userRole}</span>, you can browse listings but cannot make reservations.
            </p>
            <div className="p-4 bg-sky-950/20 rounded-2xl border border-sky-500/10">
              <p className="text-[11px] text-sky-300/60 uppercase font-black tracking-widest">
                Switch accounts to book
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header: Price & Rating */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="text-2xl font-bold text-white">
                  {currency}{pricePerNight.toLocaleString('en-IN')}
                </span>
                <span className="text-stone-400 text-xs font-medium ml-1">
                  {bookingType === 'bulk' ? '/ room / night' : '/ night'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[13px] bg-sky-900/25 px-2.5 py-1 rounded-full border border-sky-500/20">
                <Icon name="StarIcon" size={12} variant="solid" className="text-amber-400" />
                <span className="font-semibold text-white">{rating.toFixed(2)}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400 font-medium">{reviewCount} reviews</span>
              </div>
            </div>

            {/* Booking Type Toggle */}
            {totalRooms > 1 && (
              <div className="mb-4 p-1 bg-gray-900/80 rounded-xl flex">
                <button
                  onClick={() => { setBookingType('single'); setSelectedRooms(1); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${bookingType === 'single'
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-900/40'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Single Room
                </button>
                <button
                  onClick={() => setBookingType('bulk')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${bookingType === 'bulk'
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-900/40'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Bulk Booking
                </button>
              </div>
            )}

            {/* Booking Form Interface */}
            <div className="space-y-3 mb-5">

              {/* Date Pickers */}
              <div className="flex gap-1">
                {/* Check-in */}
                <div 
                  className="flex-1 bg-gray-900/80 border border-gray-700/60 rounded-xl hover:border-sky-500/40 transition-colors overflow-hidden cursor-pointer"
                  onClick={() => setIsCheckInOpen(true)}
                >
                  <div className="px-1 pt-2 pb-1">
                    <p className="text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-0.5 group-hover:text-sky-400 transition-colors">Check-in</p>
                    <DatePicker
                      value={checkIn}
                      onChange={(newValue) => setCheckIn(newValue)}
                      open={isCheckInOpen}
                      onOpen={() => setIsCheckInOpen(true)}
                      onClose={() => setIsCheckInOpen(false)}
                      disablePast
                      format="dd MM yyyy"
                      desktopModeMediaQuery="@media (min-width: 0px)"
                      slotProps={{
                        textField: { 
                          size: 'small', 
                          placeholder: 'DD MM YYYY',
                        },
                        popper: { sx: popperSx }
                      }}
                      sx={datePickerSx}
                    />
                  </div>
                </div>

                {/* Check-out */}
                <div 
                  className="flex-1 bg-gray-900/80 border border-gray-700/60 rounded-xl hover:border-sky-500/40 transition-colors overflow-hidden cursor-pointer"
                  onClick={() => setIsCheckOutOpen(true)}
                >
                  <div className="px-1 pt-2 pb-1">
                    <p className="text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-0.5 group-hover:text-sky-400 transition-colors">Check-out</p>
                    <DatePicker
                      value={checkOut}
                      onChange={(newValue) => setCheckOut(newValue)}
                      open={isCheckOutOpen}
                      onOpen={() => setIsCheckOutOpen(true)}
                      onClose={() => setIsCheckOutOpen(false)}
                      minDate={checkIn || new Date()}
                      format="dd MM yyyy"
                      desktopModeMediaQuery="@media (min-width: 0px)"
                      slotProps={{
                        textField: { size: 'small', placeholder: 'DD MM YYYY' },
                        popper: { sx: popperSx }
                      }}
                      sx={datePickerSx}
                    />
                  </div>
                </div>
              </div>

              {/* Guest Input */}
              <div className="relative">
                <div
                  className="p-3 bg-gray-900/80 border border-gray-700/60 rounded-xl hover:border-sky-500/40 transition-colors cursor-pointer flex justify-between items-center group"
                  onClick={() => setIsGuestOpen(!isGuestOpen)}
                >
                  <div>
                    <label className="block text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-0.5 group-hover:text-sky-400 transition-colors">
                      Guests
                    </label>
                    <div className="text-sm font-medium text-white">
                      {guests} {guests === 1 ? 'guest' : 'guests'}
                    </div>
                  </div>
                  <Icon
                    name="ChevronDownIcon"
                    size={16}
                    className={`text-gray-400 transition-transform duration-300 ${isGuestOpen ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Dropdown */}
                {isGuestOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-sky-900/50 p-4 shadow-xl rounded-xl z-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Guests</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setGuests(Math.max(1, guests - 1)); }}
                          disabled={guests <= 1}
                          className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors"
                        >
                          <Icon name="MinusIcon" size={12} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium text-white">{guests}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGuests(Math.min(10 + (selectedRooms * 2), guests + 1)); }}
                          className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 transition-colors"
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
                    className="p-3 bg-gray-900/80 border border-gray-700/60 rounded-xl hover:border-sky-500/40 transition-colors cursor-pointer flex justify-between items-center group"
                    onClick={() => setIsRoomOpen(!isRoomOpen)}
                  >
                    <div>
                      <label className="block text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-0.5 group-hover:text-sky-400 transition-colors">
                        Rooms
                      </label>
                      <div className="text-sm font-medium text-white">
                        {selectedRooms} {selectedRooms === 1 ? 'room' : 'rooms'}
                      </div>
                    </div>
                    <Icon
                      name="ChevronDownIcon"
                      size={16}
                      className={`text-gray-400 transition-transform duration-300 ${isRoomOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {isRoomOpen && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-sky-900/50 p-4 shadow-xl rounded-xl z-50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-white">Rooms to Book</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRooms(Math.max(1, selectedRooms - 1)); }}
                            disabled={selectedRooms <= 1}
                            className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors"
                          >
                            <Icon name="MinusIcon" size={12} />
                          </button>
                          <span className="w-4 text-center text-sm font-medium text-white">{selectedRooms}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRooms(Math.min(totalRooms, selectedRooms + 1)); }}
                            disabled={selectedRooms >= totalRooms}
                            className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors"
                          >
                            <Icon name="PlusIcon" size={12} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => { setSelectedRooms(totalRooms); setIsRoomOpen(false); }}
                        className="w-full py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 rounded-lg text-sm font-semibold transition-colors mb-2"
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

              {/* Sub-unit Selection UI */}
              {isDateSelected && availableRoomsList.length > 0 && (
                <div className="space-y-2 p-3 bg-gray-900/80 border border-gray-700/60 rounded-xl">
                  <label className="block text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-2">
                    Select Preferred {bookingType === 'bulk' ? 'Units' : 'Unit'}
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {availableRoomsList.map((room) => (
                      <div 
                        key={room.id}
                        onClick={() => {
                          if (!room.is_available) return;
                          if (bookingType === 'single') {
                            setSelectedRoomIds([room.id]);
                          } else {
                            setSelectedRoomIds(prev => 
                              prev.includes(room.id) 
                                ? prev.filter(id => id !== room.id)
                                : [...prev, room.id]
                            );
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                          selectedRoomIds.includes(room.id)
                            ? 'bg-sky-500/10 border-sky-500/50'
                            : room.is_available 
                              ? 'bg-black/40 border-gray-800 hover:border-gray-600' 
                              : 'bg-black/20 border-gray-800/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            selectedRoomIds.includes(room.id) 
                              ? 'bg-sky-500 border-sky-500' 
                              : 'border-gray-600'
                          }`}>
                            {selectedRoomIds.includes(room.id) && <Icon name="CheckIcon" size={10} className="text-black" />}
                          </div>
                          <span className="text-xs font-medium text-white">{room.name}</span>
                        </div>
                        {!room.is_available && (
                          <span className="text-[10px] font-bold text-red-400/70 uppercase">Booked</span>
                        )}
                        {room.is_available && selectedRoomIds.includes(room.id) && (
                          <span className="text-[10px] font-bold text-sky-400 uppercase">Selected</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {bookingType === 'bulk' && selectedRoomIds.length > 0 && (
                    <p className="text-[10px] text-sky-400 font-semibold mt-1">
                      {selectedRoomIds.length} units selected
                    </p>
                  )}
                  {bookingType === 'single' && selectedRoomIds.length === 0 && (
                     <p className="text-[10px] text-amber-400 font-semibold mt-1">
                       Please select a unit to proceed
                     </p>
                  )}
                </div>
              )}

            </div>

            {/* Primary CTA */}
            <button
              onClick={handleBookClick}
              disabled={!isBookable || checkingAvailability}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black font-bold rounded-xl py-3 text-base shadow-lg shadow-sky-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed mb-2"
            >
              {isBookable
                ? (nights ? (bookingType === 'bulk' ? 'Request Bulk Booking' : 'Reserve') : 'Select dates')
                : unavailableMessage}
            </button>

            {/* Cancel Button — only shown when dates are selected */}
            {(checkIn || checkOut) && (
              <button
                onClick={() => {
                  setCheckIn(null);
                  setCheckOut(null);
                  setGuests(2);
                  setSelectedRooms(1);
                  setBookingType('single');
                }}
                className="w-full py-2.5 text-sm font-semibold text-gray-400 hover:text-white border border-gray-700/60 hover:border-gray-500 rounded-xl transition-all active:scale-[0.98] mb-2"
              >
                Clear selection
              </button>
            )}


            {/* Price Breakdown */}
            {nights > 0 && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-center text-sm text-gray-400">You won't be charged yet</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span className="underline decoration-gray-700">
                      {currency}{pricePerNight.toLocaleString()} x {nights} nights
                      {roomsToBook > 1 && ` x ${roomsToBook} rooms`}
                    </span>
                    <span>{currency}{baseTotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Icon name="TagIcon" size={14} />
                        Bulk Discount
                      </span>
                      <span>-{currency}{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-300">
                    <span className="underline decoration-gray-700">Service fee</span>
                    <span>{currency}{serviceFee.toLocaleString()}</span>
                  </div>
                  {upgradesTotal > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span className="flex items-center gap-1">
                        <Icon name="SparklesIcon" size={14} />
                        Exclusive Upgrades
                      </span>
                      <span>+{currency}{upgradesTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-sky-900/40 pt-4 flex justify-between font-bold text-lg text-white">
                  <span>Total</span>
                  <span>{currency}{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Trust Footer */}
            {!nights && (
              <div className="mt-2 flex items-center gap-3 justify-center text-xs text-sky-400/70 bg-sky-950/20 p-3 rounded-xl border border-sky-500/10">
                <div className="flex items-center gap-1.5">
                  <Icon name="CheckBadgeIcon" size={14} />
                  <span>Price Match</span>
                </div>
                <div className="w-1 h-1 bg-sky-400/20 rounded-full"></div>
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
