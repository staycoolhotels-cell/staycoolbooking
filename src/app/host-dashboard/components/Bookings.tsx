'use client';

import React, { useState, useMemo } from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

interface BookingsProps {
  bookings: Booking[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAction: (tab: string, data?: any) => void;
}

const Bookings = ({ bookings, searchTerm, setSearchTerm, onAction }: BookingsProps) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

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

  const getNormalizedType = (prop?: any) => {
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

  const now = new Date();

  // Filter Logic
  const filteredBookings = bookings.filter((booking) => {
    // 0. Exclude pending payment or payment failed bookings from host reserve panel
    if (booking.status === 'pending_payment' || booking.status === 'payment_failed') {
      return false;
    }

    // 1. Search term
    const searchLower = searchTerm.toLowerCase();
    const guestName = booking.guest?.name || '';
    const propertyTitle = booking.properties?.title || '';

    const matchesSearch =
      guestName.toLowerCase().includes(searchLower) ||
      propertyTitle.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // 2. Tab Filter
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);

    let matchesTab = false;
    switch (activeFilter) {
      case 'upcoming':
        matchesTab = checkOut >= now && booking.status !== 'cancelled';
        break;
      case 'past':
        matchesTab = checkOut < now && booking.status !== 'cancelled';
        break;
      case 'cancelled':
        matchesTab = booking.status === 'cancelled';
        break;
      case 'all':
      default:
        matchesTab = true;
        break;
    }

    if (!matchesTab) return false;

    // 3. Property Type Filter
    if (selectedType !== 'all') {
      return getNormalizedType(booking.properties) === selectedType;
    }
    return true;
  });

  // Calculate counts for tabs
  const upcomingCount = bookings.filter(b => new Date(b.check_out) >= now && b.status !== 'cancelled').length;
  const pastCount = bookings.filter(b => new Date(b.check_out) < now && b.status !== 'cancelled').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  const filters = [
    { id: 'all', label: 'All Reservations', count: bookings.length, icon: 'QueueListIcon', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { id: 'upcoming', label: 'Upcoming Stays', count: upcomingCount, icon: 'ArrowPathRoundedSquareIcon', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { id: 'past', label: 'Past Guests', count: pastCount, icon: 'ClockIcon', color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
    { id: 'cancelled', label: 'Cancelled', count: cancelledCount, icon: 'NoSymbolIcon', color: 'text-red-400', bg: 'bg-red-500/20' },
  ] as const;

  return (
    <div className="w-full space-y-6 md:space-y-8 relative">
      {/* 1. Premium Header Module */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6 bg-[#0a0a0f]/80 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 md:gap-5 w-full lg:w-auto">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0">
            <Icon name="CalendarDaysIcon" size={24} className="text-emerald-400 drop-shadow-md lg:w-8 lg:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg md:truncate leading-tight">Reservation Control</h1>
            <p className="text-[9px] md:text-sm font-bold text-zinc-400 mt-0.5 md:mt-1 uppercase tracking-widest flex items-center gap-2 md:truncate">
              Guest Itinerary Management
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="relative z-10 w-full lg:w-96 shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon name="MagnifyingGlassIcon" size={16} className="text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search by guest, booking ID, property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 hover:border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 md:py-3 text-xs md:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium placeholder:text-zinc-500 shadow-inner"
            />
          </div>
          <button
            title="Filter Reservations"
            className="p-2.5 md:p-3 bg-black/40 border border-white/10 hover:border-emerald-500/30 rounded-xl text-zinc-400 hover:text-white transition-all shrink-0"
          >
            <Icon name="FunnelIcon" size={18} />
          </button>
        </div>
      </div>

      {/* 2. Category & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            title="Grid View"
            className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-emerald-400 shrink-0"
          >
            <Icon name="Squares2X2Icon" size={18} />
          </button>

          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-2xl p-1 shadow-inner">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
                  className={`relative px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300
                    ${isActive
                      ? 'bg-zinc-800 text-white shadow-md'
                      : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-emerald-400' : ''}`}>
                    {filter.label.replace(' Reservations', '').replace(' Stays', '').replace(' Guests', '')} ({filter.count})
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterUnderline"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>



      {/* 3. Deep Glassmorphic List Container */}
      <div className="bg-[#05060a]/90 backdrop-blur-xl rounded-[1.8rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl relative p-2.5 sm:p-6 md:p-8 overflow-hidden min-h-[400px]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-6 sm:space-y-8 relative z-10">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking, index) => (
              <div
                key={booking.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <BookingCard booking={booking} onAction={onAction} />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem] text-center backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Icon name="CalendarIcon" size={32} className="text-zinc-600" />
              </div>
              <p className="text-lg font-bold text-white mb-1">No Reservations Found</p>
              <p className="text-sm text-zinc-500 max-w-sm">No bookings match the current search filters or text query. Adjust your paramenters to see more results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
