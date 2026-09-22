import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, startOfDay } from 'date-fns';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/pdf-utils';
import RefundTrackerCard from './RefundTrackerCard';
import { calculateRefundDistribution } from '@/lib/refund-policy';

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

    const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in)) || 1;
    const isBulkBooking = booking.booking_type === 'bulk';
    const discountPct = isBulkBooking ? ((booking.bulk_booking_discount || (booking as any).properties?.bulk_booking_discount || 0) / 100) : 0;
    const totalPriceNum = Number(booking.total_price || 0);

    // Amenities & Cancellation Fee
    const amenitiesTotal = (booking as any).amenities?.reduce((sum: number, amenity: any) => sum + (amenity.price * amenity.count), 0) || 0;
    const freeCancellationFee = Number(booking.free_cancellation_fee || 0);

    // Derive base accommodation from the booking total:
    // totalPrice = (baseAccommodation * (1 - discountPct) + amenitiesTotal) * 1.1 + freeCancellationFee
    const accommodationPoolFromTotal = totalPriceNum > 0
        ? Math.round(Math.max(0, totalPriceNum - freeCancellationFee) / 1.1) - amenitiesTotal
        : 0;
    const expectedBase = Math.round(accommodationPoolFromTotal / (discountPct < 1 ? (1 - discountPct) : 1));

    let baseAccommodationFromRoomType = 0;
    if (booking.room_type) {
        booking.room_type.split(', ').forEach((type) => {
            const match = type.match(/^(.*)\s\((\d+)\)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
            const count = match ? parseInt(match[2]) : 1;
            const pricePerUnit = match && match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
            baseAccommodationFromRoomType += count * pricePerUnit * nights;
        });
    }

    let baseAccommodation = expectedBase;
    if (baseAccommodationFromRoomType > 0 && Math.abs(baseAccommodationFromRoomType - expectedBase) <= 50) {
        baseAccommodation = baseAccommodationFromRoomType;
    } else if (baseAccommodation <= 0) {
        baseAccommodation = baseAccommodationFromRoomType || Number(booking.properties?.standard_price || 0) * nights;
    }

    const discountSavings = Math.round(baseAccommodation * discountPct);
    const serviceFee = Math.max(0, totalPriceNum - (baseAccommodation - discountSavings + amenitiesTotal + freeCancellationFee));

    const displayRoomType = (() => {
        if (booking.room_type) return booking.room_type;
        const totalRooms = booking.total_rooms_booked || 1;
        const propertyRoomTypes = (booking.properties as any)?.room_types || 
                              ((booking.properties as any)?.room_type_counts 
                                ? Object.keys((booking.properties as any).room_type_counts) 
                                : []);
        const unitRate = nights > 0 ? Math.round(baseAccommodation / (totalRooms * nights)) : baseAccommodation;
        const roomName = propertyRoomTypes.length > 0 ? propertyRoomTypes[0] : 'Standard Room';
        return `${roomName} (${totalRooms}) ₹${unitRate.toLocaleString('en-IN')}`;
    })();

    const cancelDateObj = booking.cancelled_at ? new Date(booking.cancelled_at) : new Date(booking.created_at || Date.now());
    const computedRefund = calculateRefundDistribution(
        Number(booking.total_price || 0),
        booking.check_in,
        cancelDateObj,
        booking.created_at,
        booking.has_free_cancellation,
        booking.free_cancellation_fee || 0
    );
    const refundTransaction = transactions.find(t => t.id === booking.id && t.type === 'refund');
    const refundAmount = (booking as any).refund_amount || refundTransaction?.amount || computedRefund.guestRefundAmount || 0;
    const refundStatus = (booking as any).refund_status || refundTransaction?.status || 'pending';

    const getPropertyImage = (prop: Partial<Property>) => {
        if (prop.images && Array.isArray(prop.images) && prop.images.length > 0) {
            const first = prop.images[0] as any;
            return typeof first === 'string' ? first : (first.url || first);
        }
        return prop.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6';
    };

    const isPaymentPending = booking.status === 'pending_payment' || booking.status === 'payment_failed';

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'confirmed':
                return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
            case 'cancelled':
                return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'pending_payment':
                return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'payment_failed':
                return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                                        {booking.status.replace(/_/g, ' ')}
                                    </div>
                                    {booking.properties.type && (
                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-sky-500/10 text-sky-400 border-sky-500/20">
                                            {booking.properties.type.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* REFUND TRACKER TIMELINE (OTA / IRCTC STYLE) */}
                        {booking.status === 'cancelled' && (
                            <RefundTrackerCard
                                booking={booking}
                                guestName={transactions[0]?.guestName || (booking as any)?.guest?.name}
                                amount={refundAmount}
                            />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Dates */}
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-md bg-sky-500/10 text-sky-400">
                                            <Icon name="CalendarIcon" size={12} />
                                        </div>
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Duration</h4>
                                    </div>
                                    <div className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                                        <p className="text-[9px] font-black text-sky-400 uppercase tracking-tight">
                                            {differenceInDays(new Date(booking.check_out), new Date(booking.check_in))} {differenceInDays(new Date(booking.check_out), new Date(booking.check_in)) === 1 ? 'Night' : 'Nights'}
                                        </p>
                                    </div>
                                </div>

                                {/* Timing Information & Highlights */}
                                <div className="space-y-3 my-2">
                                    <div className="flex flex-col items-center py-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-8">
                                            <div className="text-center">
                                                <p className="text-[7px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Check-in After</p>
                                                <p className="text-xs font-black text-white">12:00 PM</p>
                                            </div>
                                            <div className="w-[1px] h-6 bg-zinc-800" />
                                            <div className="text-center">
                                                <p className="text-[7px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Check-out Before</p>
                                                <p className="text-xs font-black text-white">11:00 AM</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stay Highlights */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sky-500/5 border border-sky-500/10">
                                            <Icon name="CheckBadgeIcon" size={10} className="text-sky-400" />
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">Self Check-in</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                            <Icon name="ShieldCheckIcon" size={10} className="text-emerald-400" />
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">Verified Stay</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                            <Icon name="WifiIcon" size={10} className="text-amber-400" />
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">Free WiFi</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                                            <Icon name="SparklesIcon" size={10} className="text-indigo-400" />
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">Premium Host</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end text-white px-1">
                                    <div>
                                        <p className="text-[9px] text-zinc-500 font-medium">Check-in</p>
                                        <p className="text-sm font-bold leading-none mt-1">{format(new Date(booking.check_in), 'MMM dd')}</p>
                                        <p className="text-[9px] text-zinc-500 mt-1">{format(new Date(booking.check_in), 'yyyy')}</p>
                                    </div>
                                    
                                    <div className="flex-1 flex justify-center pb-1">
                                        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[9px] text-zinc-500 font-medium">Check-out</p>
                                        <p className="text-sm font-bold leading-none mt-1">{format(new Date(booking.check_out), 'MMM dd')}</p>
                                        <p className="text-[9px] text-zinc-500 mt-1">{format(new Date(booking.check_out), 'yyyy')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Guests & Units */}
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                <h4 className="text-[10px] font-medium text-zinc-400 mb-2 uppercase tracking-wider">Booking Size</h4>
                                <div className="flex flex-col gap-2.5 text-white">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
                                    {displayRoomType && (
                                        <div className="pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <div className="p-1 rounded-md bg-sky-500/10 text-sky-400">
                                                    <Icon name="KeyIcon" size={12} />
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Room Breakdown</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                {(() => {
                                                    const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in)) || 1;
                                                    return displayRoomType.split(', ').map((type, idx) => {
                                                        // Parse: "Standard Room (2) ₹700"
                                                        const match = type.match(/^(.*)\s\((\d+)\)(?:\s(?:₹|Rs\.)\s?([\d,.]+))?$/);
                                                        const name = match ? match[1] : type.split(' (')[0];
                                                        const count = match ? parseInt(match[2]) : 1;
                                                        const pricePerUnit = match && match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
                                                        // Multiply by nights so breakdown tallies with total
                                                        const lineTotal = count * pricePerUnit * nights;

                                                        return (
                                                            <div key={idx} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                                                <span className="text-[10px] font-semibold text-zinc-300 mr-2">{name}</span>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="text-[9px] font-medium text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                                                                        {count} {count === 1 ? 'Unit' : 'Units'}
                                                                    </span>
                                                                    {lineTotal > 0 && (
                                                                        <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded leading-none">
                                                                            ₹{lineTotal.toLocaleString('en-IN')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Invoice Section */}
                        {isPaymentPending ? (
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-amber-500/20 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                                            <Icon name="ClockIcon" size={14} />
                                        </div>
                                        <h3 className="text-sm md:text-base font-bold text-white">Invoice Unavailable</h3>
                                    </div>
                                    <p className="text-xs text-zinc-400">Tax invoice will be generated once payment is completed</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Payment Pending
                                </span>
                            </div>
                        ) : (
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-sky-500/30 transition-all">
                                <div className="space-y-0.5">
                                    <h3 className="text-base font-bold text-white">Invoice {booking.id.slice(0, 8).toUpperCase()}</h3>
                                    <p className="text-xs text-zinc-500">Download receipt</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            if (isPaymentPending) {
                                                toast.error('Invoice is only available after payment is completed.');
                                                return;
                                            }
                                            const isCancelled = booking.status === 'cancelled' || booking.status === 'refunded';
                                            const computedBreakdown = {
                                                accommodation: baseAccommodation,
                                                service_fee: serviceFee,
                                                taxes: 0,
                                                discount: booking.booking_type === 'bulk' ? discountSavings : 0,
                                                upgrades: amenitiesTotal,
                                                cancellation_fee: freeCancellationFee
                                            };
                                            
                                            // Construct rich transaction data matching exactly what is in modal
                                            const transactionData = {
                                                id: booking.id,
                                                transactionId: booking.id,
                                                invoice_id: booking.id.slice(0, 8).toUpperCase(),
                                                amount: booking.total_price,
                                                date: format(new Date(booking.created_at), 'dd/MM/yyyy'),
                                                status: booking.status,
                                                type: isCancelled ? 'refund' : 'payment',
                                                guestName: booking.guest?.name || 'Valued Guest',
                                                hostName: (booking.properties as any)?.host?.name || 'Host',
                                                guestAddress: (booking.guest as any)?.email || 'Address not provided',
                                                propertyName: booking.properties.title || (booking.properties as any)?.name || 'Property',
                                                booking_id: booking.id,
                                                room_type: displayRoomType,
                                                paymentMethod: 'Razorpay',
                                                breakdown: computedBreakdown,
                                                bookingDate: format(new Date(booking.created_at), 'dd MMM yyyy'),
                                                checkIn: format(new Date(booking.check_in), 'dd MMM yyyy'),
                                                checkOut: format(new Date(booking.check_out), 'dd MMM yyyy'),
                                                nights: nights,
                                                appliedPolicy: computedRefund.appliedPolicy,
                                                daysBeforeCheckIn: computedRefund.daysBeforeCheckIn,
                                                refundPercentage: computedRefund.guestRefundPercent,
                                                cancellationDate: booking.cancelled_at ? format(new Date(booking.cancelled_at), 'dd MMM yyyy') : undefined,
                                                refundAmount: refundAmount,
                                                retainedPenalty: Math.max(0, computedRefund.netRefundablePool - computedRefund.guestRefundAmount),
                                                retainedServiceFee: computedRefund.commissionAmount,
                                                netRefundablePool: computedRefund.netRefundablePool
                                            };

                                            await generateInvoicePDF(transactionData as any);
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
                        )}

                        {/* Selected Upsell Amenities */}
                        {(booking as any).amenities && (booking as any).amenities.length > 0 && (
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-sky-500/10 shadow-lg shadow-sky-500/5">
                                <h4 className="text-xs font-bold text-sky-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <Icon name="SparklesIcon" size={14} className="text-sky-400" />
                                    Selected Premium Services
                                </h4>
                                <div className="space-y-2.5">
                                    {(booking as any).amenities.map((amenity: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                                <span className="text-zinc-300 font-medium">
                                                    {amenity.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
                                                    Qty: {amenity.count}
                                                </span>
                                            </div>
                                            <span className="text-zinc-300 font-semibold">
                                                ₹{(amenity.price * amenity.count).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Details */}
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Payment Summary</h4>
                            <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-zinc-400">Accommodation Charges</span>
                                                <span className="text-white font-medium text-xs">₹{baseAccommodation.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-zinc-400">Platform Service Fee (10%)</span>
                                                <span className="text-white font-medium text-xs">₹{serviceFee.toLocaleString('en-IN')}</span>
                                            </div>
                                            {booking.booking_type === 'bulk' && discountSavings > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-emerald-400 font-medium">Bulk Discount Savings</span>
                                                    <span className="text-emerald-400 font-bold text-xs">
                                                        -₹{discountSavings.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}
                                            {amenitiesTotal > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-zinc-400">Exclusive Upgrades</span>
                                                    <span className="text-white font-medium text-xs">₹{amenitiesTotal.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            {freeCancellationFee > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-zinc-400">Cancellation Protection</span>
                                                    <span className="text-white font-medium text-xs">₹{freeCancellationFee.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">Total Amount</span>
                                    <span className="text-white font-bold text-lg">₹{booking.total_price.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">Status</span>
                                    <span className={`capitalize font-semibold ${
                                        booking.status === 'cancelled' 
                                            ? 'text-red-400' 
                                            : isPaymentPending 
                                                ? 'text-amber-400' 
                                                : 'text-white'
                                    }`}>
                                        {booking.status.replace(/_/g, ' ')}
                                    </span>
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
                                    <div className="pt-3 mt-3 border-t border-white/10 space-y-3">
                                        {/* Cancellation Policy Badge */}
                                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon name="InformationCircleIcon" size={15} className="text-rose-400 shrink-0" />
                                                <span className="text-xs text-rose-300 font-medium">Cancellation Policy</span>
                                            </div>
                                            <span className="text-xs font-bold text-rose-400">{computedRefund.appliedPolicy}</span>
                                        </div>

                                        {/* Refund & Deductions Breakdown */}
                                        <div className="space-y-2 bg-white/[0.03] p-3 rounded-xl border border-white/5 text-xs">
                                            <div className="flex justify-between items-center text-zinc-400">
                                                <span>Refundable Accommodation Pool</span>
                                                <span className="text-white font-medium">₹{computedRefund.netRefundablePool.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-zinc-400">
                                                <span>Refund Eligibility Rate</span>
                                                <span className="text-emerald-400 font-bold">{computedRefund.guestRefundPercent}%</span>
                                            </div>
                                            <div className="flex justify-between items-center text-zinc-400">
                                                <span>Cancellation Fee Retained</span>
                                                <span className="text-rose-400 font-medium">
                                                    -₹{(computedRefund.netRefundablePool - computedRefund.guestRefundAmount).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            {computedRefund.commissionAmount > 0 && (
                                                <div className="flex justify-between items-center text-zinc-400">
                                                    <span>Platform Service Fee (Non-refundable)</span>
                                                    <span className="text-zinc-500 font-medium">
                                                        -₹{computedRefund.commissionAmount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}
                                            {freeCancellationFee > 0 && (
                                                <div className="flex justify-between items-center text-zinc-400">
                                                    <span>Cancellation Protection Fee (Non-refundable)</span>
                                                    <span className="text-zinc-500 font-medium">
                                                        -₹{freeCancellationFee.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Final Net Refund Amount */}
                                        <div className="flex justify-between items-center text-sm pt-1">
                                            <div>
                                                <span className="text-zinc-200 font-semibold block">Total Refund to You</span>
                                                <span className="text-[11px] text-zinc-500">Returned to original payment method</span>
                                            </div>
                                            <span className="text-emerald-400 font-bold text-xl font-mono">₹{refundAmount.toLocaleString('en-IN')}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-400">Refund Status</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${refundStatus === 'completed' || refundStatus === 'refunded' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                                                <span className={`capitalize font-semibold text-xs ${refundStatus === 'completed' || refundStatus === 'refunded' ? 'text-emerald-400' : 'text-yellow-400'}`}>
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
                                        <li><span className="text-rose-400 font-semibold">No-Show Rule:</span> If guest fails to arrive on the scheduled check-in date and check-in time, it is treated as a No-Show with no refund, unless StayCool&apos;s applicable refund policy applies.</li>
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
