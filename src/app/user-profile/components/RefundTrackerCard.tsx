'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { format, addDays } from 'date-fns';
import { calculateRefundDistribution } from '@/lib/refund-policy';

interface RefundTrackerCardProps {
  booking?: any;
  guestName?: string;
  amount?: number;
  className?: string;
  onViewDetails?: () => void;
}

export const RefundTrackerCard: React.FC<RefundTrackerCardProps> = ({
  booking,
  guestName,
  amount,
  className = '',
  onViewDetails
}) => {
  const cancelDateObj = booking?.cancelled_at 
    ? new Date(booking.cancelled_at) 
    : (booking?.created_at ? new Date(booking.created_at) : new Date());

  let computedRefundAmount = amount || 0;
  let appliedPolicy = 'Standard Policy';

  if (!computedRefundAmount && booking) {
    if (booking.refund_amount) {
      computedRefundAmount = Number(booking.refund_amount);
    } else {
      const dist = calculateRefundDistribution(
        Number(booking.total_price || 0),
        booking.check_in,
        cancelDateObj,
        booking.created_at,
        booking.has_free_cancellation,
        booking.free_cancellation_fee || 0
      );
      computedRefundAmount = dist.guestRefundAmount;
      appliedPolicy = dist.appliedPolicy;
    }
  }

  const cancelDateFormatted = format(cancelDateObj, 'dd MMM');
  const refundInitiatedDateFormatted = format(cancelDateObj, 'dd MMM');
  const estimatedCreditRangeFormatted = `${format(addDays(cancelDateObj, 2), 'dd MMM')} - ${format(addDays(cancelDateObj, 7), 'dd MMM')}`;
  const displayName = guestName || booking?.guest?.name || 'Valued Guest';

  const isCompleted = booking?.refund_status === 'completed' || booking?.refund_status === 'refunded';

  return (
    <div className={`bg-[#111422] border border-white/10 rounded-xl p-3 sm:p-3.5 shadow-lg space-y-3 ${className}`}>
      {/* Card Header: Refund Amount & Guest */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-white/5">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-semibold text-zinc-300">
              Estimated Refund Amount :{' '}
              <span className="text-emerald-400 font-bold font-mono text-sm sm:text-base">
                ₹{computedRefundAmount.toLocaleString('en-IN')}
              </span>
            </span>
            <div 
              className="relative group cursor-pointer text-zinc-400 hover:text-white transition-colors" 
              title={`Refund calculated per cancellation policy (${appliedPolicy})`}
            >
              <Icon name="InformationCircleIcon" size={14} className="text-emerald-400/80" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <Icon name="UserIcon" size={12} className="text-zinc-500 shrink-0" />
            <span>Guest: <strong className="text-zinc-200">{displayName}</strong></span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-rose-500/10 border border-rose-500/25 text-rose-400">
            Cancelled
          </span>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-0.5 transition-colors hover:underline mt-0.5"
            >
              <span>View Details</span>
              <Icon name="ChevronRightIcon" size={11} />
            </button>
          )}
        </div>
      </div>

      {/* 3-Step Horizontal Stepper */}
      <div className="py-1 px-1 sm:px-2">
        <div className="relative flex items-start justify-between">
          {/* Connecting Progress Line (Behind circles) */}
          <div className="absolute top-3 sm:top-3.5 left-[16%] right-[16%] h-[2px] bg-zinc-700/60 -z-0">
            {/* Green progress fill */}
            <div 
              className={`h-full bg-emerald-500 ${isCompleted ? 'w-full' : 'w-1/2'} transition-all duration-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]`} 
            />
          </div>

          {/* Step 1: Cancelled */}
          <div className="relative z-10 flex flex-col items-center text-center w-1/3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-[0_0_10px_rgba(16,185,129,0.4)] border-2 border-[#111422]">
              <Icon name="CheckIcon" size={12} />
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-emerald-400 mt-1.5 leading-tight">
              Cancelled
            </p>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-medium">
              {cancelDateFormatted}
            </p>
          </div>

          {/* Step 2: Refund Initiated */}
          <div className="relative z-10 flex flex-col items-center text-center w-1/3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-[0_0_10px_rgba(16,185,129,0.4)] border-2 border-[#111422]">
              <Icon name="CheckIcon" size={12} />
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-zinc-200 mt-1.5 leading-tight">
              Refund Initiated
            </p>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 font-medium">
              {refundInitiatedDateFormatted}
            </p>
          </div>

          {/* Step 3: Refunded to account */}
          <div className="relative z-10 flex flex-col items-center text-center w-1/3">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${isCompleted ? 'bg-emerald-500 text-white border-2 border-[#111422] shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-zinc-800 text-zinc-400 border border-zinc-600 shadow-sm'} flex items-center justify-center font-bold text-[10px] sm:text-xs`}>
              {isCompleted ? <Icon name="CheckIcon" size={12} /> : '3'}
            </div>
            <p className={`text-[11px] sm:text-xs font-semibold ${isCompleted ? 'text-emerald-400' : 'text-zinc-400'} mt-1.5 leading-tight`}>
              Refunded to account
            </p>
            <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5 font-medium whitespace-nowrap">
              {estimatedCreditRangeFormatted}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundTrackerCard;
