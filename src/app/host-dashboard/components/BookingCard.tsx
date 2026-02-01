'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Booking } from '@/lib/types';
import { approveBooking } from '@/lib/booking-actions';

interface BookingCardProps {
  booking: Booking;
}

const BookingCard = ({ booking }: BookingCardProps) => {
  const statusClasses = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to p-4 rounded-lg shadow-md flex items-center justify-between">
      {/* <div className="flex items-center space-x-4">
        <img
          src={booking.guestAvatar}
          alt={booking.guestName}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="font-bold text-text-primary">{booking.guestName}</p>
          <p className="text-sm text-text-secondary">{booking.property}</p>
          <p className="text-sm text-text-secondary">{booking.dates}</p>
        </div>
      </div> */}
      <div className="flex items-center space-x-4">
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${
            statusClasses[booking.status]
          }`}
        >
          {booking.status}
        </span>
        {booking.status === 'pending' && (
          <button
            onClick={() => approveBooking(booking.id)}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
          >
            Approve
          </button>
        )}
        <button className="p-2 bg-muted rounded-full hover:bg-muted-foreground">
          <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-text-secondary" />
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
