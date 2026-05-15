import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, startOfDay } from 'date-fns';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/pdf-utils';

interface BookingDetailsModalProps {
    booking: (Booking & { properties: Partial<Property> }) | null;
    transactions?: any[];
    onClose: () => void;
    onStatusChange?: () => void;
}

const BookingDetailsModal = ({ booking, transactions = [], onClose, onStatusChange }: BookingDetailsModalProps) => {
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    if (!booking) return null;

    const refundTransaction = transactions.find(t => t.id === booking.id && t.type === 'refund');
    const refundAmount = refundTransaction?.amount || 0;
    const refundStatus = refundTransaction?.status || 'pending';

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
                    className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0a0a0f] sticky top-0 z-10">
                        <div>
                            <h2 className="text-lg font-heading font-bold text-white">Booking Details</h2>
                            <p className="text-xs text-zinc-400">ID: {booking.id.slice(0, 8)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        >
                            <Icon name="XMarkIcon" size={20} />
                        </button>
                    </div>

                    <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {/* Property Image & Title */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                                <img
                                    src={getPropertyImage(booking.properties)}
                                    alt={booking.properties.title || 'Property'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6';
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-white mb-1">{booking.properties.title}</h3>
                                <div className="flex items-center gap-2 text-zinc-400 text-xs mb-3">
                                    <Icon name="MapPinIcon" size={14} className="text-sky-400" />
                                    <span>{booking.properties.location}</span>
                                </div>
                                <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Dates */}
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                <h4 className="text-[10px] font-medium text-zinc-400 mb-2 uppercase tracking-wider">Dates</h4>
                                <div className="flex justify-between items-center text-white">
                                    <div>
                                        <p className="text-[10px] text-zinc-500">In</p>
                                        <p className="text-xs font-semibold">{format(new Date(booking.check_in), 'MMM dd')}</p>
                                    </div>
                                    <Icon name="ArrowRightIcon" size={12} className="text-zinc-600" />
                                    <div className="text-right">
                                        <p className="text-[10px] text-zinc-500">Out</p>
                                        <p className="text-xs font-semibold">{format(new Date(booking.check_out), 'MMM dd')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Guests & Units */}
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                <h4 className="text-[10px] font-medium text-zinc-400 mb-2 uppercase tracking-wider">Booking Size</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                                            <Icon name="UserIcon" size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold whitespace-nowrap">{booking.guests || 1} {(booking.guests || 1) === 1 ? 'Guest' : 'Guests'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                                            <Icon name="HomeIcon" size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold whitespace-nowrap">{booking.total_rooms_booked || 1} {(booking.total_rooms_booked || 1) === 1 ? (booking.properties.type?.toLowerCase().includes('tent') ? 'Tent' : 'Room') : (booking.properties.type?.toLowerCase().includes('tent') ? 'Tents' : 'Rooms')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Section */}
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-sky-500/30 transition-all">
                            <div className="space-y-0.5">
                                <h3 className="text-base font-bold text-white">Invoice {booking.id.slice(0, 8).toUpperCase()}</h3>
                                <p className="text-xs text-zinc-500">Download receipt</p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const transaction = transactions.find(t => t.id === booking.id);
                                        
                                        // Construct an on-the-fly transaction object if one doesn't exist
                                        const transactionData = {
                                            id: booking.id,
                                            invoice_id: booking.id.slice(0, 8).toUpperCase(),
                                            amount: booking.total_price,
                                            date: format(new Date(booking.created_at), 'dd/MM/yyyy'),
                                            status: booking.status,
                                            type: (booking.status === 'cancelled' || booking.status === 'refunded') ? 'refund' : 'payment',
                                            guestName: booking.guest?.name || 'Valued Guest',
                                            guestAddress: (booking.guest as any)?.email || 'Address not provided',
                                            propertyName: booking.properties.title || 'Property',
                                            booking_id: booking.id,
                                            paymentMethod: 'Razorpay', // Default fallback
                                            breakdown: {
                                                accommodation: booking.total_price * 0.78,
                                                service_fee: booking.total_price * 0.20,
                                                taxes: booking.total_price * 0.02
                                            }
                                        };

                                        await generateInvoicePDF(transaction || (transactionData as any));
                                    } catch (err) {
                                        console.error('Invoice generation failed:', err);
                                        toast.error('Failed to generate invoice. Please try again.');
                                    }
                                }}
                                className="p-3 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 hover:text-white transition-all shadow-lg shadow-sky-900/10"
                                title="Download Invoice"
                            >
                                <Icon name="ArrowDownTrayIcon" size={24} />
                            </button>
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
                                    <span className={`capitalize ${booking.status === 'cancelled' ? 'text-red-400' : 'text-white'}`}>{booking.status}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-white/5">
                                    <span className="text-zinc-400">Booking Type</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.booking_type === 'bulk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                                            {booking.booking_type === 'bulk' ? 'Bulk Booking' : 'Normal Booking'}
                                        </span>
                                        {booking.booking_type === 'bulk' && (booking.bulk_booking_discount || booking.properties?.bulk_booking_discount) && (
                                            <span className="text-emerald-400 text-xs font-bold">
                                                ({booking.bulk_booking_discount || booking.properties?.bulk_booking_discount}% Off)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {booking.status === 'cancelled' && (
                                    <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">Refund Amount</span>
                                            <span className="text-emerald-400 font-bold text-lg">₹{refundAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">Refund Status</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${refundStatus === 'completed' || refundStatus === 'refunded' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                                <span className={`capitalize font-medium ${refundStatus === 'completed' || refundStatus === 'refunded' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                                    {refundStatus === 'refunded' ? 'Processed' : refundStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-white/5 text-xs text-zinc-500 flex items-center justify-between">
                                    <span>Booked on {format(new Date(booking.created_at), 'PPP')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Actions could go here */}
                    <div className="p-6 border-t border-white/10 bg-[#0a0a0f] flex justify-between items-center">
                        <div className="flex gap-3">
                            {(['confirmed', 'pending', 'pending_payment'].includes(booking.status.toLowerCase())) && 
                             startOfDay(new Date(booking.check_in)) >= startOfDay(new Date()) && (
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
                                        <li>Within 6 hrs of booking: 100% Refund (Excl. Platform Fee)</li>
                                        <li>10+ Days Before Check-in: 100% Refund (Excl. Platform Fee)</li>
                                        <li>5-10 Days Before: 70% Refund (Excl. Platform Fee)</li>
                                        <li>2-5 Days Before: 50% Refund (Excl. Platform Fee)</li>
                                        <li>Less than 2 Days: 30% Refund (Excl. Platform Fee)</li>
                                        <li><span className="text-sky-400 font-semibold">Free Cancellation (₹70):</span> 100% Refund always.</li>
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
