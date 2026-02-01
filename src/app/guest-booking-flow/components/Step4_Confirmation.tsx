'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';

const Step4_Confirmation = () => {
  const router = useRouter();
  return (
    <div className="p-8 rounded-xl shadow-brand-md max-w-2xl mx-auto text-center bg-card/50 backdrop-blur-md border border-brand-energetic/20">
      <div className="p-6 bg-success/20 rounded-full inline-block">
        <Icon name="CheckIcon" size={48} className="text-success" />
      </div>
      <h2 className="text-3xl font-bold text-text-primary mt-6">Booking Confirmed!</h2>
      <p className="text-text-secondary mt-2">
        Your booking has been successfully confirmed. You will receive an email with all the
        details.
      </p>
      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={() => router.push('/user-profile')}
          className="px-6 py-3 bg-muted/60 text-text-primary rounded-lg font-semibold"
        >
          {' '}
          View Bookings
        </button>
        <button
          onClick={() => router.push('/homepage')}
          className="px-6 py-3 bg-primary text-white rounded-lg font-semibold"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Step4_Confirmation;
