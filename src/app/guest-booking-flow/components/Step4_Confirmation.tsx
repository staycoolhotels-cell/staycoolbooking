'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';

interface Step4ConfirmationProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  cancellationPolicy?: string;
  hasFreeCancellation?: boolean;
  propertyName?: string;
  checkInDate?: string;
}

const Step4_Confirmation = ({
  latitude,
  longitude,
  address,
  cancellationPolicy = 'Standard',
  hasFreeCancellation = false,
  propertyName,
  checkInDate,
}: Step4ConfirmationProps) => {
  const router = useRouter();

  const isTieredPolicy = (cancellationPolicy || '').toLowerCase().includes('tier');

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

      {/* Cancellation Policy Display Card */}
      <div className="mt-6 p-4 sm:p-5 bg-white/[0.04] border border-white/10 rounded-2xl text-left">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Icon name="CalendarDaysIcon" size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Applicable Cancellation Policy</p>
              <p className="text-[11px] text-zinc-400">Policy applied to this property reservation</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            isTieredPolicy
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}>
            {isTieredPolicy ? 'Tiered Policy' : 'Standard Policy'}
          </span>
        </div>

        {hasFreeCancellation && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
            <Icon name="ShieldCheckIcon" size={18} className="text-emerald-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-400">Free Cancellation (₹70) Active: </span>
              <span className="text-zinc-300">You are eligible for a 100% full refund of the base booking amount if cancelled before check-in.</span>
            </div>
          </div>
        )}

        <div className="space-y-1.5 text-xs text-zinc-300 bg-black/40 p-3.5 rounded-xl border border-white/5">
          {isTieredPolicy ? (
            <>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">10+ Days Before Check-in:</span>
                <span className="font-bold text-emerald-400">100% Refund</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">5 – 9 Days Before Check-in:</span>
                <span className="font-bold text-sky-400">70% Refund</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">2 – 4 Days Before Check-in:</span>
                <span className="font-bold text-amber-400">50% Refund</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">&lt; 2 Days Before Check-in:</span>
                <span className="font-bold text-rose-400">30% Refund</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">Cancel Before Check-in:</span>
                <span className="font-bold text-sky-400">70% Refund</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px] text-zinc-500">
                <span>Standard Retained Penalty:</span>
                <span>30%</span>
              </div>
            </>
          )}
          <div className="pt-2 border-t border-white/5 flex items-start gap-1.5 text-[11px] text-zinc-400">
            <Icon name="AlertCircleIcon" size={13} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <span><strong>StayCool No-Show Rule:</strong> 0% refund if the guest fails to arrive at the property on scheduled check-in date/time.</span>
          </div>
        </div>
      </div>

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
