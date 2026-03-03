'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { createBooking } from '@/lib/booking-actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  const total = discountedSubtotal + serviceFee;

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Booking (Confirmed/Pending)
      const bookingDetails = {
        propertyId: bookingCart[0].id,
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        totalPrice: total,
        guests: filters.guests,
        bookingType,
        roomCount: effectiveRooms,
      };

      const bookingRes = await createBooking(bookingDetails, null);

      if ('error' in bookingRes && bookingRes.error) {
        throw new Error(bookingRes.error);
      }

      if (!('data' in bookingRes) || !bookingRes.data) {
        throw new Error('Failed to create booking');
      }
      const newBookingId = bookingRes.data[0].id;

      // 2. Direct Confirmation (Bypass Payment)
      const { approveBooking } = await import('@/lib/booking-actions');
      await approveBooking(newBookingId);

      toast.success('Booking confirmed successfully!');
      onNext();

    } catch (err: any) {
      console.error('Booking Error:', err);
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
            <span className="text-text-primary">Service Fee (10%)</span>
            <span>₹{serviceFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
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
