'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
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
  propertyType?: string;
  maxGuests?: number;
  bulkBookingDiscount?: number;
  roomTypePrices?: Record<string, number>;
  roomTypeWeekendPrices?: Record<string, number>;
  weekendPrice?: number;
  roomTypeCounts?: Record<string, number>;
  roomTypeSpecs?: Record<string, { guestsCount?: number; bed?: string; sqft?: string | number; view?: string }>;
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
  propertyType = 'Room',
  maxGuests = 2,
  bulkBookingDiscount = 10,
  roomTypePrices = {},
  roomTypeWeekendPrices = {},
  weekendPrice = 0,
  roomTypeCounts = {},
  roomTypeSpecs = {},
}: BookingCardProps) => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      const val = sessionStorage.getItem(`booking_${propertyId}_checkIn`);
      if (val) {
        const d = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(d.getTime()) && d >= today) return d;
      }
    }
    return null;
  });
  const [checkOut, setCheckOut] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      const val = sessionStorage.getItem(`booking_${propertyId}_checkOut`);
      if (val) {
        const d = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(d.getTime()) && d >= today) return d;
      }
    }
    return null;
  });
  const [guests, setGuests] = useState(() => {
    if (typeof window !== 'undefined') {
      const val = sessionStorage.getItem(`booking_${propertyId}_guests`);
      return val ? parseInt(val) : 2;
    }
    return 2;
  });

  // Bulk Booking State
  const [bookingType, setBookingType] = useState<'single' | 'bulk'>(() => {
    if (typeof window !== 'undefined') {
      const val = sessionStorage.getItem(`booking_${propertyId}_bookingType`);
      return (val === 'bulk' || val === 'single') ? val : 'single';
    }
    return 'single';
  });
  const [selectedRooms, setSelectedRooms] = useState(() => {
    if (typeof window !== 'undefined') {
      const val = sessionStorage.getItem(`booking_${propertyId}_selectedRooms`);
      return val ? parseInt(val) : 1;
    }
    return 1;
  });
  const [availableRooms, setAvailableRooms] = useState<number>(totalRooms);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // New Sub-units State
  const [availableRoomsList, setAvailableRoomsList] = useState<any[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedRoomCountsByType, setSelectedRoomCountsByType] = useState<Record<string, number>>({});
  const [hasFreeCancellation, setHasFreeCancellation] = useState(() => {
    if (typeof window !== 'undefined') {
      const val = sessionStorage.getItem(`booking_${propertyId}_hasFreeCancellation`);
      return val === 'true';
    }
    return false;
  });

  const groupedRooms = useMemo(() => {
    const groups: Record<string, any[]> = {};
    availableRoomsList.forEach(room => {
      const type = room.room_type || 'Standard';
      if (!groups[type]) groups[type] = [];
      groups[type].push(room);
    });
    return groups;
  }, [availableRoomsList]);

  // Save to sessionStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (checkIn) sessionStorage.setItem(`booking_${propertyId}_checkIn`, checkIn.toISOString());
      else sessionStorage.removeItem(`booking_${propertyId}_checkIn`);

      if (checkOut) sessionStorage.setItem(`booking_${propertyId}_checkOut`, checkOut.toISOString());
      else sessionStorage.removeItem(`booking_${propertyId}_checkOut`);

      sessionStorage.setItem(`booking_${propertyId}_guests`, guests.toString());
      sessionStorage.setItem(`booking_${propertyId}_bookingType`, bookingType);
      sessionStorage.setItem(`booking_${propertyId}_selectedRooms`, selectedRooms.toString());
      sessionStorage.setItem(`booking_${propertyId}_hasFreeCancellation`, hasFreeCancellation.toString());
    }
  }, [checkIn, checkOut, guests, bookingType, selectedRooms, hasFreeCancellation, propertyId]);

  const safePropertyType = propertyType || 'Room';
  const isTent = safePropertyType.toLowerCase().trim() === 'tent' || safePropertyType.toLowerCase().trim() === 'tents';
  const isDormitory = safePropertyType.toLowerCase().trim() === 'dormitory';
  const unitName = isTent ? 'Tent' : isDormitory ? 'Bed' : 'Room';
  const unitsName = isTent ? 'Tents' : isDormitory ? 'Beds' : 'Rooms';
  const isHotelOrResort = safePropertyType.toLowerCase().trim() === 'hotel' || safePropertyType.toLowerCase().trim() === 'resort';

  const hotelRoomTypes = useMemo(() => {
    const countKeys = Object.keys(roomTypeCounts || {}).filter(k => (roomTypeCounts?.[k] || 0) > 0);
    if (countKeys.length > 0) {
      if (countKeys.includes('Entire Resort')) return ['Entire Resort'];
      return countKeys;
    }

    const priceKeys = Object.keys(roomTypePrices || {}).filter(k => k && k.trim().length > 0);
    if (priceKeys.length > 0) {
      if (priceKeys.includes('Entire Resort')) return ['Entire Resort'];
      return priceKeys;
    }

    const groupedKeys = Object.keys(groupedRooms);
    if (groupedKeys.length > 0) {
      if (groupedKeys.includes('Entire Resort')) return ['Entire Resort'];
      return groupedKeys;
    }

    return ['Deluxe Room', 'Superior Room', 'Executive Suite'];
  }, [roomTypeCounts, roomTypePrices, groupedRooms]);

  const [selectedHotelRoomType, setSelectedHotelRoomType] = useState<string>('');

  useEffect(() => {
    if (hotelRoomTypes.length > 0 && (!selectedHotelRoomType || !hotelRoomTypes.includes(selectedHotelRoomType))) {
      setSelectedHotelRoomType(hotelRoomTypes[0]);
    }
  }, [hotelRoomTypes, selectedHotelRoomType]);

  useEffect(() => {
    if (!isHotelOrResort || bookingType !== 'single') return;
    if (availableRoomsList.length > 0 && selectedHotelRoomType) {
      const match = availableRoomsList.find(
        (r: any) => r.is_available && (r.room_type || '').toLowerCase() === selectedHotelRoomType.toLowerCase()
      ) || availableRoomsList.find(
        (r: any) => (r.room_type || '').toLowerCase() === selectedHotelRoomType.toLowerCase()
      ) || availableRoomsList.find((r: any) => r.is_available) || availableRoomsList[0];

      if (match && (!selectedRoomIds.includes(match.id) || selectedRoomIds.length !== 1)) {
        setSelectedRoomIds([match.id]);
      }
    }
  }, [isHotelOrResort, bookingType, selectedHotelRoomType, availableRoomsList]);

  const getRoomTypeSpecs = (type: string) => {
    // If custom specs are configured by host in property, use them!
    const custom = roomTypeSpecs?.[type];
    if (custom) {
      const parsedGuests = Number(custom.guestsCount) || 2;
      const parsedBed = custom.bed || '1 Double Bed';
      const rawSqft = custom.sqft ? String(custom.sqft).trim() : '180';
      const parsedSqft = rawSqft.toLowerCase().includes('sq.ft') ? rawSqft : `${rawSqft} sq.ft`;
      const parsedView = custom.view || 'City View';
      return {
        guestsCount: parsedGuests,
        bed: parsedBed,
        sqft: parsedSqft,
        view: parsedView,
      };
    }

    const t = type.toLowerCase();
    let guestsCount = 2;
    let bed = '1 Double Bed';
    let sqft = '180 sq.ft';
    let view = 'City View';

    if (t.includes('entire resort')) {
      guestsCount = 20;
      bed = 'Multiple King & Queen Beds (Full Resort)';
      sqft = '5000 sq.ft';
      view = 'Full Resort Landscape';
    } else if (t.includes('executive') || t.includes('suite') || t.includes('presidential')) {
      guestsCount = 3;
      bed = '1 King Bed';
      sqft = '350 sq.ft';
      view = 'City View';
    } else if (t.includes('superior') || t.includes('premium') || t.includes('luxury')) {
      guestsCount = 2;
      bed = '1 Queen Bed';
      sqft = '220 sq.ft';
      view = 'City View';
    } else if (t.includes('deluxe')) {
      guestsCount = 2;
      bed = '1 Double Bed';
      sqft = '180 sq.ft';
      view = 'City View';
    } else if (t.includes('standard') || t.includes('ac')) {
      guestsCount = 2;
      bed = '1 Double Bed';
      sqft = '180 sq.ft';
      view = 'City View';
    }

    return { guestsCount, bed, sqft, view };
  };

  const getRoomCountLeft = (type: string) => {
    if (availableRoomsList.length > 0) {
      const available = availableRoomsList.filter(
        (r: any) => r.is_available && (r.room_type || '').toLowerCase() === type.toLowerCase()
      ).length;
      if (available > 0) return available;
    }
    if (roomTypeCounts && roomTypeCounts[type] !== undefined) {
      return roomTypeCounts[type];
    }
    const t = type.toLowerCase();
    if (t.includes('executive') || t.includes('suite')) return 1;
    if (t.includes('superior')) return 2;
    return 3;
  };

  // Check if bulk booking is allowed for this property type
  const isBulkBookingAllowed = useMemo(() => {
    const type = safePropertyType.toLowerCase().trim();
    const disallowedTypes = ['home stay', 'homestay', 'villa', 'apartment', 'flat'];
    if (disallowedTypes.some(disallowed => type.includes(disallowed))) return false;
    // Entire Resort NEVER allows bulk booking
    if (hotelRoomTypes.includes('Entire Resort') || selectedHotelRoomType === 'Entire Resort') return false;
    return !disallowedTypes.some(disallowed => type.includes(disallowed));
  }, [safePropertyType, hotelRoomTypes, selectedHotelRoomType]);

  useEffect(() => {
    setIsHydrated(true);

    // Fetch user and role
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserRole(user.user_metadata?.role?.toLowerCase() || 'guest');
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };
    fetchUser();

    // Network status listeners
    if (typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        toast.success('Back online!', { id: 'network-status' });
      };
      const handleOffline = () => {
        setIsOnline(false);
        toast.error('You are offline. Please check your connection.', { id: 'network-status' });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUserRole(session.user.user_metadata?.role?.toLowerCase() || null);
          setIsAuthenticated(true);
        } else {
          setUserRole(null);
          setIsAuthenticated(false);
        }
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        subscription.unsubscribe();
      };
    }
  }, []);

  // Check availability when dates change
  useEffect(() => {
    const checkRoomAvailability = async () => {
      if (!checkIn || !checkOut || !propertyId || !isOnline) return;

      setCheckingAvailability(true);
      try {
        const { data, error } = await supabase.rpc('check_availability', {
          p_check_in: format(checkIn, 'yyyy-MM-dd'),
          p_check_out: format(checkOut, 'yyyy-MM-dd'),
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
            // Cap selectedRooms if it exceeds newly fetched availableRooms
            if (bookingType === 'single') {
                setSelectedRooms(1);
            } else {
                setSelectedRooms(prev => Math.min(prev, data));
            }
          }
        }
      } catch (err) {
        console.error('Failed to check availability', err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const fetchAvailableRooms = async () => {
      if (!checkIn || !checkOut || !propertyId || !isOnline) return;

      setLoadingRooms(true);
      try {
        const { data, error } = await supabase.rpc('get_available_rooms', {
          p_property_id: propertyId,
          p_check_in: format(checkIn, 'yyyy-MM-dd'),
          p_check_out: format(checkOut, 'yyyy-MM-dd'),
        });

        if (error) {
          console.error('Error fetching available rooms (Raw):', error);
          if (!data || error) {
            toast.error('Sub-units fetch failed. Ensure SQL migrations are applied.');
          }
        } else {
          setAvailableRoomsList(data || []);

          // Auto-select first available room for single booking
          if (bookingType === 'single' && (data || []).length > 0) {
            const firstAvailable = data.find((r: any) => r.is_available) || data[0];
            setSelectedRoomIds([firstAvailable.id]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      } finally {
        setLoadingRooms(false);
      }
    };

    if (checkIn && checkOut && isOnline) {
      checkRoomAvailability();
      fetchAvailableRooms();
    }
  }, [checkIn, checkOut, propertyId, bookingType, isOnline]);

  // Effect to handle booking type changes
  useEffect(() => {
    if (bookingType === 'single') {
      if (availableRoomsList.length > 0) {
        const firstAvailable = availableRoomsList.find((r: any) => r.is_available) || availableRoomsList[0];
        setSelectedRoomIds([firstAvailable.id]);
      }
      setSelectedRoomCountsByType({});
      setSelectedRooms(1);
    } else if (bookingType === 'bulk') {
      setSelectedRooms(0);
      setSelectedRoomIds([]);
      setSelectedRoomCountsByType({});
    }
  }, [bookingType, availableRoomsList]);

  // Auto-selection of units — sync with selectedRoomCountsByType for bulk
  useEffect(() => {
    if (bookingType === 'single') {
      if (availableRoomsList && availableRoomsList.length > 0) {
        const available = availableRoomsList.filter(r => r.is_available);
        if (available.length > 0 && selectedRoomIds.length === 0) {
          setSelectedRoomIds([available[0].id]);
        }
      }
      return;
    }

    // Bulk Booking Logic: Pick specific IDs based on counts per type
    const newSelectedIds: string[] = [];
    let totalCount = 0;

    Object.entries(selectedRoomCountsByType).forEach(([type, count]) => {
      if (availableRoomsList && availableRoomsList.length > 0) {
        const availableInType = availableRoomsList.filter(
          r => r.is_available && (r.room_type || 'Standard').toLowerCase() === type.toLowerCase()
        );
        newSelectedIds.push(...availableInType.slice(0, count).map(r => r.id));
      }
      totalCount += (count || 0);
    });

    setSelectedRoomIds(newSelectedIds);
    if (isHotelOrResort) {
      setSelectedRooms(totalCount);
    }
  }, [availableRoomsList, bookingType, selectedRoomCountsByType, isHotelOrResort]);

  // Auto-update guests when selected units change
  useEffect(() => {
    const requiredCount = bookingType === 'bulk' ? selectedRoomIds.length : 1;
    // Update guests to the maximum allowed for the selected units
    // or just multiply maxGuests by number of selected units.
    if (requiredCount > 0) {
      setGuests(maxGuests * requiredCount);
    }
  }, [selectedRoomIds.length, bookingType, maxGuests]);

  // Reset free cancellation if check-in is NOT today (same-day only feature)
  useEffect(() => {
    if (!checkIn) return;
    const today = new Date();
    const isSameDay =
      checkIn.getFullYear() === today.getFullYear() &&
      checkIn.getMonth() === today.getMonth() &&
      checkIn.getDate() === today.getDate();
    if (!isSameDay) {
      setHasFreeCancellation(false);
    }
  }, [checkIn]);

  // Reset booking type if bulk is not allowed
  useEffect(() => {
    if ((!isBulkBookingAllowed || selectedHotelRoomType === 'Entire Resort' || hotelRoomTypes.includes('Entire Resort')) && bookingType === 'bulk') {
      setBookingType('single');
      setSelectedRooms(1);
      setSelectedRoomIds([]);
    }
  }, [isBulkBookingAllowed, selectedHotelRoomType, hotelRoomTypes, bookingType]);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = checkOut.getTime() - checkIn.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  // Helper to check if a Date is Saturday or Sunday
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  // Helper to get room-specific price for a specific date
  const getRoomPriceForDate = (roomType: string | null, date: Date) => {
    const isWeekendDay = isWeekend(date);
    
    if (isWeekendDay) {
      // 1. Check room type weekend price
      if (roomType && roomTypeWeekendPrices) {
        if (roomTypeWeekendPrices[roomType] !== undefined && Number(roomTypeWeekendPrices[roomType]) > 0) {
          return Number(roomTypeWeekendPrices[roomType]);
        }
        const wkKey = Object.keys(roomTypeWeekendPrices).find(k => k.toLowerCase() === roomType.toLowerCase());
        if (wkKey && roomTypeWeekendPrices[wkKey] !== undefined && Number(roomTypeWeekendPrices[wkKey]) > 0) {
          return Number(roomTypeWeekendPrices[wkKey]);
        }
      }
      // 2. Check property-level weekend price
      if (weekendPrice && Number(weekendPrice) > 0) {
        return Number(weekendPrice);
      }
    }
    
    // Regular weekday price
    if (roomType && roomTypePrices) {
      if (roomTypePrices[roomType] !== undefined) {
        return Number(roomTypePrices[roomType]);
      }
      const pKey = Object.keys(roomTypePrices).find(k => k.toLowerCase() === roomType.toLowerCase());
      if (pKey && roomTypePrices[pKey] !== undefined) {
        return Number(roomTypePrices[pKey]);
      }
    }
    return pricePerNight || 0;
  };

  // Room-specific price helper
  const getRoomPrice = (roomType: string | null) => {
    if (!roomType || !roomTypePrices || Object.keys(roomTypePrices).length === 0) return pricePerNight || 0;
    if (roomTypePrices[roomType] !== undefined) return roomTypePrices[roomType];
    const key = Object.keys(roomTypePrices).find(k => k.toLowerCase() === roomType.toLowerCase());
    if (key && roomTypePrices[key] !== undefined) return roomTypePrices[key];
    return pricePerNight || 0;
  };

  const selectedRoomsData = availableRoomsList.filter(r => selectedRoomIds.includes(r.id));

  // Current display price (per night)
  const displayPrice = useMemo(() => {
    if (isHotelOrResort) {
      const type = selectedHotelRoomType || hotelRoomTypes[0];
      if (type) return getRoomPrice(type);
    }
    if (bookingType === 'single') {
      const selectedRoom = selectedRoomsData[0];
      return selectedRoom ? getRoomPrice(selectedRoom.room_type) : (pricePerNight || 0);
    } else {
      return pricePerNight || 0;
    }
  }, [bookingType, selectedRoomsData, pricePerNight, roomTypePrices, isHotelOrResort, selectedHotelRoomType, hotelRoomTypes]);

  const stayDates = useMemo(() => {
    if (!checkIn || !checkOut) return [];
    const dates: Date[] = [];
    const current = new Date(checkIn.getTime());
    while (current < checkOut) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [checkIn, checkOut]);

  const weekendNightsCount = useMemo(() => {
    return stayDates.filter(isWeekend).length;
  }, [stayDates]);

  const weekdayNightsCount = useMemo(() => {
    return nights - weekendNightsCount;
  }, [nights, weekendNightsCount]);

  const displayWeekendPrice = useMemo(() => {
    if (bookingType === 'single') {
      const roomType = (isHotelOrResort && selectedHotelRoomType)
        ? selectedHotelRoomType
        : (selectedRoomsData[0] ? selectedRoomsData[0].room_type : null);
      if (roomType && roomTypeWeekendPrices && roomTypeWeekendPrices[roomType] !== undefined && Number(roomTypeWeekendPrices[roomType]) > 0) {
        return Number(roomTypeWeekendPrices[roomType]);
      }
    }
    return weekendPrice || 0;
  }, [bookingType, selectedRoomsData, weekendPrice, roomTypeWeekendPrices, isHotelOrResort, selectedHotelRoomType]);

  // Hotel bulk rooms selected sum
  const totalBulkRoomsSelected = useMemo(() => {
    return Object.values(selectedRoomCountsByType).reduce((sum, count) => sum + (count || 0), 0);
  }, [selectedRoomCountsByType]);

  // Price Calculation
  const roomsToBook = useMemo(() => {
    if (bookingType === 'single') return 1;
    if (isHotelOrResort) {
      return totalBulkRoomsSelected;
    }
    return selectedRooms;
  }, [bookingType, isHotelOrResort, totalBulkRoomsSelected, selectedRooms]);

  const bulkPerNightTotal = useMemo(() => {
    if (isHotelOrResort) {
      return Object.entries(selectedRoomCountsByType).reduce((sum, [type, count]) => {
        return sum + (getRoomPrice(type) * (count || 0));
      }, 0);
    }
    return (pricePerNight || 0) * (selectedRooms > 0 ? selectedRooms : 0);
  }, [isHotelOrResort, selectedRoomCountsByType, roomTypePrices, pricePerNight, selectedRooms]);
  
  const weekdayTotal = useMemo(() => {
    if (nights <= 0 || stayDates.length === 0) return 0;
    const weekdayDates = stayDates.filter(d => !isWeekend(d));
    if (weekdayDates.length === 0) return 0;

    if (bookingType === 'single') {
      const selectedRoom = selectedRoomsData[0];
      const roomType = (isHotelOrResort && selectedHotelRoomType)
        ? selectedHotelRoomType
        : (selectedRoom ? selectedRoom.room_type : null);
      return weekdayDates.reduce((sum, date) => sum + getRoomPriceForDate(roomType, date), 0);
    } else {
      if (isHotelOrResort) {
        const hasSelectedCounts = Object.values(selectedRoomCountsByType).some(count => count > 0);
        if (hasSelectedCounts) {
          return Object.entries(selectedRoomCountsByType).reduce((sum, [type, count]) => {
            const typeStayTotal = weekdayDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(type, date), 0);
            return sum + ((count || 0) * typeStayTotal);
          }, 0);
        }
        return 0;
      }

      if (selectedRoomsData.length > 0) {
        return selectedRoomsData.reduce((roomSum, room) => {
          const roomType = room.room_type;
          return roomSum + weekdayDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(roomType, date), 0);
        }, 0);
      }
      const hasSelectedCounts = Object.values(selectedRoomCountsByType).some(count => count > 0);
      if (hasSelectedCounts) {
        return Object.entries(selectedRoomCountsByType).reduce((sum, [type, count]) => {
          const typeStayTotal = weekdayDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(type, date), 0);
          return sum + ((count || 0) * typeStayTotal);
        }, 0);
      }
      return weekdayDates.reduce((sum, date) => sum + (getRoomPriceForDate(null, date) * roomsToBook), 0);
    }
  }, [nights, bookingType, selectedRoomsData, pricePerNight, roomTypePrices, roomsToBook, selectedRoomCountsByType, stayDates, isHotelOrResort, selectedHotelRoomType]);

  const weekendTotal = useMemo(() => {
    if (nights <= 0 || stayDates.length === 0) return 0;
    const weekendDates = stayDates.filter(isWeekend);
    if (weekendDates.length === 0) return 0;

    if (bookingType === 'single') {
      const selectedRoom = selectedRoomsData[0];
      const roomType = (isHotelOrResort && selectedHotelRoomType)
        ? selectedHotelRoomType
        : (selectedRoom ? selectedRoom.room_type : null);
      return weekendDates.reduce((sum, date) => sum + getRoomPriceForDate(roomType, date), 0);
    } else {
      if (isHotelOrResort) {
        const hasSelectedCounts = Object.values(selectedRoomCountsByType).some(count => count > 0);
        if (hasSelectedCounts) {
          return Object.entries(selectedRoomCountsByType).reduce((sum, [type, count]) => {
            const typeStayTotal = weekendDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(type, date), 0);
            return sum + ((count || 0) * typeStayTotal);
          }, 0);
        }
        return 0;
      }

      if (selectedRoomsData.length > 0) {
        return selectedRoomsData.reduce((roomSum, room) => {
          const roomType = room.room_type;
          return roomSum + weekendDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(roomType, date), 0);
        }, 0);
      }
      const hasSelectedCounts = Object.values(selectedRoomCountsByType).some(count => count > 0);
      if (hasSelectedCounts) {
        return Object.entries(selectedRoomCountsByType).reduce((sum, [type, count]) => {
          const typeStayTotal = weekendDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(type, date), 0);
          return sum + ((count || 0) * typeStayTotal);
        }, 0);
      }
      return weekendDates.reduce((sum, date) => sum + (getRoomPriceForDate(null, date) * roomsToBook), 0);
    }
  }, [nights, bookingType, selectedRoomsData, pricePerNight, roomTypePrices, roomTypeWeekendPrices, weekendPrice, roomsToBook, selectedRoomCountsByType, stayDates, isHotelOrResort, selectedHotelRoomType]);

  const baseTotal = useMemo(() => {
    return weekdayTotal + weekendTotal;
  }, [weekdayTotal, weekendTotal]);

  const weekdayAveragePrice = useMemo(() => {
    if (weekdayNightsCount <= 0) return 0;
    const divisor = bookingType === 'single' ? weekdayNightsCount : (weekdayNightsCount * roomsToBook);
    if (divisor <= 0) return 0;
    const calculated = weekdayTotal / divisor;
    return isNaN(calculated) || !isFinite(calculated) ? 0 : calculated;
  }, [weekdayNightsCount, weekdayTotal, bookingType, roomsToBook]);

  const weekendAveragePrice = useMemo(() => {
    if (weekendNightsCount <= 0) return 0;
    const divisor = bookingType === 'single' ? weekendNightsCount : (weekendNightsCount * roomsToBook);
    if (divisor <= 0) return 0;
    const calculated = weekendTotal / divisor;
    return isNaN(calculated) || !isFinite(calculated) ? 0 : calculated;
  }, [weekendNightsCount, weekendTotal, bookingType, roomsToBook]);

  const averagePrice = useMemo(() => {
    if (nights <= 0) return displayPrice;
    const divisor = bookingType === 'single' ? nights : (nights * roomsToBook);
    if (divisor <= 0) return displayPrice;
    const calculated = baseTotal / divisor;
    return isNaN(calculated) || !isFinite(calculated) ? displayPrice : calculated;
  }, [nights, baseTotal, bookingType, roomsToBook, displayPrice]);

  const serviceFee = baseTotal * 0.1;

  // Discounts
  let discount = 0;
  if (bookingType === 'bulk') {
    if (bulkBookingDiscount !== undefined) {
      discount = baseTotal * (bulkBookingDiscount / 100);
    } else {
      if (roomsToBook === totalRooms && totalRooms > 1) {
        discount = baseTotal * 0.10; // 10% off for entire property
      } else if (roomsToBook >= 5) {
        discount = baseTotal * 0.05; // 5% off for 5+ rooms
      }
    }
  }

  const discountedTotal = Math.max(0, baseTotal - discount);

  // Calculate selected upgrades total
  const upgradesTotal = Object.entries(selectedAmenities).reduce((sum, [id, qty]) => {
    const amenity = upsellAmenities.find(a => a.id === id);
    return amenity ? sum + amenity.price * qty : sum;
  }, 0);

  const freeCancellationFee = hasFreeCancellation ? 70 : 0;
  const total = discountedTotal + serviceFee + upgradesTotal + freeCancellationFee;


  const handleBookClick = () => {
    if (!isOnline) {
      toast.error('Network unavailable', {
        description: 'Please check your internet connection to reserve this property.',
        id: 'offline-error'
      });
      return;
    }

    if (!checkIn || !checkOut || nights <= 0) {
      toast.info('Please select check-in and check-out dates.');
      return;
    }

    if (bookingType === 'bulk' && roomsToBook <= 0) {
      toast.info('Please select at least 1 room to continue.');
      return;
    }

    if (!isAuthenticated) {
      // Keep the selected stay details and take the guest to the booking flow.
      // That flow presents login as its first step and resumes afterwards.
      proceedToBooking();
      return;
    }

    if (bookingType === 'bulk') {
      setShowConfirmation(true);
    } else {
      proceedToBooking();
    }
  };

  const proceedToBooking = () => {
    if (!isOnline) {
      toast.error('Network error', { description: 'Please reconnect to proceed with booking.' });
      return;
    }

    const params = new URLSearchParams({
      propertyId,
      checkIn: checkIn ? format(checkIn, 'yyyy-MM-dd') : '',
      checkOut: checkOut ? format(checkOut, 'yyyy-MM-dd') : '',
      guests: guests.toString(),
      bookingType,
      roomCount: roomsToBook.toString(),
      selectedRoomIds: JSON.stringify(selectedRoomIds),
      selectedRoomType: isHotelOrResort ? selectedHotelRoomType : '',
      hasFreeCancellation: hasFreeCancellation.toString(),
      freeCancellationFee: freeCancellationFee.toString(),
    });


    const guestSelectedAmenities = Object.fromEntries(
      Object.entries(selectedAmenities).filter(([, quantity]) => Number(quantity) > 0)
    );
    if (Object.keys(guestSelectedAmenities).length > 0) {
      params.append('amenities', JSON.stringify(guestSelectedAmenities));
    }

    router.push(`/guest-booking-flow?${params.toString()}`);
  };

  const isDateSelected = !!checkIn && !!checkOut && nights > 0;

  // Free Cancellation: only show for same-day check-in bookings
  const isSameDayCheckIn = (() => {
    if (!checkIn) return false;
    const today = new Date();
    return (
      checkIn.getFullYear() === today.getFullYear() &&
      checkIn.getMonth() === today.getMonth() &&
      checkIn.getDate() === today.getDate()
    );
  })();
  // Determine if bookable
  // For single: need at least 1 room available.
  // For bulk: need selectedRooms <= availableRooms.
  // If we haven't checked availability (no dates), assume available based on initial prop.
  // But initialIsAvailable is boolean.

  const hasSubUnits = availableRoomsList.length > 0;

  const isBookable = isDateSelected
    ? (!hasSubUnits || (bookingType === 'single' ? selectedRoomIds.length === 1 : selectedRoomIds.length > 0 && selectedRoomIds.length <= availableRooms))
    : initialIsAvailable;

  const unavailableMessage = checkingAvailability
    ? 'Checking availability...'
    : (isDateSelected
      ? (!hasSubUnits
        ? (availableRooms > 0 || initialIsAvailable ? 'Select Dates' : 'Unavailable')
        : (selectedRoomIds.length === 0 ? 'Select a unit' : `Only ${availableRooms} available`))
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
    '& .MuiPickersDay-root.Mui-disabled': {
      color: 'rgba(248, 250, 252, 0.15) !important',
      pointerEvents: 'none',
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
      userSelect: 'none',
      pointerEvents: 'none',
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

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm sticky top-24">
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
    <div className="bg-zinc-900/95 backdrop-blur-md border border-sky-500/30 shadow-xl shadow-sky-900/20 rounded-3xl p-4 md:p-5 relative">
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
        ) : isHotelOrResort ? (
          <>
            {/* Header: Price & Rating + Bulk Booking Pill Button */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {bookingType === 'bulk'
                      ? (roomsToBook > 0
                          ? (nights > 0 ? `${currency}${total.toLocaleString('en-IN')}` : `${currency}${bulkPerNightTotal.toLocaleString('en-IN')}`)
                          : `${currency}0`
                        )
                      : `${currency}${(nights > 0 ? averagePrice : displayPrice).toLocaleString('en-IN')}`
                    }
                  </span>
                  <span className="text-slate-400 text-xs font-medium">
                    {bookingType === 'bulk'
                      ? (roomsToBook > 0
                          ? (nights > 0 ? '/ total' : '/ night')
                          : (nights > 0 ? '/ total' : '/ night')
                        )
                      : (nights > 0 ? '/ night (average)' : '/ night')
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300">
                  <Icon name="StarIcon" size={13} variant="solid" className="text-amber-400" />
                  <span className="font-bold text-white">{rating.toFixed(2)}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 font-medium">{reviewCount} reviews</span>
                </div>
              </div>

              {/* Bulk Booking Pill Button */}
              <button
                onClick={() => {
                  if (bookingType === 'bulk') {
                    setBookingType('single');
                    setSelectedRooms(1);
                    setSelectedRoomCountsByType({});
                  } else {
                    setBookingType('bulk');
                    setSelectedRoomCountsByType({});
                    setSelectedRooms(0);
                    setSelectedRoomIds([]);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                  bookingType === 'bulk'
                    ? 'bg-sky-400 text-black shadow-sky-500/30'
                    : 'bg-[#00b4d8] hover:bg-[#0096c7] text-white shadow-cyan-500/25'
                }`}
              >
                <Icon name="UserGroupIcon" size={15} />
                <span>{bookingType === 'bulk' ? 'Single Room' : 'Bulk Booking'}</span>
              </button>
            </div>

            {/* Date Pickers (Check-in & Check-out) */}
            <div className="flex gap-2.5 mb-4">
              {/* Check-in */}
              <div
                className="flex-1 bg-[#0c121e]/90 border border-slate-800 rounded-2xl p-3 cursor-pointer hover:border-sky-500/50 transition-colors relative"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCheckInOpen) {
                    setIsCheckOutOpen(false);
                    setIsCheckInOpen(true);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider mb-1">
                      CHECK-IN
                    </p>
                    <p className={`text-sm tracking-wide ${checkIn ? 'font-bold text-white' : 'font-medium text-slate-400'}`}>
                      {checkIn ? format(checkIn, 'dd MM yyyy') : 'Select Date'}
                    </p>
                  </div>
                  <Icon name="CalendarIcon" size={18} className="text-sky-400 shrink-0" />
                </div>
                <div className="opacity-0 absolute inset-0 pointer-events-none">
                  <DatePicker
                    value={checkIn}
                    onChange={(newValue) => {
                      setCheckIn(newValue);
                      if (newValue) {
                        setIsCheckInOpen(false);
                        if (checkOut && newValue >= checkOut) {
                          setCheckOut(null);
                        }
                        setTimeout(() => {
                          setIsCheckOutOpen(true);
                        }, 400);
                      }
                    }}
                    open={isCheckInOpen}
                    onOpen={() => {
                      setIsCheckOutOpen(false);
                      setIsCheckInOpen(true);
                    }}
                    onClose={() => setIsCheckInOpen(false)}
                    minDate={new Date()}
                    format="dd MM yyyy"
                    desktopModeMediaQuery="@media (min-width: 0px)"
                    slotProps={{
                      textField: {
                        size: 'small',
                        placeholder: 'DD MM YYYY',
                        onKeyDown: (e: React.KeyboardEvent) => e.preventDefault(),
                        inputProps: { readOnly: true },
                      },
                      popper: { sx: popperSx }
                    }}
                    sx={datePickerSx}
                  />
                </div>
              </div>

              {/* Check-out */}
              <div
                className="flex-1 bg-[#0c121e]/90 border border-slate-800 rounded-2xl p-3 cursor-pointer hover:border-sky-500/50 transition-colors relative"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCheckOutOpen) {
                    setIsCheckInOpen(false);
                    setIsCheckOutOpen(true);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider mb-1">
                      CHECK-OUT
                    </p>
                    <p className={`text-sm tracking-wide ${checkOut ? 'font-bold text-white' : 'font-medium text-slate-400'}`}>
                      {checkOut ? format(checkOut, 'dd MM yyyy') : 'Select Date'}
                    </p>
                  </div>
                  <Icon name="CalendarIcon" size={18} className="text-sky-400 shrink-0" />
                </div>
                <div className="opacity-0 absolute inset-0 pointer-events-none">
                  <DatePicker
                    value={checkOut}
                    onChange={(newValue) => {
                      setCheckOut(newValue);
                      if (newValue) {
                        setIsCheckOutOpen(false);
                      }
                    }}
                    open={isCheckOutOpen}
                    onOpen={() => {
                      setIsCheckInOpen(false);
                      setIsCheckOutOpen(true);
                    }}
                    onClose={() => setIsCheckOutOpen(false)}
                    minDate={checkIn || new Date()}
                    format="dd MM yyyy"
                    desktopModeMediaQuery="@media (min-width: 0px)"
                    slotProps={{
                      textField: {
                        size: 'small',
                        placeholder: 'DD MM YYYY',
                        onKeyDown: (e: React.KeyboardEvent) => e.preventDefault(),
                        inputProps: { readOnly: true },
                      },
                      popper: { sx: popperSx }
                    }}
                    sx={datePickerSx}
                  />
                </div>
              </div>
            </div>

            {/* SELECT ROOM Title */}
            <div className="text-[11px] font-extrabold tracking-wider uppercase text-sky-400 mb-3">
              SELECT ROOM
            </div>

            {/* Room Type Cards */}
            <div className="space-y-3 mb-4">
              {hotelRoomTypes.map((type) => {
                const isSelected = bookingType === 'single'
                  ? selectedHotelRoomType.toLowerCase() === type.toLowerCase()
                  : (selectedRoomCountsByType[type] || 0) > 0;
                const roomPrice = getRoomPrice(type);
                const specs = getRoomTypeSpecs(type);
                const roomsLeft = getRoomCountLeft(type);

                return (
                  <div
                    key={type}
                    onClick={() => {
                      if (bookingType === 'single') {
                        setSelectedHotelRoomType(type);
                        setGuests(specs.guestsCount);
                      }
                    }}
                    className={`relative rounded-2xl p-4 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#0b1322] border-sky-500/80 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/30'
                        : 'bg-[#0c121e]/90 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Room Name & Rooms Left Badge */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {type}
                      </h4>
                      {roomsLeft > 0 ? (
                        <div className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ffd1dc] text-[#d63384] whitespace-nowrap">
                          Only {roomsLeft} room{roomsLeft > 1 ? 's' : ''} left
                        </div>
                      ) : (
                        <div className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/40 text-red-400 border border-red-800/40 whitespace-nowrap">
                          Sold out
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-[1.1fr_auto_1fr] items-center gap-2 sm:gap-3">
                      {/* Left Column: Room Specs */}
                      <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 w-4 flex justify-center text-sm">👤</span>
                          <span>{specs.guestsCount} Guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 w-4 flex justify-center text-sm">🛏️</span>
                          <span>{specs.bed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 w-4 flex justify-center text-sm">⛶</span>
                          <span>{specs.sqft}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 w-4 flex justify-center text-sm">🏙️</span>
                          <span>{specs.view}</span>
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="w-[1px] h-20 bg-slate-800 self-center" />

                      {/* Right Column: Price & Selection */}
                      <div className="flex flex-col justify-between h-full py-0.5 pl-1">
                        <div>
                          <div className="text-xs text-slate-400">
                            <span className="text-white font-bold text-sm">
                              {currency}{roomPrice.toLocaleString('en-IN')}
                            </span>{' '}
                            / night
                          </div>
                          <div className="text-[10px] text-slate-400">+ Taxes</div>
                        </div>

                        {/* Selection Indicator */}
                        {bookingType === 'single' ? (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-2 border-sky-400 bg-sky-950/40 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                                  : 'border-2 border-slate-600 bg-transparent'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
                              )}
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-medium text-sky-400 tracking-tight">Active</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedRoomCountsByType(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }))}
                              disabled={(selectedRoomCountsByType[type] || 0) <= 0}
                              className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-slate-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors bg-black/40"
                            >
                              <Icon name="MinusIcon" size={10} />
                            </button>
                            <span className="text-xs font-bold text-white px-1">
                              {selectedRoomCountsByType[type] || 0}
                            </span>
                            <button
                              onClick={() => setSelectedRoomCountsByType(prev => ({ ...prev, [type]: Math.min(roomsLeft, (prev[type] || 0) + 1) }))}
                              disabled={(selectedRoomCountsByType[type] || 0) >= roomsLeft}
                              className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-slate-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors bg-black/40"
                            >
                              <Icon name="PlusIcon" size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Free Cancellation Option — only for same-day check-in */}
            {isSameDayCheckIn && (
              <div className="mb-4 bg-sky-900/10 border border-sky-500/20 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-r from-emerald-500/20 to-sky-500/20 px-4 py-2 border-b border-sky-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-500 rounded p-1">
                      <Icon name="CheckIcon" size={10} className="text-black" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enjoy Full Refund</span>
                  </div>
                  <div className="bg-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-sky-400 border border-sky-500/30">
                    FREE CANCELLATION
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div
                    onClick={() => setHasFreeCancellation(true)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${hasFreeCancellation
                      ? 'bg-sky-500/10 border-sky-500/50 shadow-inner'
                      : 'bg-black/20 border-gray-800 hover:border-gray-700'
                      }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasFreeCancellation ? 'border-sky-500' : 'border-gray-600'
                      }`}>
                      {hasFreeCancellation && <div className="w-2.5 h-2.5 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-bold text-white">Yes, I want Free Cancellation</p>
                        <span className="text-xs font-bold text-sky-400">₹70</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-400/90">
                          <Icon name="CheckCircleIcon" size={14} />
                          <span className="text-[11px] font-medium">Get full refund of {currency}{total.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Icon name="NoSymbolIcon" size={14} />
                          <span className="text-[11px] font-medium">₹0 Cancellation fee</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setHasFreeCancellation(false)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${!hasFreeCancellation
                      ? 'bg-zinc-800/50 border-gray-600'
                      : 'bg-black/20 border-gray-800 hover:border-gray-700'
                      }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${!hasFreeCancellation ? 'border-gray-400' : 'border-gray-600'
                      }`}>
                      {!hasFreeCancellation && <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-300">No, I don't want Free Cancellation</p>
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-2 text-amber-500/70">
                          <Icon name="ExclamationTriangleIcon" size={12} />
                          <span className="text-[11px] font-semibold">Only 50% refund will apply</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Reserve Button */}
            <button
              onClick={handleBookClick}
              disabled={!isOnline || checkingAvailability}
              className="w-full bg-[#00b4d8] hover:bg-[#0096c7] active:scale-[0.99] text-black font-bold text-base py-3.5 rounded-2xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            >
              {!isOnline ? (
                <div className="flex items-center justify-center gap-2">
                  <Icon name="WifiOff" size={18} />
                  <span>Offline</span>
                </div>
              ) : (
                <span>
                  {nights > 0
                    ? (bookingType === 'bulk'
                        ? (roomsToBook > 0 ? `Reserve ${roomsToBook} Room${roomsToBook > 1 ? 's' : ''}` : 'Select Rooms')
                        : 'Reserve')
                    : 'Select Dates'
                  }
                </span>
              )}
            </button>

            {/* Clear Dates Button */}
            {(checkIn || checkOut) && (
              <button
                onClick={() => {
                  setCheckIn(null);
                  setCheckOut(null);
                  setGuests(2);
                  setSelectedRooms(1);
                  setBookingType('single');
                }}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-white transition-all active:scale-[0.98] mb-2 text-center"
              >
                Clear selection
              </button>
            )}

            {/* Price Breakdown */}
            {nights > 0 && (bookingType === 'single' || roomsToBook > 0) && (
              <div className="space-y-3 pt-3 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2">
                <p className="text-center text-xs text-gray-400">You won't be charged yet</p>
                <div className="space-y-2 text-sm">
                  {weekdayNightsCount > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>
                        {bookingType === 'single' ? (
                          `${currency}${weekdayAveragePrice.toLocaleString('en-IN')} x ${weekdayNightsCount} weekday ${weekdayNightsCount === 1 ? 'night' : 'nights'}`
                        ) : (
                          `${roomsToBook} rooms x ${weekdayNightsCount} weekday ${weekdayNightsCount === 1 ? 'night' : 'nights'}`
                        )}
                      </span>
                      <span>{currency}{weekdayTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {weekendNightsCount > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>
                        {bookingType === 'single' ? (
                          `${currency}${weekendAveragePrice.toLocaleString('en-IN')} x ${weekendNightsCount} weekend ${weekendNightsCount === 1 ? 'night' : 'nights'}`
                        ) : (
                          `${roomsToBook} rooms x ${weekendNightsCount} weekend ${weekendNightsCount === 1 ? 'night' : 'nights'}`
                        )}
                      </span>
                      <span>{currency}{weekendTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Icon name="TagIcon" size={14} />
                        Bulk Discount Savings
                      </span>
                      <span>-{currency}{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-300">
                    <span>Platform Service Fee (10%)</span>
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
                  {hasFreeCancellation && (
                    <div className="flex justify-between text-sky-400">
                      <span className="flex items-center gap-1">
                        <Icon name="ShieldCheckIcon" size={14} />
                        Free Cancellation
                      </span>
                      <span>+{currency}70</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-sky-900/40 pt-3 flex justify-between font-bold text-base text-white">
                  <span>Total</span>
                  <span>{currency}{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {nights > 0 && bookingType === 'bulk' && roomsToBook === 0 && (
              <div className="pt-3 border-t border-slate-800/80 text-center animate-in fade-in">
                <p className="text-xs text-slate-400">Please select at least 1 room to view price breakdown</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Header: Price & Rating */}
            <div className="flex items-end justify-between mb-5 animate-in fade-in duration-300">
              <div>
                <span className="text-2xl font-bold text-white">
                  {bookingType === 'bulk'
                    ? (roomsToBook > 0
                        ? (nights > 0 ? `${currency}${total.toLocaleString()}` : `${currency}${bulkPerNightTotal.toLocaleString()}`)
                        : `${currency}0`
                      )
                    : `${currency}${(nights > 0 ? averagePrice : displayPrice).toLocaleString('en-IN')}`
                  }
                </span>
                <span className="text-stone-400 text-xs font-medium ml-1">
                  {bookingType === 'bulk'
                    ? (roomsToBook > 0
                        ? (nights > 0 ? '/ total' : `/ ${unitName.toLowerCase()} / night`)
                        : (nights > 0 ? '/ total' : `/ 0 ${unitsName.toLowerCase()}`)
                      )
                    : (nights > 0 ? '/ night (average)' : '/ night')
                  }
                </span>
                {displayWeekendPrice > 0 && !nights && (
                  <div className="text-[11px] text-sky-400 font-semibold mt-1 flex items-center gap-1.5 animate-pulse">
                    <Icon name="TagIcon" size={10} className="text-sky-400" />
                    Weekend: {currency}{displayWeekendPrice.toLocaleString('en-IN')} / night
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[13px] bg-sky-900/25 px-2.5 py-1 rounded-full border border-sky-500/20">
                <Icon name="StarIcon" size={12} variant="solid" className="text-amber-400" />
                <span className="font-semibold text-white">{rating.toFixed(2)}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400 font-medium">{reviewCount} reviews</span>
              </div>
            </div>

            {/* Booking Type Toggle */}
            {totalRooms > 1 && isBulkBookingAllowed && !hotelRoomTypes.includes('Entire Resort') && selectedHotelRoomType !== 'Entire Resort' && (
              <div className="mb-4 p-1 bg-gray-900/80 rounded-xl flex">
                <button
                  onClick={() => { setBookingType('single'); setSelectedRooms(1); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${bookingType === 'single'
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-900/40'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Single {unitName}
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
                  className="flex-1 select-none bg-gray-900/80 border border-gray-700/60 rounded-xl hover:border-sky-500/40 transition-colors overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCheckInOpen) {
                      setIsCheckOutOpen(false);
                      setIsCheckInOpen(true);
                    }
                  }}
                >
                  <div className="px-1 pt-2 pb-1 relative">
                    <p className="text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-0.5 group-hover:text-sky-400 transition-colors">Check-in</p>
                    <DatePicker
                      value={checkIn}
                      onChange={(newValue) => {
                        setCheckIn(newValue);
                        if (newValue) {
                          setIsCheckInOpen(false);
                          // Clear checkout if it's before new checkin
                          if (checkOut && newValue >= checkOut) {
                            setCheckOut(null);
                          }
                          // More substantial timeout to ensure popper removal and transition completion
                          setTimeout(() => {
                            setIsCheckOutOpen(true);
                          }, 400);
                        }
                      }}
                      open={isCheckInOpen}
                      onOpen={() => {
                        setIsCheckOutOpen(false);
                        setIsCheckInOpen(true);
                      }}
                      onClose={() => setIsCheckInOpen(false)}
                      minDate={new Date()}
                      format="dd MM yyyy"
                      desktopModeMediaQuery="@media (min-width: 0px)"
                      slotProps={{
                        textField: {
                          size: 'small',
                          placeholder: 'DD MM YYYY',
                          onKeyDown: (e: React.KeyboardEvent) => e.preventDefault(),
                          inputProps: { readOnly: true },
                        },
                        popper: { sx: popperSx }
                      }}
                      sx={datePickerSx}
                    />
                    <div className="absolute inset-0 z-10" />
                  </div>
                </div>

                {/* Check-out */}
                <div
                  className="flex-1 select-none bg-gray-900/80 border border-gray-700/60 rounded-xl hover:border-sky-500/40 transition-colors overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCheckOutOpen) {
                      setIsCheckInOpen(false);
                      setIsCheckOutOpen(true);
                    }
                  }}
                >
                  <div className="px-1 pt-2 pb-1 relative">
                    <p className="text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-0.5 group-hover:text-sky-400 transition-colors">Check-out</p>
                    <DatePicker
                      value={checkOut}
                      onChange={(newValue) => {
                        setCheckOut(newValue);
                        if (newValue) {
                          setIsCheckOutOpen(false);
                        }
                      }}
                      open={isCheckOutOpen}
                      onOpen={() => {
                        setIsCheckInOpen(false);
                        setIsCheckOutOpen(true);
                      }}
                      onClose={() => setIsCheckOutOpen(false)}
                      minDate={checkIn || new Date()}
                      format="dd MM yyyy"
                      desktopModeMediaQuery="@media (min-width: 0px)"
                      slotProps={{
                        textField: {
                          size: 'small',
                          placeholder: 'DD MM YYYY',
                          onKeyDown: (e: React.KeyboardEvent) => e.preventDefault(),
                          inputProps: { readOnly: true },
                        },
                        popper: { sx: popperSx }
                      }}
                      sx={datePickerSx}
                    />
                    <div className="absolute inset-0 z-10" />
                  </div>
                </div>
              </div>

              {/* Guest Input */}
              <div className="p-3 bg-gray-900/80 border border-gray-700/60 rounded-xl flex justify-between items-center group">
                <div>
                  <label className="block text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-0.5 group-hover:text-sky-400 transition-colors">
                    Guests
                  </label>
                  <div className="text-sm font-medium text-white">
                    {guests} {guests === 1 ? 'guest' : 'guests'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors"
                  >
                    <Icon name="MinusIcon" size={12} />
                  </button>
                  <button
                    onClick={() => setGuests(Math.min(maxGuests * (bookingType === 'bulk' ? Math.max(selectedRooms, selectedRoomIds.length) : 1), guests + 1))}
                    disabled={guests >= maxGuests * (bookingType === 'bulk' ? Math.max(selectedRooms, selectedRoomIds.length) : 1)}
                    className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors"
                  >
                    <Icon name="PlusIcon" size={12} />
                  </button>
                </div>
              </div>

              {/* Rooms Input (Only for Bulk) */}
              {bookingType === 'bulk' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(groupedRooms).map(([type, rooms]) => {
                      const availableInType = rooms.filter(r => r.is_available).length;
                      const selectedInType = selectedRoomCountsByType[type] || 0;
                      
                      if (availableInType === 0 && selectedInType === 0) return null;

                      return (
                        <div key={type} className="p-2 bg-gray-900/80 border border-gray-700/60 rounded-xl flex items-center justify-between gap-1.5 group">
                          <div className="min-w-0 flex-1">
                            <label className="block text-[9px] font-black text-sky-300/80 uppercase tracking-widest mb-0.5 group-hover:text-sky-400 transition-colors truncate">
                              {type}
                            </label>
                            <div className="text-[11px] font-bold text-white truncate">
                              {selectedInType} {selectedInType === 1 ? unitName.toLowerCase() : unitsName.toLowerCase()}
                            </div>
                            {isDateSelected && (availableInType - selectedInType) > 0 && (
                                <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${(availableInType - selectedInType) <= 2 ? 'text-amber-400' : 'text-sky-400/30'}`}>
                                    {(availableInType - selectedInType) === 1 ? '1 left' : `${availableInType - selectedInType} available`}
                                </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setSelectedRoomCountsByType(prev => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }))}
                              disabled={selectedInType <= 0}
                              className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors bg-black/20"
                            >
                              <Icon name="MinusIcon" size={8} />
                            </button>
                            <button
                              onClick={() => setSelectedRoomCountsByType(prev => ({ ...prev, [type]: Math.min(availableInType, (prev[type] || 0) + 1) }))}
                              disabled={selectedInType >= availableInType}
                              className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:border-sky-400 hover:text-sky-400 disabled:opacity-30 transition-colors bg-black/20"
                            >
                              <Icon name="PlusIcon" size={8} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {availableRooms > 1 && selectedRooms < availableRooms && (
                    <button
                      onClick={() => {
                          const allAvailable: Record<string, number> = {};
                          Object.entries(groupedRooms).forEach(([type, rooms]) => {
                              allAvailable[type] = rooms.filter(r => r.is_available).length;
                          });
                          setSelectedRoomCountsByType(allAvailable);
                      }}
                      className="w-full py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all border border-sky-500/20"
                    >
                      Book All Available {unitsName} ({availableRooms})
                    </button>
                  )}
                </div>
              )}

              {/* Sub-unit Selection UI */}
              {isDateSelected && availableRoomsList.length > 0 && (
                <div className="space-y-2 p-3 bg-gray-900/80 border border-gray-700/60 rounded-xl">
                  <label className="block text-[9px] font-bold text-sky-300/80 uppercase tracking-wider mb-2">
                    {bookingType === 'bulk' ? `Select Preferred ${unitsName}` : 'Selected Unit'}
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {availableRoomsList.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => {
                          if (bookingType === 'bulk') return;
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
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedRoomIds.includes(room.id)
                          ? 'bg-sky-500/15 border-sky-500 shadow-lg shadow-sky-900/20'
                          : room.is_available
                            ? `bg-gray-900/40 border-gray-700/50 ${bookingType === 'single' ? 'hover:border-sky-500/30 hover:bg-gray-800/60 cursor-pointer' : ''}`
                            : 'bg-red-950/5 border-red-900/20 opacity-50 cursor-not-allowed pointer-events-none'
                          } ${bookingType === 'bulk' ? 'cursor-default pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${selectedRoomIds.includes(room.id)
                            ? 'bg-sky-500 border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]'
                            : !room.is_available
                              ? 'border-gray-800 bg-gray-900/50'
                              : 'border-gray-600 bg-transparent'
                            }`}>
                            {selectedRoomIds.includes(room.id) && <Icon name="CheckIcon" size={12} className="text-black font-bold" />}
                            {!room.is_available && <Icon name="XMarkIcon" size={10} className="text-gray-600" />}
                          </div>
                          <div>
                            <span className={`text-sm font-bold ${!room.is_available ? 'text-gray-500' : 'text-white'}`}>{room.name}</span>
                            {selectedRoomIds.includes(room.id) && (
                              <p className="text-[10px] text-sky-400 font-medium">Selected for your stay</p>
                            )}
                            {!room.is_available && (
                              <p className="text-[10px] text-red-400/60 font-medium italic">
                                {room.status === 'maintenance' ? 'Under maintenance' : 'Currently unavailable'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {room.status === 'maintenance' ? (
                            <span className="text-[9px] font-black text-white uppercase tracking-widest px-2 py-1 rounded bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]">Maintenance</span>
                          ) : !room.is_available ? (
                            <span className="text-[9px] font-black text-white uppercase tracking-widest px-2 py-1 rounded bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]">Booked</span>
                          ) : null}
                          {selectedRoomIds.includes(room.id) && (
                            <div className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/30">
                              <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedRoomIds.length > 0 && (
                    <p className="text-[10px] text-sky-400 font-semibold mt-1">
                      {selectedRoomIds.length} {selectedRoomIds.length === 1 ? unitName.toLowerCase() : unitsName.toLowerCase()} selected
                    </p>
                  )}
                </div>
              )}

            </div>

            {/* Free Cancellation Option — only for same-day check-in */}
            {isSameDayCheckIn && (
              <div className="mb-5 bg-sky-900/10 border border-sky-500/20 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-r from-emerald-500/20 to-sky-500/20 px-4 py-2 border-b border-sky-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-500 rounded p-1">
                      <Icon name="CheckIcon" size={10} className="text-black" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enjoy Full Refund</span>
                  </div>
                  <div className="bg-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-sky-400 border border-sky-500/30">
                    FREE CANCELLATION
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div
                    onClick={() => setHasFreeCancellation(true)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${hasFreeCancellation
                      ? 'bg-sky-500/10 border-sky-500/50 shadow-inner'
                      : 'bg-black/20 border-gray-800 hover:border-gray-700'
                      }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasFreeCancellation ? 'border-sky-500' : 'border-gray-600'
                      }`}>
                      {hasFreeCancellation && <div className="w-2.5 h-2.5 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-bold text-white">Yes, I want Free Cancellation</p>
                        <span className="text-xs font-bold text-sky-400">₹70</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-400/90">
                          <Icon name="CheckCircleIcon" size={14} />
                          <span className="text-[11px] font-medium">Get full refund of {currency}{total.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Icon name="NoSymbolIcon" size={14} />
                          <span className="text-[11px] font-medium">₹0 Cancellation fee</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setHasFreeCancellation(false)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${!hasFreeCancellation
                      ? 'bg-zinc-800/50 border-gray-600'
                      : 'bg-black/20 border-gray-800 hover:border-gray-700'
                      }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${!hasFreeCancellation ? 'border-gray-400' : 'border-gray-600'
                      }`}>
                      {!hasFreeCancellation && <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-300">No, I don't want Free Cancellation</p>
                      <div className="space-y-1.5 mt-1.5">
                        <div className="flex items-center gap-2 text-amber-500/70">
                          <Icon name="ExclamationTriangleIcon" size={12} />
                          <span className="text-[11px] font-semibold">Only 50% refund will apply</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-sky-500/10">
                    <Icon name="InformationCircleIcon" size={14} className="text-sky-400/60 mt-0.5" />
                    <p className="text-[10px] text-gray-500 leading-relaxed italic">
                      Valid on cancellation upto 6 hours before scheduled check-in. T&C apply.
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* Primary CTA */}
            <button
              onClick={handleBookClick}
              disabled={!isBookable || checkingAvailability || !isOnline}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black font-bold rounded-xl py-3 text-base shadow-lg shadow-sky-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed mb-2"
            >
              {!isOnline ? (
                <div className="flex items-center justify-center gap-2">
                  <Icon name="WifiOff" size={18} />
                  Offline
                </div>
              ) : isBookable
                ? (nights ? (bookingType === 'bulk' ? 'Bulk booking' : 'Reserve') : 'Select dates')
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
            {nights > 0 && (bookingType === 'single' || roomsToBook > 0) && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-center text-sm text-gray-400">You won't be charged yet</p>
                <div className="space-y-3">
                  {weekdayNightsCount > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span className="underline decoration-gray-700">
                        {bookingType === 'single' ? (
                          `${currency}${weekdayAveragePrice.toLocaleString('en-IN')} x ${weekdayNightsCount} weekday ${weekdayNightsCount === 1 ? 'night' : 'nights'}`
                        ) : (
                          `${roomsToBook} ${roomsToBook === 1 ? unitName.toLowerCase() : unitsName.toLowerCase()} x ${weekdayNightsCount} weekday ${weekdayNightsCount === 1 ? 'night' : 'nights'}`
                        )}
                      </span>
                      <span>{currency}{weekdayTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {weekendNightsCount > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span className="underline decoration-gray-700">
                        {bookingType === 'single' ? (
                          `${currency}${weekendAveragePrice.toLocaleString('en-IN')} x ${weekendNightsCount} weekend ${weekendNightsCount === 1 ? 'night' : 'nights'}`
                        ) : (
                          `${roomsToBook} ${roomsToBook === 1 ? unitName.toLowerCase() : unitsName.toLowerCase()} x ${weekendNightsCount} weekend ${weekendNightsCount === 1 ? 'night' : 'nights'}`
                        )}
                      </span>
                      <span>{currency}{weekendTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {weekdayNightsCount > 0 && weekendNightsCount > 0 && (
                    <div className="flex justify-between text-xs text-stone-400 border-t border-white/10 pt-1.5 pb-0.5">
                      <span>Total ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                      <span>{currency}{baseTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Icon name="TagIcon" size={16} />
                        Bulk Discount Savings
                      </span>
                      <span>-{currency}{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-300">
                    <span className="underline decoration-gray-700">Platform Service Fee (10%)</span>
                    <span>{currency}{serviceFee.toLocaleString()}</span>
                  </div>
                  {upgradesTotal > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span className="flex items-center gap-1">
                        <Icon name="SparklesIcon" size={16} />
                        Exclusive Upgrades
                      </span>
                      <span>+{currency}{upgradesTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {hasFreeCancellation && (
                    <div className="flex justify-between text-sky-400">
                      <span className="flex items-center gap-1">
                        <Icon name="ShieldCheckIcon" size={16} />
                        Free Cancellation
                      </span>
                      <span>+{currency}70</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-sky-900/40 pt-4 flex justify-between font-bold text-lg text-white">
                  <span>Total</span>
                  <span>{currency}{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {nights > 0 && bookingType === 'bulk' && roomsToBook === 0 && (
              <div className="pt-2 text-center text-sm text-gray-400">
                <p>Please select at least 1 {unitName.toLowerCase()} to view price breakdown</p>
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
          roomCount: roomsToBook,
          nights: nights,
          pricePerNight: averagePrice,
          totalPrice: total,
          discount: discount,
          propertyName: 'this property' // We might want to pass name as prop too
        }}
      />
    </LocalizationProvider>
  );
};

export default BookingCard;
