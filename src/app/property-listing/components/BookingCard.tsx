'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface BookingCardProps {
  pricePerNight: number;
  currency: string;
  isAvailable: boolean;
  hostResponseRate: number;
  hostResponseTime: string;
}

const BookingCard = ({
  pricePerNight,
  currency,
  isAvailable,
  hostResponseRate,
  hostResponseTime,
}: BookingCardProps) => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-lg sticky top-24">
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights > 0 ? nights * pricePerNight : 0;
  };

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

  const subtotal = calculateTotal();
  const serviceFee = subtotal * 0.1;
  const gst = subtotal * 0.18;
  const total = subtotal + serviceFee + gst;

  const handleBookNow = () => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }
    router.push('/guest-booking-flow');
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-lg sticky top-24">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span className="text-4xl font-extrabold text-foreground">
            {currency}
            {pricePerNight.toLocaleString('en-IN')}
          </span>
          <span className="text-muted-foreground ml-2">/ night</span>
        </div>
        {isAvailable && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 rounded-full">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            <span className="text-sm font-semibold text-green-500">Available</span>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Includes taxes and fees. No hidden charges!
      </p>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              CHECK-IN
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 bg-muted border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              CHECK-OUT
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full p-3 bg-muted border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">GUESTS</label>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-primary hover:text-white transition-all"
              aria-label="Decrease guests"
            >
              <Icon name="MinusIcon" size={16} />
            </button>
            <span className="text-base font-bold text-foreground">
              {guests} {guests === 1 ? 'Guest' : 'Guests'}
            </span>
            <button
              onClick={() => setGuests(guests + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-primary hover:text-white transition-all"
              aria-label="Increase guests"
            >
              <Icon name="PlusIcon" size={16} />
            </button>
          </div>
        </div>
      </div>

      {nights > 0 && (
        <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="text-lg font-bold text-foreground mb-2">Price Details</h3>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {currency}
              {pricePerNight.toLocaleString('en-IN')} x {nights} nights
            </span>
            <span>
              {currency}
              {subtotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>StayCool service fee</span>
            <span>
              {currency}
              {serviceFee.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Taxes (GST)</span>
            <span>
              {currency}
              {gst.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="border-t border-border/50 my-2"></div>
          <div className="flex justify-between text-lg font-bold text-foreground">
            <span>Total</span>
            <span>
              {currency}
              {total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleBookNow}
        disabled={!isAvailable}
        className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] bg-primary text-white hover:shadow-primary/40 hover:shadow-lg"
      >
        {isAvailable ? 'Reserve Your Stay' : 'Currently Unavailable'}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-4">You won't be charged yet</p>

      <div className="mt-6 pt-6 border-t border-border flex justify-around text-center">
        <div>
          <p className="font-bold text-lg text-primary">{hostResponseRate}%</p>
          <p className="text-xs text-muted-foreground">Response Rate</p>
        </div>
        <div>
          <p className="font-bold text-lg text-primary">{hostResponseTime}</p>
          <p className="text-xs text-muted-foreground">Response Time</p>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
