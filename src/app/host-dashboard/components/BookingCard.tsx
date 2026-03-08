'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Booking } from '@/lib/types';
import { approveBooking } from '@/lib/booking-actions';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createDispute } from '@/lib/dispute-actions';
import { toast } from 'sonner';

interface BookingCardProps {
  booking: Booking;
  onAction: (tab: string) => void;
}

const getStatusStyles = (status: Booking['status']) => {
  switch (status) {
    case 'confirmed':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.1)]',
        indicator: 'bg-emerald-400 animate-pulse',
        glow: 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0'
      };
    case 'pending':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.1)]',
        indicator: 'bg-amber-400 animate-pulse',
        glow: 'from-amber-500/0 via-amber-500/20 to-amber-500/0'
      };
    case 'cancelled':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        shadow: 'shadow-[0_0_15px_rgba(248,113,113,0.1)]',
        indicator: 'bg-red-400',
        glow: 'from-red-500/0 via-red-500/20 to-red-500/0'
      };
    case 'completed':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]',
        indicator: 'bg-blue-400',
        glow: 'from-blue-500/0 via-blue-500/20 to-blue-500/0'
      };
    case 'pending_payment':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/20',
        shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.1)]',
        indicator: 'bg-orange-400 animate-pulse',
        glow: 'from-orange-500/0 via-orange-500/20 to-orange-500/0'
      };
    default:
      return {
        bg: 'bg-zinc-500/10',
        text: 'text-zinc-400',
        border: 'border-zinc-500/20',
        shadow: '',
        indicator: 'bg-zinc-400',
        glow: 'from-transparent via-zinc-500/20 to-transparent'
      };
  }
};

const BookingCard = ({ booking, onAction }: BookingCardProps) => {
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueType, setIssueType] = useState('Damage to property');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const statusStyles = getStatusStyles(booking.status);

  return (
    <div className="relative group overflow-hidden bg-[#0a0a0f] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-all duration-500">

      {/* Animated Top Border Glow */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${statusStyles.glow}`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 gap-6 relative z-10">

        {/* Guest & Property Info */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-colors bg-zinc-900 flex items-center justify-center">
              {booking.guest?.avatar_url ? (
                <img
                  src={booking.guest.avatar_url}
                  alt={booking.guest?.name || 'Guest'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="UserIcon" size={24} className="text-zinc-600" />
              )}
            </div>
            {/* Status Dot Ring */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0a0a0f] rounded-full flex items-center justify-center border border-white/10">
              <div className={`w-2.5 h-2.5 rounded-full ${statusStyles.indicator}`} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-heading font-black text-white truncate">{booking.guest?.name || 'Guest Profile'}</h3>
              <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border backdrop-blur-md ${statusStyles.bg} ${statusStyles.border} ${statusStyles.text} ${statusStyles.shadow}`}>
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-zinc-400 font-bold truncate flex items-center gap-2 mb-2">
              <Icon name="HomeIcon" size={14} className="text-zinc-500" /> {booking.properties?.title || 'External Asset'}
            </p>
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 py-1.5 px-3 rounded-lg w-fit">
              <Icon name="CalendarDaysIcon" size={14} className="text-indigo-400" />
              <p suppressHydrationWarning className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-widest leading-none">
                {new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} <span className="text-zinc-600 font-normal mx-1">→</span> {new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Approvals */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:pl-6 md:border-l border-white/5 shrink-0">

          {booking.status === 'pending' && (
            <button
              onClick={() => approveBooking(booking.id)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(52,211,153,0.15)] group/approve"
            >
              <Icon name="CheckCircleIcon" size={18} className="group-hover/approve:scale-110 transition-transform" /> Auth Release
            </button>
          )}

          <div className="flex items-center justify-between sm:justify-start gap-2 h-full">
            <button
              onClick={() => onAction('unified-inbox')}
              className="flex-1 sm:flex-none h-[42px] px-4 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={16} /> <span className="sm:hidden">Message</span>
            </button>

            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="flex-1 sm:flex-none h-[42px] px-4 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/10 text-red-500/60 hover:text-red-400 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Icon name="ScaleIcon" size={16} /> <span className="sm:hidden">Dispute</span>
            </button>
          </div>
        </div>

      </div>

      {/* Dispute Modal (Ultra-Premium) */}
      <AnimatePresence>
        {isDisputeModalOpen && (
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingCard;
