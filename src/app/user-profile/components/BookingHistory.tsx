'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';
import { format } from 'date-fns';
import BookingDetailsModal from './BookingDetailsModal';
import LeaveReviewModal from './LeaveReviewModal';
import { Star } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

type BookingHistoryProps = {
    bookings: (Booking & { properties: Partial<Property> })[];
    guestId?: string;
    transactions?: any[];
    onStatusChange?: (bookingId?: string, newStatus?: string) => void;
};

const BookingHistory = ({ bookings, guestId, transactions = [], onStatusChange }: BookingHistoryProps) => {
    const router = useRouter();
    const [showAll, setShowAll] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<(Booking & { properties: Partial<Property> }) | null>(null);
    const [reviewBooking, setReviewBooking] = useState<(Booking & { properties: Partial<Property> }) | null>(null);
    const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
    const [selectedType, setSelectedType] = useState<string>('all');

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

    // Sort bookings by creation date (most recent first)
    const sortedBookings = useMemo(() => {
        return [...bookings].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }, [bookings]);

    const formatStayType = (type?: string) => {
        if (!type) return 'Stay';
        return type
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatStayTypePlural = (type?: string) => {
        if (!type) return 'Stays';
        const lower = type.toLowerCase();
        if (lower === 'hotel') return 'Hotels';
        if (lower === 'homestay') return 'Homestays';
        if (lower === 'villa') return 'Villas';
        if (lower === 'tent') return 'Tents';
        if (lower === 'wooden') return 'Wooden Stays';
        if (lower === 'dormitory') return 'Dormitory Stays';
        if (lower === 'apartment') return 'Apartments';
        if (lower === 'resort') return 'Resorts';
        
        const formatted = formatStayType(type);
        if (formatted.endsWith('y')) {
            return formatted.slice(0, -1) + 'ies';
        }
        return formatted + 's';
    };

    const getNormalizedType = (prop?: Partial<Property>) => {
        const rawType = (prop?.type || prop?.tier || 'stay').toLowerCase();
        if (rawType.includes('hotel')) return 'hotel';
        if (rawType.includes('homestay') || rawType.includes('home')) return 'homestay';
        if (rawType.includes('tent') || rawType.includes('camp')) return 'tent';
        if (rawType.includes('wooden') || rawType.includes('cabin')) return 'wooden';
        if (rawType.includes('dorm') || rawType.includes('hostel')) return 'dormitory';
        if (rawType.includes('apartment') || rawType.includes('flat')) return 'apartment';
        if (rawType.includes('villa')) return 'villa';
        if (rawType.includes('resort')) return 'resort';
        return rawType;
    };

    // Dynamically compute the set of unique property types available in the history
    const availableTypes = useMemo(() => {
        const types = new Set<string>();
        bookings.forEach(b => {
            if (b.properties?.type || b.properties?.tier) {
                types.add(getNormalizedType(b.properties));
            }
        });
        return Array.from(types).sort();
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        if (selectedType === 'all') return sortedBookings;
        return sortedBookings.filter(b => getNormalizedType(b.properties) === selectedType);
    }, [sortedBookings, selectedType]);

    const displayedBookings = showAll ? filteredBookings : filteredBookings.slice(0, 2);

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
            case 'pending_payment':
                return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'payment_failed':
                return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getPropertyImage = (prop: any) => {
        if (prop.images && Array.isArray(prop.images) && prop.images.length > 0) {
            const first = prop.images[0];
            return typeof first === 'string' ? first : first.url;
        }
        return prop.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6';
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

                {/* Property Type Filter */}
                {availableTypes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-6 pb-6 border-b border-zinc-800/60">
                        <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mr-2">Filter by Stay:</span>
                        <button
                            onClick={() => {
                                setSelectedType('all');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 border
                                ${selectedType === 'all'
                                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/50 shadow-lg shadow-sky-500/10'
                                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
                                }`}
                        >
                            All ({bookings.length})
                        </button>
                        {availableTypes.map((type) => {
                            const count = bookings.filter(b => getNormalizedType(b.properties) === type).length;
                            return (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setSelectedType(type);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 border
                                        ${selectedType === type
                                            ? 'bg-sky-500/15 text-sky-400 border-sky-500/50 shadow-lg shadow-sky-500/10'
                                            : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
                                        }`}
                                >
                                    {formatStayTypePlural(type)} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}

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
                                className="group p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-sky-500/30 transition-all cursor-pointer flex flex-row gap-3 items-center min-w-0"
                            >
                                {/* Thumbnail Image */}
                                <div className="relative w-14 h-14 sm:w-20 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={getPropertyImage(booking.properties)}
                                        alt={booking.properties.title || 'Property'}
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>

                                {/* Title & Location */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                                        {booking.properties.title}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 truncate">{booking.properties.location}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 mt-0.5 min-w-0">
                                        <p className="text-[10px] text-sky-400 font-medium truncate shrink-0">
                                            {booking.guests || 1} {(booking.guests || 1) === 1 ? 'Guest' : 'Guests'} • {(booking.room_type || '').toLowerCase().includes('entire resort') || (booking.properties?.type || '').toLowerCase().includes('entire resort')
                                                ? 'Entire Resort'
                                                : `${booking.total_rooms_booked || 1} ${(booking.total_rooms_booked || 1) === 1 ? (getNormalizedType(booking.properties).includes('tent') ? 'Tent' : 'Room') : (getNormalizedType(booking.properties).includes('tent') ? 'Tents' : 'Rooms')}`
                                            }
                                        </p>
                                        <span className={`px-1.5 py-0 rounded-[4px] text-[7px] font-black uppercase tracking-wider border shrink-0 ${booking.booking_type === 'bulk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800/60 text-zinc-500 border-zinc-700/50'}`}>
                                            {booking.booking_type === 'bulk' 
                                                ? `Bulk ${booking.bulk_booking_discount || booking.properties?.bulk_booking_discount ? `(${booking.bulk_booking_discount || booking.properties?.bulk_booking_discount}%)` : ''}` 
                                                : 'Normal'}
                                        </span>
                                        {(booking.properties?.type || booking.properties?.tier) && (
                                            <span className="px-1.5 py-0 rounded-[4px] text-[7px] font-black uppercase tracking-wider border shrink-0 bg-sky-500/10 text-sky-400 border-sky-500/20">
                                                {formatStayType(booking.properties.type || booking.properties.tier)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Dates — hidden on small mobile, show on sm+ */}
                                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-600 mt-1">
                                        <span>{format(new Date(booking.check_in), 'MMM dd')}</span>
                                        <span className="opacity-40">→</span>
                                        <span>{format(new Date(booking.check_out), 'MMM dd, yyyy')}</span>
                                    </div>
                                    {/* Booked on date */}
                                    <p className="text-[9px] text-zinc-600 mt-0.5">
                                        Booked on {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                                    </p>
                                </div>

                                {/* Price & Status Area */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-sm font-bold text-white">
                                        ₹{booking.total_price.toLocaleString('en-IN')}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${getStatusColor(
                                            booking.status
                                        )}`}
                                    >
                                        {booking.status.replace(/_/g, ' ')}
                                    </span>
                                    {booking.status === 'cancelled' && (
                                        <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                                            <Icon name="ArrowPathIcon" size={10} />
                                            Track Refund
                                        </span>
                                    )}
                                    
                                    {/* Action icons for mobile view */}
                                    <div className="flex md:hidden items-center gap-2 mt-1">
                                         {new Date(booking.check_out) < new Date() && !reviewedIds.has(booking.id) && booking.status !== 'cancelled' && (
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setReviewBooking(booking); 
                                                }}
                                                className="px-2 py-0.5 rounded-md bg-amber-500 text-black text-[8px] font-black uppercase flex items-center gap-1 shadow-lg shadow-amber-900/20 active:scale-95 transition-transform"
                                            >
                                                <Star size={8} className="fill-current" />
                                                Rate
                                            </button>
                                         )}
                                         {reviewedIds.has(booking.id) && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                                <Star size={8} className="fill-current" />
                                                <span className="text-[7px] font-bold uppercase tracking-wider">Rated</span>
                                            </div>
                                         )}
                                    </div>

                                    {/* Action icons for desktop view */}
                                    <div className="hidden md:flex items-center gap-2 mt-1">
                                         {new Date(booking.check_out) < new Date() && !reviewedIds.has(booking.id) && booking.status !== 'cancelled' && (
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setReviewBooking(booking); 
                                                }}
                                                className="p-1 rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all cursor-pointer border border-amber-500/20" 
                                                title="Rate Stay"
                                            >
                                                <Star size={10} className="fill-current" />
                                            </button>
                                         )}
                                         {reviewedIds.has(booking.id) && (
                                            <div title="Reviewed" className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                                                <Star size={10} className="fill-current" />
                                            </div>
                                         )}
                                         <div className="p-1 rounded-md bg-sky-500/10 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Icon name="ChevronRightIcon" size={12} />
                                         </div>
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

                {filteredBookings.length > 2 && (
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
                transactions={transactions}
                onClose={() => setSelectedBooking(null)}
                onStatusChange={(bookingId, status) => {
                    if (onStatusChange) onStatusChange(bookingId, status);
                    router.refresh();
                }}
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
