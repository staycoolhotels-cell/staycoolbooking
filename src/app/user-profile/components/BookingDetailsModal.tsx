import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, startOfDay } from 'date-fns';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';
import { toast } from 'sonner';

interface BookingDetailsModalProps {
    booking: (Booking & { properties: Partial<Property> }) | null;
    onClose: () => void;
    onStatusChange?: () => void;
}

const BookingDetailsModal = ({ booking, onClose, onStatusChange }: BookingDetailsModalProps) => {
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    if (!booking) return null;

    const getPropertyImage = (prop: Partial<Property>) => {
        if (prop.images && Array.isArray(prop.images) && prop.images.length > 0) {
            const first = prop.images[0] as any;
            return typeof first === 'string' ? first : (first.url || first);
        }
        return prop.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6';
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'confirmed':
                return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
            case 'cancelled':
                return 'text-red-400 bg-red-500/10 border-red-500/20';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f] sticky top-0 z-10">
                        <div>
                            <h2 className="text-xl font-heading font-bold text-white">Booking Details</h2>
                            <p className="text-sm text-zinc-400">Transaction ID: {booking.id.slice(0, 8)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        >
                            <Icon name="XMarkIcon" size={24} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {/* Property Image & Title */}
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden border border-white/10">
                                <img
                                    src={getPropertyImage(booking.properties)}
                                    alt={booking.properties.title || 'Property'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-2">{booking.properties.title}</h3>
                                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                                    <Icon name="MapPinIcon" size={16} className="text-sky-400" />
                                    <span>{booking.properties.location}</span>
                                </div>
                                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dates */}
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Dates</h4>
                                <div className="flex justify-between items-center text-white">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Check-in</p>
                                        <p className="font-semibold">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <Icon name="ArrowRightIcon" size={16} className="text-zinc-600" />
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500 mb-1">Check-out</p>
                                        <p className="font-semibold">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Guests */}
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Guests</h4>
                                <div className="flex items-center gap-3 text-white">
                                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                                        <Icon name="UserIcon" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{booking.guests} Guests</p>
                                        <p className="text-xs text-zinc-500">Occupancy for this stay</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Payment Summary</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">Total Amount</span>
                                    <span className="text-white font-bold text-lg">₹{booking.total_price.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">Status</span>
                                    <span className="text-white capitalize">{booking.status}</span>
                                </div>
                                <div className="pt-3 border-t border-white/5 text-xs text-zinc-500 flex items-center justify-between">
                                    <span>Booked on {format(new Date(booking.created_at), 'PPP')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Actions could go here */}
                    <div className="p-6 border-t border-white/10 bg-[#0a0a0f] flex justify-between items-center">
                        <div>
                            {booking.status === 'confirmed' && new Date(booking.check_in) > new Date() && (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors font-medium border border-red-500/20"
                                >
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium border border-white/10"
                        >
                            Close
                        </button>
                    </div>

                    {/* Cancel Confirmation Overlay */}
                    {showCancelConfirm && (
                        <div className="absolute inset-0 z-20 bg-[#0a0a0f]/95 backdrop-blur-md flex items-center justify-center p-6">
                            <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                                <div className="flex items-center gap-3 mb-4 text-red-400">
                                    <Icon name="ExclamationTriangleIcon" size={24} />
                                    <h3 className="text-xl font-bold">Cancel This Booking?</h3>
                                </div>
                                <p className="text-zinc-300 mb-6 text-sm leading-relaxed">
                                    Are you sure you want to cancel your stay at <strong>{booking.properties.title}</strong>? 
                                    Depending on when your check-in date is, our cancellation policy applies to calculate your refund amount.
                                </p>
                                
                                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 mb-6 text-xs text-zinc-400 space-y-2">
                                    <p><strong className="text-zinc-300">Policy Reminder:</strong></p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>7+ Days Before: 100% Refund</li>
                                        <li>5-7 Days Before: 70% Refund</li>
                                        <li>2-4 Days Before: 30% Refund</li>
                                        <li>Check-in Day: No Refund</li>
                                    </ul>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        disabled={isCancelling}
                                        onClick={() => setShowCancelConfirm(false)}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                                    >
                                        Keep Booking
                                    </button>
                                    <button
                                        disabled={isCancelling}
                                        onClick={async () => {
                                            setIsCancelling(true);
                                            try {
                                                const res = await fetch('/api/bookings/cancel', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ bookingId: booking.id })
                                                });
                                                const data = await res.json();
                                                
                                                if (data.error) throw new Error(data.error);
                                                
                                                toast.success(
                                                    `Booking Cancelled! Expected Refund: ₹${data.refundAmount?.toLocaleString('en-IN')}`, 
                                                    { duration: 5000 }
                                                );
                                                setShowCancelConfirm(false);
                                                if (onStatusChange) onStatusChange();
                                            } catch (err: any) {
                                                toast.error(err.message || "Failed to cancel booking");
                                            } finally {
                                                setIsCancelling(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isCancelling ? 'Processing...' : 'Yes, Cancel Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BookingDetailsModal;
