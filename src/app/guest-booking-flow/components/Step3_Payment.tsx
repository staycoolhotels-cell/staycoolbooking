'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { createBooking } from '@/lib/booking-actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface Step3Props {
  bookingCart: Property[];
  filters: any;
  onNext: () => void;
  onBack: () => void;
}

const Step3_Payment = ({ bookingCart, filters, onNext, onBack }: Step3Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  const [amenities, setAmenities] = useState<any[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(filters.amenities || '{}');
    } catch {
      return {};
    }
  });
  const [loadingAmenities, setLoadingAmenities] = useState(true);

  // Room details for summary
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const parsedRoomIds = useMemo(() => {
    try {
      return JSON.parse(filters.selectedRoomIds || '[]');
    } catch {
      return [];
    }
  }, [filters.selectedRoomIds]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (parsedRoomIds.length > 0) {
        setLoadingRooms(true);
        try {
          const { data, error } = await supabase
            .from('rooms')
            .select('id, name, room_type')
            .in('id', parsedRoomIds);
          
          if (!error && data) {
            setSelectedRooms(data);
          }
        } finally {
          setLoadingRooms(false);
        }
      }
    };
    fetchRoomDetails();
  }, [parsedRoomIds]);

  useEffect(() => {
    const fetchAmenities = async () => {
      setLoadingAmenities(true);
      const property = bookingCart?.[0];
      if (property?.host_id) {
        const { data, error } = await supabase
          .from('amenities')
          .select('*')
          .eq('host_id', property.host_id)
          .eq('is_active', true)
          .order('name');
        
        if (!error && data) {
          setAmenities(data);
        }
      }
      setLoadingAmenities(false);
    };
    fetchAmenities();
  }, [bookingCart]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Safety check: ensure bookingCart has items
  if (!bookingCart || bookingCart.length === 0) {
    return (
      <div className="p-8 rounded-xl shadow-brand-md bg-card/50 backdrop-blur-md border border-brand-energetic/20">
        <div className="text-center py-12">
          <Icon name="ExclamationTriangleIcon" size={48} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">No Property Selected</h3>
          <p className="text-text-secondary mb-6">Please select a property to continue with booking.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { bookingType = 'single', roomCount = 1 } = filters;
  const property = bookingCart[0];
  const totalRooms = property?.total_rooms || 1;
  const propertyType = property?.type || property?.tier || 'Room';
  const safePropertyType = propertyType || 'Room';
  const isTent = safePropertyType.toLowerCase().trim() === 'tent' || safePropertyType.toLowerCase().trim() === 'tents';
  const unitName = isTent ? 'Tent' : 'Room';
  const unitsName = isTent ? 'Tents' : 'Rooms';

  const nights = () => {
    if (!filters.checkIn || !filters.checkOut) return 0;
    const start = new Date(filters.checkIn);
    const end = new Date(filters.checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const nightCount = nights();
  // Base calculation without service fee
  const pricePerNight = property?.price_per_night || property?.price || 0;
  // If bulk, multiply by roomCount
  const effectiveRooms = bookingType === 'bulk' ? roomCount : 1;

  const getRoomPrice = (roomType: string | null) => {
    const roomTypePrices = property?.room_type_prices || {};
    if (!roomType || !roomTypePrices || Object.keys(roomTypePrices).length === 0) return pricePerNight;
    const price = roomTypePrices[roomType];
    return price ? Number(price) : pricePerNight;
  };

  const stayDates = useMemo(() => {
    if (!filters.checkIn || !filters.checkOut) return [];
    const dates: Date[] = [];
    const start = new Date(filters.checkIn);
    const end = new Date(filters.checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    const current = new Date(start.getTime());
    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [filters.checkIn, filters.checkOut]);

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const getRoomPriceForDate = (roomType: string | null, date: Date) => {
    const isWeekendDay = isWeekend(date);
    const roomTypeWeekendPrices = property?.room_type_weekend_prices || {};
    const weekendPrice = property?.weekend_price_per_night || property?.weekendPrice || 0;
    const roomTypePrices = property?.room_type_prices || {};

    if (isWeekendDay) {
      // 1. Check room type weekend price
      if (roomType && roomTypeWeekendPrices[roomType] !== undefined && Number(roomTypeWeekendPrices[roomType]) > 0) {
        return Number(roomTypeWeekendPrices[roomType]);
      }
      // 2. Check property-level weekend price
      if (weekendPrice && Number(weekendPrice) > 0) {
        return Number(weekendPrice);
      }
    }

    // Regular weekday price
    if (roomType && roomTypePrices[roomType] !== undefined) {
      return Number(roomTypePrices[roomType]);
    }
    return pricePerNight;
  };

  const weekdayTotal = useMemo(() => {
    if (nightCount <= 0 || stayDates.length === 0) return 0;
    const weekdayDates = stayDates.filter(d => !isWeekend(d));
    if (weekdayDates.length === 0) return 0;

    if (bookingType === 'single') {
        const selectedRoom = selectedRooms[0];
        const roomType = selectedRoom ? selectedRoom.room_type : null;
        return weekdayDates.reduce((sum, date) => sum + getRoomPriceForDate(roomType, date), 0);
    } else {
        if (selectedRooms.length > 0) {
            return selectedRooms.reduce((roomSum, room) => {
              const roomType = room.room_type;
              return roomSum + weekdayDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(roomType, date), 0);
            }, 0);
        }
        if (parsedRoomIds.length > 0) return 0;
        return weekdayDates.reduce((sum, date) => sum + (getRoomPriceForDate(null, date) * effectiveRooms), 0);
    }
  }, [nightCount, bookingType, selectedRooms, pricePerNight, property?.room_type_prices, effectiveRooms, stayDates, parsedRoomIds]);

  const weekendTotal = useMemo(() => {
    if (nightCount <= 0 || stayDates.length === 0) return 0;
    const weekendDates = stayDates.filter(isWeekend);
    if (weekendDates.length === 0) return 0;

    if (bookingType === 'single') {
        const selectedRoom = selectedRooms[0];
        const roomType = selectedRoom ? selectedRoom.room_type : null;
        return weekendDates.reduce((sum, date) => sum + getRoomPriceForDate(roomType, date), 0);
    } else {
        if (selectedRooms.length > 0) {
            return selectedRooms.reduce((roomSum, room) => {
              const roomType = room.room_type;
              return roomSum + weekendDates.reduce((dateSum, date) => dateSum + getRoomPriceForDate(roomType, date), 0);
            }, 0);
        }
        if (parsedRoomIds.length > 0) return 0;
        return weekendDates.reduce((sum, date) => sum + (getRoomPriceForDate(null, date) * effectiveRooms), 0);
    }
  }, [nightCount, bookingType, selectedRooms, pricePerNight, property?.room_type_prices, property?.room_type_weekend_prices, property?.weekend_price_per_night, effectiveRooms, stayDates, parsedRoomIds]);

  const baseTotal = useMemo(() => {
    return weekdayTotal + weekendTotal;
  }, [weekdayTotal, weekendTotal]);

  const weekendNightsCount = useMemo(() => {
    return stayDates.filter(isWeekend).length;
  }, [stayDates]);

  const weekdayNightsCount = useMemo(() => {
    return nightCount - weekendNightsCount;
  }, [nightCount, weekendNightsCount]);

  const weekdayAveragePrice = useMemo(() => {
    if (weekdayNightsCount <= 0) return 0;
    return weekdayTotal / (bookingType === 'single' ? weekdayNightsCount : (weekdayNightsCount * effectiveRooms));
  }, [weekdayNightsCount, weekdayTotal, bookingType, effectiveRooms]);

  const weekendAveragePrice = useMemo(() => {
    if (weekendNightsCount <= 0) return 0;
    return weekendTotal / (bookingType === 'single' ? weekendNightsCount : (weekendNightsCount * effectiveRooms));
  }, [weekendNightsCount, weekendTotal, bookingType, effectiveRooms]);

  const serviceFee = baseTotal * 0.1;

  // Calculate Bulk Discount using property's custom discount
  let discount = 0;
  const bulkDiscountPercentage = property?.bulk_booking_discount !== undefined && property?.bulk_booking_discount !== null ? property.bulk_booking_discount : 10;

  if (bookingType === 'bulk') {
    // If it's a bulk booking, apply the custom discount percentage
    discount = baseTotal * (bulkDiscountPercentage / 100);
  }

  const discountedSubtotal = Math.max(0, baseTotal - discount);
  
  const amenitiesTotal = amenities.reduce((sum, amenity) => {
    const count = selectedAmenities[amenity.id] || 0;
    return sum + ((amenity.price || 0) * count);
  }, 0);

  const freeCancellationFee = filters.hasFreeCancellation ? 70 : 0;
  const total = discountedSubtotal + serviceFee + amenitiesTotal + freeCancellationFee;


  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Booking (status = pending_payment)
      const selectedAmenitiesList = Object.entries(selectedAmenities)
         .filter(([id, count]) => count > 0)
         .map(([id, count]) => {
            const amenity = amenities.find(a => a.id === id);
            return {
              id,
              count,
              price: amenity?.price || 0,
              name: amenity?.name || '',
            };
         });

      const bookingDetails = {
        propertyId: bookingCart[0].id,
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        totalPrice: total,
        guests: filters.guests,
        bookingType,
        roomCount: effectiveRooms,
        bulkBookingDiscount: bookingType === 'bulk' ? bulkDiscountPercentage : 0,
        amenities: selectedAmenitiesList,
        selectedRoomIds: parsedRoomIds,
        hasFreeCancellation: filters.hasFreeCancellation,
        freeCancellationFee: freeCancellationFee,
      };


      const bookingRes = await createBooking(bookingDetails, null);

      if ('error' in bookingRes && bookingRes.error) {
        throw new Error(bookingRes.error);
      }

      if (!('data' in bookingRes) || !bookingRes.data) {
        throw new Error('Failed to create booking');
      }
      const newBookingId = bookingRes.data[0].id;

      // 2. Create Razorpay Order via API
      const orderRes = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: newBookingId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const { orderId, amount, keyId } = orderData;

      // 3. Open Razorpay Checkout Popup
      await new Promise<void>((resolve, reject) => {
        const options: any = {
          key: keyId,
          amount: amount,
          currency: 'INR',
          name: 'Stay Cool',
          description: `Booking #${newBookingId.slice(0, 8)}`,
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // 4. Verify signature on our server
              const verifyRes = await fetch('/api/payment/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  bookingId: newBookingId,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                reject(new Error(verifyData.error || 'Payment verification failed'));
                return;
              }

              toast.success('Payment successful! Booking confirmed.');
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          prefill: {},
          theme: { color: '#0ea5e9' },
          modal: {
            ondismiss: () => {
              // Instead of a generic error, we use a specific string we can catch
              reject(new Error('PAYMENT_CANCELLED'));
            },
          },
        };

        if (!isRazorpayLoaded || typeof (window as any).Razorpay === 'undefined') {
          reject(new Error('Razorpay failed to load. Please refresh and try again.'));
          return;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          const description = response?.error?.description || '';
          const reason = response?.error?.reason || '';
          // Provide a clearer message for international card errors
          if (
            description.toLowerCase().includes('international') ||
            reason.toLowerCase().includes('international')
          ) {
            toast.error('Only Indian debit/credit cards, UPI, and net banking are accepted. Please use an Indian payment method.');
          } else {
            console.error('Payment failed:', description || 'Please try again.');
          }
        });
        rzp.open();
      });

      // 5. Navigate to success page
      onNext();

    } catch (err: any) {
      if (err.message === 'PAYMENT_CANCELLED') {
        console.log('User cancelled the payment modal.');
        // Don't show a scary error toast, just stop loading
      } else {
        console.error('Booking/Payment Error:', err);
        setError(err.message || 'An unexpected error occurred.');
        toast.error(err.message || 'Payment failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-4 sm:p-6 rounded-xl shadow-brand-md bg-card/50 backdrop-blur-md border border-brand-energetic/20">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">Confirm Booking</h2>

        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Review your booking details and confirm your reservation.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* New Filler Section: Property Highlights & Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-400 mb-3 flex items-center gap-2">
                <Icon name="InformationCircleIcon" size={14} />
                House Rules
              </h3>
              <ul className="space-y-2">
                {[
                  `Check-in: After ${property?.check_in_time || '12:00 PM'}`,
                  `Check-out: Before ${property?.check_out_time || '11:00 AM'}`,
                  'No smoking inside the property',
                  'Pets are subject to approval'
                ].map((rule, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-text-secondary group-hover:text-text-primary transition-colors">
                    <div className="w-1 h-1 bg-sky-500 rounded-full" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-3 flex items-center gap-2">
                <Icon name="ShieldCheckIcon" size={14} />
                Stay Safe
              </h3>
              <ul className="space-y-2">
                {[
                  'Verified Host & Property',
                  '24/7 Support available',
                  'Secure payment gateway',
                  'Flexible cancellation options'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-text-secondary group-hover:text-text-primary transition-colors">
                    <Icon name="CheckIcon" size={12} className="text-purple-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Amenities Upsell Section */}
          {!loadingAmenities && amenities.length > 0 && (
            <div className="mt-6 border-t border-brand-energetic/20 pt-4">
              <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                <Icon name="SparklesIcon" size={20} className="text-amber-400" />
                Enhance Your Stay
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {amenities.map(amenity => (
                  <div key={amenity.id} className={`p-3 rounded-xl bg-card border transition-colors flex flex-col justify-between ${selectedAmenities[amenity.id] ? 'border-sky-500/50 bg-sky-500/5' : 'border-border-secondary hover:border-sky-500/30'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="text-sm font-semibold text-text-primary pr-2">{amenity.name}</h4>
                        <span className="text-sky-400 text-sm font-bold whitespace-nowrap">₹{(amenity.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-2 mb-3">{amenity.description}</p>
                    </div>
                    {amenity.type === 'Physical' || amenity.type === 'Service' ? (
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold">Quantity</span>
                        <div className="flex items-center gap-2 bg-background rounded-lg border border-border-secondary p-0.5">
                          <button 
                            type="button"
                            onClick={() => setSelectedAmenities(prev => ({ ...prev, [amenity.id]: Math.max(0, (prev[amenity.id] || 0) - 1)}))}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-sky-500/10 hover:text-sky-400 transition-colors"
                          >
                            <Icon name="MinusIcon" size={10} />
                          </button>
                          <span className="w-3 text-center text-xs font-semibold">{selectedAmenities[amenity.id] || 0}</span>
                          <button 
                            type="button"
                            onClick={() => setSelectedAmenities(prev => ({ ...prev, [amenity.id]: (prev[amenity.id] || 0) + 1}))}
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-sky-500/10 hover:text-sky-400 transition-colors"
                          >
                            <Icon name="PlusIcon" size={10} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                         <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold">Include</span>
                         <label className="relative inline-flex items-center cursor-pointer mb-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={!!selectedAmenities[amenity.id]}
                            onChange={(e) => setSelectedAmenities(prev => ({ ...prev, [amenity.id]: e.target.checked ? 1 : 0 }))}
                          />
                          <div className="w-8 h-4.5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="px-5 py-2.5 bg-muted/60 text-text-primary rounded-lg font-semibold disabled:opacity-50 text-sm"
            >
              Back
            </button>
            <button
              onClick={handleInitiatePayment}
              disabled={loading || loadingRooms}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              {(loading || loadingRooms) && <Loader2 className="animate-spin h-4 w-4" />}
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6 rounded-xl shadow-brand-md bg-card/50 backdrop-blur-md border border-brand-energetic/20 h-fit relative overflow-hidden">
        {loadingRooms && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin h-6 w-6 text-sky-400" />
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Updating Prices...</span>
            </div>
          </div>
        )}
        <h3 className="text-lg font-bold text-text-primary mb-3">Booking Summary</h3>
        <div className="space-y-2">
          {bookingCart.map((p) => (
            <div key={p.id} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm text-text-primary">
                <span>{p.name || p.title}</span>
                <span>₹{(p.price_per_night || p.price || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>
                  {filters.guests} {filters.guests === 1 ? 'Guest' : 'Guests'} • {effectiveRooms} {effectiveRooms === 1 ? unitName : unitsName}
                </span>
              </div>
            </div>
          ))}
          {selectedRooms.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Selected Units</p>
              <div className="flex flex-wrap gap-2">
                {selectedRooms.map(room => (
                  <span key={room.id} className="px-2 py-1 bg-sky-500/10 border border-sky-500/20 rounded text-[10px] font-semibold text-sky-200">
                    {room.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-border-secondary my-4"></div>
        <div className="space-y-2">
          {weekdayNightsCount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-primary">
                Weekday Charges ({weekdayNightsCount} {weekdayNightsCount === 1 ? 'night' : 'nights'}{effectiveRooms > 1 && ` x ${effectiveRooms} ${unitsName.toLowerCase()}`})
              </span>
              <span>₹{weekdayTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          {weekendNightsCount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-primary text-sky-400 font-medium">
                Weekend Charges ({weekendNightsCount} {weekendNightsCount === 1 ? 'night' : 'nights'}{effectiveRooms > 1 && ` x ${effectiveRooms} ${unitsName.toLowerCase()}`})
              </span>
              <span className="text-sky-400 font-bold">₹{weekendTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          {weekdayNightsCount > 0 && weekendNightsCount > 0 && (
            <div className="flex justify-between text-xs text-text-secondary border-t border-white/5 pt-1.5 pb-0.5">
              <span>Total ({nightCount} {nightCount === 1 ? 'night' : 'nights'})</span>
              <span>₹{baseTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Bulk Discount Savings</span>
              <span>-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-primary text-sky-400">Platform Service Fee (10%)</span>
            <span className="text-sky-400">₹{serviceFee.toLocaleString('en-IN')}</span>
          </div>
          {amenitiesTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-primary text-sky-400 font-medium">Add-ons (Amenities)</span>
              <span className="text-sky-400">+₹{amenitiesTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
          {filters.hasFreeCancellation && (
            <div className="flex justify-between text-sm text-sky-400">
              <span className="flex items-center gap-1">
                <Icon name="ShieldCheckIcon" size={14} />
                Free Cancellation
              </span>
              <span>+₹70</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-border-secondary">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>

          {total > 100000 && (
            <>
              <div className="border-t border-border-secondary my-4"></div>
              <div className="p-3 bg-brand-energetic/10 rounded-lg border border-brand-energetic/30">
                <p className="text-xs text-brand-energetic mb-2 font-medium">
                  High Value Booking Policy (&gt; ₹1L)
                </p>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-text-primary">Pay Online Now (50%)</span>
                  <span>₹{(total / 2).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Pay at Property (50%)</span>
                  <span>₹{(total / 2).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step3_Payment;
