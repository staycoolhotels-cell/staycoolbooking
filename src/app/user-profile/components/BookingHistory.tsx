'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';
import { format } from 'date-fns';
import BookingDetailsModal from './BookingDetailsModal';
import LeaveReviewModal from './LeaveReviewModal';
import { Star } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

type BookingHistoryProps = {
    bookings: (Booking & { properties: Partial<Property> })[];
    guestId?: string;
};

const BookingHistory = ({ bookings, guestId }: BookingHistoryProps) => {
    const [showAll, setShowAll] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<(Booking & { properties: Partial<Property> }) | null>(null);
    const [reviewBooking, setReviewBooking] = useState<(Booking & { properties: Partial<Property> }) | null>(null);
    const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

    // On mount: fetch which bookings are already reviewed from DB
    useEffect(() => {
        if (!guestId) return;
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const bookingIds = bookings.map(b => b.id).filter(Boolean);
        if (bookingIds.length === 0) return;

        supabase
            .from('reviews')
            .select('booking_id')
            .eq('reviewer_id', guestId)
            .in('booking_id', bookingIds)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    setReviewedIds(new Set(data.map((r: any) => r.booking_id)));
                }
            });
    }, [guestId, bookings]);

    // Sort bookings by date (most recent first)
    const sortedBookings = [...bookings].sort(
        (a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
    );

    const displayedBookings = showAll ? sortedBookings : sortedBookings.slice(0, 5);

    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((acc, curr) => acc + curr.total_price, 0);

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
        <>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2rem] shadow-xl p-8 shadow-sky-900/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Booking History</h2>
                        <p className="text-sm text-zinc-400">Your expedition archives</p>
                    </div>

                    {/* Quick Stats Chips */}
                    <div className="flex gap-4">
                        <div className="px-4 py-2 rounded-xl bg-zinc-800/40 border border-sky-500/20 flex items-center gap-3">
                            <div className="p-1.5 rounded-full bg-sky-500/20 text-sky-400">
                                <Icon name="CalendarIcon" size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                                    Total Trips
                                </p>
                                <p className="text-sm font-bold text-white">{totalBookings}</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-zinc-800/40 border border-sky-500/20 flex items-center gap-3">
                            <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                <Icon name="WalletIcon" size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                                    Total Invested
                                </p>
                                <p className="text-sm font-bold text-white">
                                    ₹{totalSpent.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {displayedBookings.length > 0 ? (
                        displayedBookings.map((booking, index) => (
                            <motion.div
                                key={booking.id}
                                layoutId={`booking-${booking.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(39, 39, 42, 0.4)' }}
                                onClick={() => setSelectedBooking(booking)}
                                className="group p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-sky-500/30 transition-all cursor-pointer flex flex-col md:flex-row gap-4 items-center"
                            >
                                <div className="relative w-full md:w-24 h-24 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={booking.properties.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6'}
                                        alt={booking.properties.title || 'Property'}
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>

                                <div className="flex-grow text-center md:text-left">
                                    <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                                        {booking.properties.title}
                                    </h3>
                                    <p className="text-xs text-zinc-400 mb-2">{booking.properties.location}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Icon name="CalendarIcon" size={12} />
                                            {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                                        </span>
                                        <span>→</span>
                                        <span>{format(new Date(booking.check_out), 'MMM dd, yyyy')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center md:items-end gap-2 min-w-[120px]">
                                    <span className="text-lg font-bold text-white">
                                        ₹{booking.total_price.toLocaleString('en-IN')}
                                    </span>
                                    <span
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(
                                            booking.status
                                        )}`}
                                    >
                                        {booking.status}
                                    </span>
                                    {/* Rate Stay button — show if checkout date has passed */}
                                    {new Date(booking.check_out) < new Date() && !reviewedIds.has(booking.id) && booking.status !== 'cancelled' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReviewBooking(booking);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                                        >
                                            <Star size={11} className="fill-current" />
                                            Rate Stay
                                        </button>
                                    )}
                                    {reviewedIds.has(booking.id) && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                            <Star size={10} className="fill-current" /> Reviewed
                                        </span>
                                    )}
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 hidden md:block">
                                    <div className="p-2 rounded-full bg-sky-500/10 text-sky-400 hover:bg-sky-500/20">
                                        <Icon name="ChevronRightIcon" size={20} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Icon name="DocumentMagnifyingGlassIcon" size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No recorded expeditions yet.</p>
                        </div>
                    )}
                </div>

                {bookings.length > 5 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full mt-6 py-3 text-xs font-bold uppercase tracking-widest text-sky-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-sky-500/20"
                    >
                        {showAll ? 'View Less' : 'View Complete Archive'}
                    </button>
                )}
            </div>

            <BookingDetailsModal
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
            />

            <LeaveReviewModal
                booking={reviewBooking as any}
                onClose={() => setReviewBooking(null)}
                onSuccess={() => {
                    if (reviewBooking) {
                        setReviewedIds(prev => new Set(prev).add(reviewBooking.id));
                    }
                }}
            />
        </>
    );
};

export default BookingHistory;
