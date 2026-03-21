'use client';

import React, { useState } from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';

interface BookingsProps {
  bookings: Booking[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAction: (tab: string) => void;
}

const Bookings = ({ bookings, searchTerm, setSearchTerm, onAction }: BookingsProps) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  const now = new Date();

  // Filter Logic
  const filteredBookings = bookings.filter((booking) => {
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

    switch (activeFilter) {
      case 'upcoming':
        return checkOut >= now && booking.status !== 'cancelled';
      case 'past':
        return checkOut < now && booking.status !== 'cancelled';
      case 'cancelled':
        return booking.status === 'cancelled';
      case 'all':
      default:
        return true;
    }
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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5 w-full lg:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0">
            <Icon name="CalendarDaysIcon" size={32} className="text-emerald-400 drop-shadow-md" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg truncate">Reservation Control</h1>
            <p className="text-xs md:text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2 truncate whitespace-nowrap">
              Guest Itinerary Management
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative z-10 w-full lg:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon name="MagnifyingGlassIcon" size={18} className="text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search by guest or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 hover:border-emerald-500/30 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium placeholder:text-zinc-600 shadow-inner"
          />
        </div>
      </div>

      {/* 2. Advanced Status Filters */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex flex-nowrap bg-black/40 border border-white/10 rounded-2xl p-1.5 shadow-inner min-w-max">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
                className={`relative px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300
                        ${isActive
                    ? 'bg-zinc-800/80 shadow-md transform scale-[1.02]'
                    : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}
                     `}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? filter.bg : 'bg-transparent'}`}>
                  <Icon name={filter.icon} size={16} className={isActive ? filter.color : 'text-current'} />
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-white' : ''}`}>
                  {filter.label}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${isActive ? 'bg-black/40 text-white border border-white/10' : 'bg-transparent text-current'}`}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Deep Glassmorphic List Container */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl relative p-6 md:p-8 overflow-hidden min-h-[400px]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-4 relative z-10">
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
