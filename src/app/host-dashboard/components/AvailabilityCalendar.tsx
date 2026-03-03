'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';
import { ChevronLeft, ChevronRight, Loader2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval } from 'date-fns';

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
            // Need to cast since guest is joined
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
            toast.error('Failed to block dates: ' + error.message);
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
            toast.error('Failed to unblock: ' + error.message);
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
        // Check blocks
        const block = blockedDates.find(b =>
            new Date(b.start_date) <= date && new Date(b.end_date) >= date
        );
        if (block) return { status: 'blocked', id: block.id };

        // Check bookings
        const booking = bookings.find(b =>
            new Date(b.check_in) <= date && new Date(b.check_out) > date
        );
        if (booking) return { status: 'booked', guest: booking.guest?.name };

        return { status: 'available' };
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-white">Availability Manager</h2>
                <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 text-sm max-w-[250px]"
                >
                    {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.title || p.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-semibold text-white">{format(currentDate, 'MMMM yyyy')}</h3>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <ChevronRight size={20} />
                </button>
            </div>

            {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-slate-500 text-xs font-semibold py-2">
                            {day}
                        </div>
                    ))}

                    {paddingDays.map((_, i) => (
                        <div key={`padding-${i}`} className="aspect-square"></div>
                    ))}

                    {daysInMonth.map(day => {
                        const { status, id, guest } = getDayStatus(day);
                        let isSelected = false;
                        if (selectingRange.start && selectingRange.end) {
                            const start = selectingRange.start < selectingRange.end ? selectingRange.start : selectingRange.end;
                            const end = selectingRange.end > selectingRange.start ? selectingRange.end : selectingRange.start;
                            isSelected = isWithinInterval(day, { start, end });
                        } else if (selectingRange.start) {
                            isSelected = isSameDay(day, selectingRange.start);
                        }

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    relative aspect-square rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden
                                    ${status === 'blocked' ? 'bg-red-900/20 border-red-900/50 text-red-500' :
                                        status === 'booked' ? 'bg-blue-900/20 border-blue-900/50 text-blue-400' :
                                            isSelected ? 'bg-white text-black border-white' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 text-slate-300'}
                                `}
                            >
                                <span className="text-sm font-bold z-10">{format(day, 'd')}</span>

                                {status === 'blocked' && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-900/80 transition-opacity z-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleUnblockDate(id!); }}
                                            className="text-white text-xs font-bold"
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                )}
                                {status === 'booked' && (
                                    <span className="text-[9px] truncate max-w-full px-1 opacity-70 absolute bottom-1">{guest || 'Booked'}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectingRange.start && selectingRange.end && (
                <div className="mt-6 flex justify-between items-center bg-slate-800 p-4 rounded-lg border border-slate-700 animate-in fade-in">
                    <div className="text-sm text-slate-300">
                        Block dates: <span className="font-bold text-white">{format(selectingRange.start, 'MMM d')} - {format(selectingRange.end, 'MMM d')}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectingRange({ start: null, end: null })}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBlockDates}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-md shadow-lg shadow-red-500/20"
                        >
                            Confirm Block
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
