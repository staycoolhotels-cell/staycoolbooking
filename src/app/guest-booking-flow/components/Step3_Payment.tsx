'use client';

import React from 'react';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { useFormState, useFormStatus } from 'react-dom';
import { createBooking } from '@/lib/booking-actions';

interface Step3Props {
  bookingCart: Property[];
  filters: any;
  onNext: () => void;
  onBack: () => void;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold"
    >
      {pending ? 'Booking...' : 'Confirm Booking'}
    </button>
  );
};

const Step3_Payment = ({ bookingCart, filters, onNext, onBack }: Step3Props) => {
  const nights = () => {
    if (!filters.checkIn || !filters.checkOut) return 1;
    const start = new Date(filters.checkIn);
    const end = new Date(filters.checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const subtotal = bookingCart.reduce((acc, p) => acc + (p.price || 0) * nights(), 0);
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  const bookingDetails = {
    propertyId: bookingCart[0].id,
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
    totalPrice: total,
    guests: filters.guests,
  };

  const [errorMessage, dispatch] = useFormState(
    createBooking.bind(null, bookingDetails),
    undefined
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 p-8 rounded-xl shadow-brand-md bg-card/50 backdrop-blur-md border border-brand-energetic/20">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Confirm and Pay</h2>
        <form action={dispatch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">
              Card Number
            </label>
            <div className="relative">
              <Icon
                name="CreditCardIcon"
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                className="w-full pl-10 p-3 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
                placeholder="**** **** **** ****"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                className="w-full p-3 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
                placeholder="MM / YY"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">CVC</label>
              <input
                type="text"
                className="w-full p-3 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
                placeholder="***"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 bg-muted/60 text-text-primary rounded-lg font-semibold"
            >
              Back
            </button>
            <SubmitButton />
          </div>
          {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
        </form>
      </div>
      <div className="p-8 rounded-xl shadow-brand-md bg-card/50 backdrop-blur-md border border-brand-energetic/20">
        <h3 className="text-xl font-bold text-text-primary mb-4">Booking Summary</h3>
        <div className="space-y-2">
          {bookingCart.map((p) => (
            <div key={p.id} className="flex justify-between text-sm text-text-primary">
              <span>{p.name}</span>
              <span>₹{p.price?.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border-secondary my-4"></div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-primary">Subtotal ({nights()} nights)</span>{' '}
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-primary">Service Fee (10%)</span>
            <span>₹{serviceFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3_Payment;
