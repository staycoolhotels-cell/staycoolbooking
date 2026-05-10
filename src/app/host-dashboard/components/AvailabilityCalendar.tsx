'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface BlockedDate {
    id: string;
    start_date: string;
    end_date: string;
    reason?: string;
    property_id: string;
}

interface Booking {
    id: string;
    check_in: string;
    check_out: string;
    status: string;
    guest: { name: string };
    property_id: string;
}

interface AvailabilityCalendarProps {
    properties: Property[];
}

export default function AvailabilityCalendar({ properties }: AvailabilityCalendarProps) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectingRange, setSelectingRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (selectedPropertyId) {
            fetchAvailability();
        }
    }, [selectedPropertyId, currentDate]);

    const fetchAvailability = async () => {
        setLoading(true);
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        // Fetch Blocked Dates
        const { data: blocked, error: blockedError } = await supabase
            .from('blocked_dates')
            .select('*')
            .eq('property_id', selectedPropertyId)
            .or(`start_date.lte.${end},end_date.gte.${start}`);

        if (blockedError) {
            console.error('Error fetching blocked dates:', blockedError);
        } else {
            setBlockedDates(blocked || []);
        }

        // Fetch Bookings
        const { data: booked, error: bookedError } = await supabase
            .from('bookings')
            .select('id, check_in, check_out, status, guest:users(name)')
            .eq('property_id', selectedPropertyId)
            .neq('status', 'cancelled')
            .or(`check_in.lte.${end},check_out.gte.${start}`);

        if (bookedError) {
            console.error('Error fetching bookings:', bookedError);
        } else {
            setBookings((booked as any) || []);
        }
        setLoading(false);
    };

    const handleDateClick = (date: Date) => {
        if (!selectingRange.start) {
            setSelectingRange({ start: date, end: null });
        } else if (!selectingRange.end) {
            if (date < selectingRange.start) {
                setSelectingRange({ start: date, end: selectingRange.start });
            } else {
                setSelectingRange({ ...selectingRange, end: date });
            }
        } else {
            setSelectingRange({ start: date, end: null });
        }
    };

    const handleBlockDates = async () => {
        if (!selectingRange.start || !selectingRange.end) return;

        const start = format(selectingRange.start, 'yyyy-MM-dd');
        const end = format(selectingRange.end, 'yyyy-MM-dd');

        const { error } = await supabase.rpc('block_property_dates', {
            p_property_id: selectedPropertyId,
            p_start_date: start,
            p_end_date: end,
            p_reason: 'Host blocked'
        });

        if (error) {
            toast.error('An unexpected error occurred. Please try again later.');
        } else {
            toast.success('Dates blocked successfully');
            setSelectingRange({ start: null, end: null });
            fetchAvailability();
        }
    };

    const handleUnblockDate = async (blockedId: string) => {
        if (!confirm('Unblock these dates?')) return;

        const { error } = await supabase.rpc('unblock_property_dates', {
            p_block_id: blockedId
        });

        if (error) {
            toast.error('An unexpected error occurred. Please try again later.');
        } else {
            toast.success('Dates unblocked');
            fetchAvailability();
        }
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    // Calculate padding days for start of month
    const startDay = startOfMonth(currentDate).getDay();
    const paddingDays = Array.from({ length: startDay });

    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Check blocks
        const block = blockedDates.find(b => {
            const startStr = b.start_date.split('T')[0];
            const endStr = b.end_date.split('T')[0];
            return startStr <= dateStr && endStr >= dateStr;
        });
        if (block) return { status: 'blocked', id: block.id };

        // Check bookings
        const booking = bookings.find(b => {
            const checkInStr = b.check_in.split('T')[0];
            const checkOutStr = b.check_out.split('T')[0];
            return checkInStr <= dateStr && checkOutStr > dateStr;
        });
        if (booking) return { status: 'booked', guest: booking.guest?.name };

        return { status: 'available' };
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));

    return (
        <div className="w-full space-y-6 md:space-y-8 relative">
            {/* 1. Ultra-Premium Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#0a0a0f]/80 p-4 rounded-[1.25rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-80 bg-gradient-to-r from-sky-500/10 to-transparent pointer-events-none" />
 
                <div className="relative z-10 flex items-center gap-3 w-full lg:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/30 to-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)] shrink-0">
                        <Icon name="CalendarDaysIcon" size={20} className="text-sky-400 drop-shadow-md" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-heading font-black text-white tracking-tight drop-shadow-lg">Inventory Matrix</h1>
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            Asset Availability Schedule
                        </p>
                    </div>
                </div>
 
                <div className="relative z-10 w-full lg:w-auto">
                    <div className="relative group/select">
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="w-full lg:w-64 bg-black/40 border border-white/10 hover:border-sky-500/30 rounded-lg py-2.5 px-4 pr-10 text-white font-bold text-xs focus:ring-2 focus:ring-sky-500/50 outline-none appearance-none transition-all shadow-inner cursor-pointer"
                        >
                            {properties.map(p => (
                                <option key={p.id} value={p.id} className="bg-zinc-900 text-white font-medium">
                                    {p.title || p.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white/5 flex items-center justify-center pointer-events-none group-hover/select:bg-sky-500/10 transition-colors">
                            <Icon name="ChevronDownIcon" size={12} className="text-sky-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Calendar Core Context */}
            <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[1.25rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col p-3 md:p-4">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
 
                {/* Month Navigator */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-4 pb-3 border-b border-white/5 relative z-10 gap-4">
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-full shadow-inner">
                        <button onClick={prevMonth} className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                            <Icon name="ChevronLeftIcon" size={14} />
                        </button>
                        <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
                            <Icon name="CalendarIcon" size={14} className="text-sky-400" />
                            <h3 className="text-[11px] font-heading font-black tracking-widest text-white uppercase text-center">
                                {format(currentDate, 'MMMM yyyy')}
                            </h3>
                        </div>
                        <button onClick={nextMonth} className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                            <Icon name="ChevronRightIcon" size={14} />
                        </button>
                    </div>
 
                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/5 border border-white/10 shadow-inner" /> <span className="text-zinc-500">Available</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500/20 border border-purple-500/30 shadow-inner" /> <span className="text-purple-400">Reserved</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/30 shadow-inner" /> <span className="text-red-400">Blocked</span></div>
                    </div>
                </div>

                {loading ? (
                    <div className="h-[400px] flex flex-col items-center justify-center relative z-10">
                        <Icon name="ArrowPathIcon" size={40} className="text-sky-500 animate-spin mb-4" />
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Synchronizing Matrices...</p>
                    </div>
                ) : (
                    <div className="relative z-10">
                        {/* Days of Week Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <div key={day} className="text-center text-[9px] text-zinc-500 font-bold uppercase tracking-widest pb-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                            {paddingDays.map((_, i) => (
                                <div key={`padding-${i}`} className="aspect-square opacity-0 pointer-events-none" />
                            ))}

                            {daysInMonth.map(day => {
                                const { status, id, guest } = getDayStatus(day);

                                let isSelected = false;
                                let isRangeStart = false;
                                let isRangeEnd = false;
                                let isInRange = false;

                                if (selectingRange.start && selectingRange.end) {
                                    const start = selectingRange.start < selectingRange.end ? selectingRange.start : selectingRange.end;
                                    const end = selectingRange.end > selectingRange.start ? selectingRange.end : selectingRange.start;

                                    isSelected = isWithinInterval(day, { start, end });
                                    isInRange = isWithinInterval(day, { start, end }) && !isSameDay(day, start) && !isSameDay(day, end);
                                    isRangeStart = isSameDay(day, start);
                                    isRangeEnd = isSameDay(day, end);
                                } else if (selectingRange.start) {
                                    isSelected = isSameDay(day, selectingRange.start);
                                    isRangeStart = isSelected;
                                    isRangeEnd = isSelected;
                                }

                                const today = new Date();
                                const isPast = day < new Date(today.setHours(0, 0, 0, 0));

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => !isPast && handleDateClick(day)}
                                        className={`
                                            relative h-12 md:h-16 flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden
                                            ${isPast ? 'opacity-30 cursor-not-allowed scale-95' : 'hover:-translate-y-0.5 hover:shadow-xl hover:z-20'}
                                            ${isSelected ? 'z-10' : ''}
                                        `}
                                    >
                                        {/* Selection Indicators (Behind Card) */}
                                        {isSelected && (
                                            <div className={`absolute inset-0 bg-sky-500/20 z-0 pointer-events-none transition-all
                                              ${isRangeStart ? 'rounded-l-xl' : ''}
                                              ${isRangeEnd ? 'rounded-r-xl' : ''}
                                              ${isInRange ? 'scale-y-[0.8]' : ''}
                                           `} />
                                        )}
 
                                        {/* Card Surface */}
                                        <div className={`
                                            w-full h-full rounded-xl border flex flex-col items-center justify-center relative z-10 p-0.5 transition-colors
                                            ${status === 'blocked' ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]' :
                                                status === 'booked' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' :
                                                    isSelected ? 'bg-sky-500 border-sky-400 text-black shadow-[0_0_15px_rgba(14,165,233,0.4)]' :
                                                        'bg-white/[0.02] border-white/5 hover:border-white/20 text-white/70 hover:text-white'}
                                        `}>
                                            <span className={`text-[10px] md:text-sm font-bold ${isSelected ? 'font-black' : ''}`}>
                                                {format(day, 'd')}
                                            </span>

                                            {/* Status Badge Mini */}
                                            {!isSelected && status !== 'available' && (
                                                <div className="mt-1 hidden md:flex items-center justify-center w-full">
                                                    {status === 'blocked' && <Icon name="NoSymbolIcon" size={12} className="opacity-50" />}
                                                    {status === 'booked' && <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-full opacity-70 bg-black/20 px-2 py-0.5 rounded-md">{guest || 'Booked'}</span>}
                                                </div>
                                            )}

                                            {/* Block Overlay Hover Action */}
                                            {status === 'blocked' && !isPast && (
                                                <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-900/80 backdrop-blur-sm transition-opacity z-20">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUnblockDate(id!); }}
                                                        className="w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 bg-black/40 hover:bg-black/80 border border-red-500/30 rounded-xl md:rounded-lg text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <Icon name="LockOpenIcon" size={14} />
                                                        <span className="hidden md:inline">Unblock</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Floating Action Block (Confirm Dates) */}
            <AnimatePresence>
                {selectingRange.start && selectingRange.end && (
                    <div className="fixed bottom-6 md:bottom-10 left-0 right-0 z-50 flex justify-center px-4 w-full pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="bg-zinc-900 border border-white/10 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden w-full max-w-2xl pointer-events-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-red-500/10 pointer-events-none" />

                            <div className="flex items-center gap-3 sm:gap-4 relative z-10 w-full sm:w-auto">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Icon name="NoSymbolIcon" size={20} className="text-zinc-400" />
                                </div>
                                <div className="min-w-0 pr-2">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Isolate Dates</p>
                                    <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                                        {format(selectingRange.start, 'MMM d')} <span className="text-zinc-600 mx-1">→</span> {format(selectingRange.end, 'MMM d')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto relative z-10 shrink-0">
                                <button
                                    onClick={() => setSelectingRange({ start: null, end: null })}
                                    className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 text-zinc-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlockDates}
                                    className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2"
                                >
                                    <Icon name="LockClosedIcon" size={16} /> Block
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
