'use client';

import React from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/lib/types';

interface BookingsProps {
  bookings: Booking[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Bookings = ({ bookings, searchTerm, setSearchTerm }: BookingsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">All Bookings</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search bookings..."
            className="px-4 py-2 border border-border rounded-lg bg-input text-text-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-lg font-semibold"
          >
            Filter
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
};

export default Bookings;
