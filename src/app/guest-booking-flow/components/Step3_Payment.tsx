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
        const { data, error } = await supabase
          .from('rooms')
          .select('id, name')
          .in('id', parsedRoomIds);
        
        if (!error && data) {
          setSelectedRooms(data);
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
  const baseTotal = pricePerNight * nightCount * effectiveRooms;

  // Calculate Bulk Discount
  let discount = 0;
  if (bookingType === 'bulk') {
    if (effectiveRooms === totalRooms && totalRooms > 1) {
      discount = baseTotal * 0.10; // 10%
    } else if (effectiveRooms >= 5) {
      discount = baseTotal * 0.05; // 5%
    }
  }

  const discountedSubtotal = Math.max(0, baseTotal - discount);
  const serviceFee = discountedSubtotal * 0.1;
  
  const amenitiesTotal = amenities.reduce((sum, amenity) => {
    const count = selectedAmenities[amenity.id] || 0;
    return sum + ((amenity.price || 0) * count);
  }, 0);

  const total = discountedSubtotal + serviceFee + amenitiesTotal;

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
        amenities: selectedAmenitiesList,
        selectedRoomIds: parsedRoomIds,
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
              reject(new Error('Payment cancelled. Please try again.'));
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
      console.error('Booking/Payment Error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 p-8 rounded-xl shadow-brand-md bg-card/50 backdrop-blur-md border border-brand-energetic/20">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Confirm Booking</h2>

        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Review your booking details and confirm your reservation.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Amenities Upsell Section */}
          {!loadingAmenities && amenities.length > 0 && (
            <div className="mt-8 border-t border-brand-energetic/20 pt-6">
              <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icon name="SparklesIcon" size={24} className="text-amber-400" />
                Enhance Your Stay
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {amenities.map(amenity => (
                  <div key={amenity.id} className={`p-4 rounded-xl bg-card border transition-colors flex flex-col justify-between ${selectedAmenities[amenity.id] ? 'border-sky-500/50 bg-sky-500/5' : 'border-border-secondary hover:border-sky-500/30'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-text-primary pr-2">{amenity.name}</h4>
                        <span className="text-sky-400 font-bold whitespace-nowrap">₹{(amenity.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 mb-4">{amenity.description}</p>
                    </div>
                    {amenity.type === 'Physical' || amenity.type === 'Service' ? (
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Quantity</span>
                        <div className="flex items-center gap-3 bg-background rounded-lg border border-border-secondary p-1">
                          <button 
                            type="button"
                            onClick={() => setSelectedAmenities(prev => ({ ...prev, [amenity.id]: Math.max(0, (prev[amenity.id] || 0) - 1)}))}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-sky-500/10 hover:text-sky-400 transition-colors"
                          >
                            <Icon name="MinusIcon" size={12} />
                          </button>
                          <span className="w-4 text-center text-sm font-semibold">{selectedAmenities[amenity.id] || 0}</span>
                          <button 
                            type="button"
                            onClick={() => setSelectedAmenities(prev => ({ ...prev, [amenity.id]: (prev[amenity.id] || 0) + 1}))}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-sky-500/10 hover:text-sky-400 transition-colors"
                          >
                            <Icon name="PlusIcon" size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                         <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Include</span>
                         <label className="relative inline-flex items-center cursor-pointer mb-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={!!selectedAmenities[amenity.id]}
                            onChange={(e) => setSelectedAmenities(prev => ({ ...prev, [amenity.id]: e.target.checked ? 1 : 0 }))}
                          />
                          <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="px-6 py-3 bg-muted/60 text-text-primary rounded-lg font-semibold disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleInitiatePayment}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin h-5 w-5" />}
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
      <div className="p-8 rounded-xl shadow-brand-md bg-card/50 backdrop-blur-md border border-brand-energetic/20">
        <h3 className="text-xl font-bold text-text-primary mb-4">Booking Summary</h3>
        <div className="space-y-2">
          {bookingCart.map((p) => (
            <div key={p.id} className="flex justify-between text-sm text-text-primary">
              <span>{p.name || p.title}</span>
              <span>₹{(p.price_per_night || p.price || 0).toLocaleString('en-IN')}</span>
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
          <div className="flex justify-between text-sm">
            <span className="text-text-primary">
              Subtotal ({nightCount} nights{effectiveRooms > 1 && ` x ${effectiveRooms} rooms`})
            </span>{' '}
            <span>₹{baseTotal.toLocaleString('en-IN')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Bulk Discount</span>
              <span>-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-primary text-sky-400">Service Fee (10%)</span>
            <span className="text-sky-400">₹{serviceFee.toLocaleString('en-IN')}</span>
          </div>
          {amenitiesTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-primary text-sky-400 font-medium">Add-ons (Amenities)</span>
              <span className="text-sky-400">+₹{amenitiesTotal.toLocaleString('en-IN')}</span>
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
