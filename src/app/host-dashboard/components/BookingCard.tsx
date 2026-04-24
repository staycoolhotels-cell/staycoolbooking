'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Booking } from '@/lib/types';
import { approveBooking, rejectBooking } from '@/lib/booking-actions';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createDispute } from '@/lib/dispute-actions';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

interface BookingCardProps {
  booking: Booking;
  onAction: (tab: string, data?: any) => void;
}

const getStatusStyles = (status: Booking['status']) => {
  switch (status) {
    case 'confirmed':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30',
        shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]',
        indicator: 'bg-emerald-400 animate-pulse',
        glow: 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0'
      };
    case 'pending':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
        shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]',
        indicator: 'bg-amber-400 animate-pulse',
        glow: 'from-amber-500/0 via-amber-500/20 to-amber-500/0'
      };
    case 'cancelled':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-300',
        border: 'border-red-500/30',
        shadow: 'shadow-[0_0_15px_rgba(248,113,113,0.15)]',
        indicator: 'bg-red-400',
        glow: 'from-red-500/0 via-red-500/20 to-red-500/0'
      };
    case 'completed':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        indicator: 'bg-blue-400',
        glow: 'from-blue-500/0 via-blue-500/20 to-blue-500/0'
      };
    case 'pending_payment':
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-300',
        border: 'border-orange-500/30',
        shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
        indicator: 'bg-orange-400 animate-pulse',
        glow: 'from-orange-500/0 via-orange-500/20 to-orange-500/0'
      };
    default:
      return {
        bg: 'bg-zinc-500/20',
        text: 'text-zinc-300',
        border: 'border-zinc-500/30',
        shadow: '',
        indicator: 'bg-zinc-400',
        glow: 'from-transparent via-zinc-500/20 to-transparent'
      };
  }
};

const BookingCard = ({ booking, onAction }: BookingCardProps) => {
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [issueType, setIssueType] = useState('Damage to property');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statusStyles = getStatusStyles(booking.status);

  return (
    <div className="relative group overflow-hidden bg-[#0a0a0f] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-all duration-500">

      {/* Animated Top Border Glow */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${statusStyles.glow}`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 gap-5 relative z-10">
        {/* Guest & Property Info */}
        <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-colors bg-zinc-900 flex items-center justify-center">
                {booking.guest?.avatar_url ? (
                  <img
                    src={booking.guest.avatar_url}
                    alt={booking.guest?.name || 'Guest'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon name="UserIcon" size={20} className="text-zinc-600" />
                )}
              </div>
              {/* Status Dot Ring */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0a0f] rounded-full flex items-center justify-center border border-white/10">
                <div className={`w-2 h-2 rounded-full ${statusStyles.indicator}`} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
                <h3 className="text-base md:text-lg font-bold text-white truncate leading-tight max-w-[150px] sm:max-w-none">
                  {booking.guest?.name?.trim() ? booking.guest.name : 'Verified Guest'}
                </h3>
                <span className={`px-2.5 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-md border backdrop-blur-md shrink-0 flex items-center justify-center w-fit ${statusStyles.bg} ${statusStyles.border} ${statusStyles.text} ${statusStyles.shadow}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-xs md:text-sm text-zinc-300 font-bold truncate flex items-center gap-2 mt-1 md:mt-1.5">
                <Icon name="HomeIcon" size={14} className="text-indigo-400 shrink-0" /> <span className="truncate">{booking.properties?.title || booking.properties?.name || 'Property'}</span>
              </p>
            </div>
          </div>

          {/* Date Container (Full Width) */}
          <div className="flex items-center gap-2.5 bg-white/[0.05] border border-white/10 py-2.5 px-3 md:px-4 rounded-xl w-full shadow-inner shrink-0">
            <Icon name="CalendarDaysIcon" size={16} className="text-indigo-400 shrink-0" />
            <div suppressHydrationWarning className="text-[11px] md:text-[13px] text-white font-bold uppercase tracking-widest leading-tight flex flex-wrap items-center gap-x-2 flex-1 min-w-0">
              <span className="text-white whitespace-nowrap">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-zinc-500 font-normal">→</span>
              <span className="text-white whitespace-nowrap">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-indigo-300 font-black ml-0.5 whitespace-nowrap">{new Date(booking.check_out).getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Actions & Approvals */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 md:gap-3 md:pl-6 md:border-l border-white/5 shrink-0 mt-4 md:mt-0 w-full md:w-auto">

          {booking.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                disabled={isApproving || isRejecting}
                onClick={async () => {
                    setIsApproving(true);
                    try {
                        await approveBooking(booking.id);
                        toast.success('Successfully authorized the release!');
                    } catch (err: any) {
                        toast.error('Failed to authorize release. Please try again.');
                    } finally {
                        setIsApproving(false);
                    }
                }}
                className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(52,211,153,0.15)] group/approve disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <Icon name="ArrowPathIcon" size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> 
                ) : (
                  <Icon name="CheckCircleIcon" size={16} className="group-hover/approve:scale-110 transition-transform md:w-[18px] md:h-[18px]" /> 
                )}
                <span>{isApproving ? 'Authorizing...' : 'Auth Release'}</span>
              </button>

              <button
                disabled={isApproving || isRejecting}
                onClick={async () => {
                    if (confirm('Are you sure you want to reject this booking? This will count towards your cancellation record.')) {
                      setIsRejecting(true);
                      try {
                          await rejectBooking(booking.id);
                          toast.success('Booking rejected successfully.');
                      } catch (err: any) {
                          toast.error('Failed to reject booking.');
                      } finally {
                          setIsRejecting(false);
                      }
                    }
                }}
                className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-500 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.15)] group/reject disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <Icon name="ArrowPathIcon" size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> 
                ) : (
                  <Icon name="NoSymbolIcon" size={16} className="group-hover/reject:scale-110 transition-transform md:w-[18px] md:h-[18px]" /> 
                )}
                <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
              </button>
            </div>
          )}

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-1.5 md:gap-3 w-full sm:w-auto">
            <button
              onClick={() => onAction('unified-inbox', {
                guest_id: booking.guest_id,
                sender_name: booking.guest?.name || 'Verified Guest',
                sender_avatar: booking.guest?.avatar_url,
                property_id: booking.property_id,
                property_name: booking.properties?.title || booking.properties?.name || 'Property'
              })}
              className="flex-1 sm:flex-none h-[36px] md:h-[48px] px-2 md:px-6 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg md:rounded-xl border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all font-bold text-[8px] md:text-[12px] uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-2"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={14} className="shrink-0 md:w-[18px] md:h-[18px]" /> <span>Message</span>
            </button>

            {booking.status === 'confirmed' && (
              <button
                disabled={isRejecting}
                onClick={async () => {
                  if (confirm('Are you sure you want to cancel this confirmed booking? This will count towards your cancellation record and may incur penalties.')) {
                    setIsRejecting(true);
                    try {
                      await rejectBooking(booking.id);
                      toast.success('Booking cancelled successfully.');
                    } catch (err: any) {
                      toast.error('Failed to cancel booking.');
                    } finally {
                      setIsRejecting(false);
                    }
                  }
                }}
                className="flex-1 sm:flex-none h-[36px] md:h-[48px] px-2 md:px-6 bg-red-500/10 hover:bg-red-500/20 rounded-lg md:rounded-xl border border-red-500/20 text-red-500 hover:text-red-400 transition-all font-bold text-[8px] md:text-[12px] uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              >
                <Icon name="NoSymbolIcon" size={14} className="shrink-0 md:w-[18px] md:h-[18px]" />
                <span>{isRejecting ? 'Wait' : 'Cancel'}</span>
              </button>
            )}

            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="flex-1 sm:flex-none h-[36px] md:h-[48px] px-2 md:px-6 bg-red-500/5 hover:bg-red-500/10 rounded-lg md:rounded-xl border border-red-500/10 text-red-500/60 hover:text-red-400 transition-all font-bold text-[8px] md:text-[12px] uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-2"
            >
              <Icon name="ScaleIcon" size={14} className="shrink-0 md:w-[18px] md:h-[18px]" /> <span>Dispute</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dispute Modal (Ultra-Premium) */}
      <AnimatePresence>
        {isDisputeModalOpen && mounted && createPortal(
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#0a0a0f] border border-red-500/20 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_100px_rgba(220,38,38,0.15)] overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Deep Ambient Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]">
                  <Icon name="ScaleIcon" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-heading font-black text-white drop-shadow-lg">Dispute Initiator</h3>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Target ID: {booking.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  const res = await createDispute({
                    booking_id: booking.id,
                    guest_id: booking.guest_id,
                    host_id: booking.properties?.host_id || '',
                    property_id: booking.property_id,
                    guestName: booking.guest?.name || 'Guest',
                    hostName: 'Current Host',
                    propertyName: booking.properties?.title || 'Property',
                    issueType,
                    description,
                    priority,
                  });

                  if (res.success) {
                    toast.success("Dispute escalation successfully recorded.");
                    setIsDisputeModalOpen(false);
                    setDescription('');
                  } else {
                    toast.error("Escalation failed: " + res.error);
                  }
                  setIsSubmitting(false);
                }}
                className="space-y-6 relative z-10"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dispute Classification</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-red-500/50 hover:border-white/30 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="Damage to property" className="bg-zinc-900">Physical Asset Damage</option>
                    <option value="House rules violation" className="bg-zinc-900">Policy Breach Configuration</option>
                    <option value="Extra guests without notice" className="bg-zinc-900">Unauthorized Occupancy</option>
                    <option value="Smoking/Noise complaints" className="bg-zinc-900">Environmental Disturbance</option>
                    <option value="Other" className="bg-zinc-900">Unclassified Anomaly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tactical Assessment (Details)</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a comprehensive breakdown of the incident..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-red-500/50 hover:border-white/30 transition-all font-medium placeholder:text-zinc-600 resize-none"
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Severity Matrix</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${priority === p
                          ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)] scale-[1.02]'
                          : 'bg-white/5 border-transparent text-zinc-500 hover:text-white/80 hover:bg-white/10'
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 mt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsDisputeModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="w-full sm:w-auto px-8 py-3.5 bg-red-600/90 hover:bg-red-500 border border-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                  >
                    <Icon name={isSubmitting ? "ArrowPathIcon" : "BoltIcon"} size={16} className={isSubmitting ? "animate-spin" : ""} />
                    {isSubmitting ? 'Transmitting...' : 'Execute Escalation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingCard;
