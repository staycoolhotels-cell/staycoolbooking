'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';

interface Step4ConfirmationProps {
  latitude?: number;
  longitude?: number;
  address?: string;
}

const Step4_Confirmation = ({ latitude, longitude, address }: Step4ConfirmationProps) => {
  const router = useRouter();

  // Construct the directions URL
  const directionsUrl = latitude && longitude 
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : address 
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
      : null;

  return (
    <div className="p-5 sm:p-8 rounded-xl shadow-brand-md max-w-2xl mx-auto text-center bg-card/50 backdrop-blur-md border border-brand-energetic/20">
      <div className="p-4 sm:p-5 bg-success/20 rounded-full inline-block">
        <Icon name="CheckIcon" size={40} className="text-success" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mt-4 sm:mt-5">Booking Confirmed!</h2>
      <p className="text-text-secondary text-sm sm:text-base mt-2">
        Your booking has been successfully confirmed. You will receive an email with all the
        details.
      </p>

      {directionsUrl && (
        <div className="mt-6 p-5 sm:p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[11px] sm:text-sm text-zinc-400 mb-3 sm:mb-4 font-medium uppercase tracking-wider">Want to know how to get there?</p>
          <a 
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-sky-500/20 text-sm sm:text-base"
          >
            <Icon name="MapIcon" size={18} />
            <span>Get Directions</span>
          </a>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={() => router.push('/user-profile')}
          className="w-full sm:w-auto px-6 py-2.5 bg-muted/60 text-text-primary rounded-lg font-semibold text-sm"
        >
          View Bookings
        </button>
        <button
          onClick={() => router.push('/homepage')}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Step4_Confirmation;
