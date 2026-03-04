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

const BookingCard = ({ booking, onAction }: BookingCardProps) => {
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueType, setIssueType] = useState('Damage to property');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const statusClasses = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    pending_payment: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all hover:bg-zinc-900/60 group">
      <div className="flex items-center space-x-4">
        <div className="relative shrink-0">
          <img
            src={booking.guest?.avatar_url || 'https://via.placeholder.com/48'}
            alt={booking.guest?.name || 'Guest'}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/10 group-hover:border-primary/30 transition-colors object-cover"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800">
            <div className={`w-2 h-2 rounded-full ${booking.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-base md:text-lg truncate">{booking.guest?.name || 'Guest'}</p>
          <p className="text-xs md:text-sm text-zinc-400 font-medium truncate">{booking.properties?.title || 'Stays Property'}</p>
          <div className="flex items-center gap-2 mt-1">
            <Icon name="CalendarIcon" size={12} className="text-zinc-500" />
            <p suppressHydrationWarning className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-wider">
              {new Date(booking.check_in).toLocaleDateString()} — {new Date(booking.check_out).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${booking.status === 'confirmed'
                ? 'bg-green-500/10 border-green-500/30 text-green-500'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
              }`}
          >
            {booking.status.replace('_', ' ')}
          </span>
          {booking.status === 'pending' && (
            <button
              onClick={() => approveBooking(booking.id)}
              className="px-4 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all active:scale-95"
            >
              Approve
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction('unified-inbox')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 hover:text-sky-400 transition-all active:scale-90"
            title="Chat"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={18} />
          </button>
          <button
            onClick={() => setIsDisputeModalOpen(true)}
            className="p-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/10 text-red-500/60 hover:text-red-500 transition-all active:scale-90"
            title="File Dispute"
          >
            <Icon name="ScaleIcon" size={18} />
          </button>
        </div>
      </div>

      {/* Dispute Modal */}
      <AnimatePresence>
        {isDisputeModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 shadow-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                  <Icon name="ScaleIcon" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Raise a Dispute</h3>
                  <p className="text-sm text-zinc-500">For booking: {booking.id.slice(0, 8)}...</p>
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
                    hostName: 'Current Host', // Ideally pass host name from context
                    propertyName: booking.properties?.title || 'Property',
                    issueType,
                    description,
                    priority,
                  });

                  if (res.success) {
                    toast.success("Dispute raised successfully.");
                    setIsDisputeModalOpen(false);
                    setDescription('');
                  } else {
                    toast.error("Failed: " + res.error);
                  }
                  setIsSubmitting(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Dispute Category</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="Damage to property">Damage to property</option>
                    <option value="House rules violation">House rules violation</option>
                    <option value="Extra guests without notice">Extra guests without notice</option>
                    <option value="Smoking/Noise complaints">Smoking/Noise complaints</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Detailed Context</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-red-500"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${priority === p
                          ? 'bg-red-500/20 border-red-500 text-red-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsDisputeModalOpen(false)}
                    className="px-4 py-2 text-zinc-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
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
