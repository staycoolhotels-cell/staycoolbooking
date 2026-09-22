'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminBookingHistoryProps {
  initialBookings: any[];
}

export default function AdminBookingHistory({ initialBookings }: AdminBookingHistoryProps) {
  // Main State
  const [searchTerm, setSearchTerm] = useState('');
  const [timeMode, setTimeMode] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all');
  
  // Specific Sub-Filters
  const [daySubFilter, setDaySubFilter] = useState<'today' | 'yesterday' | 'last7'>('today');
  const [weekSubFilter, setWeekSubFilter] = useState<'this_week' | 'last_week' | 'last4weeks'>('this_week');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Available Years from bookings data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    initialBookings.forEach((b) => {
      if (b.created_at) {
        const y = new Date(b.created_at).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [initialBookings]);

  // Filter Bookings Logic
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    return initialBookings.filter((b) => {
      const bDate = b.created_at ? new Date(b.created_at) : new Date(b.check_in);
      if (isNaN(bDate.getTime())) return false;

      // Exclude pending payments and payment failures - only real success and cancelled bookings belong in history
      if (b.status === 'pending_payment' || b.status === 'payment_failed') return false;

      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'confirmed' && b.status !== 'confirmed') return false;
        if (statusFilter === 'completed' && b.status !== 'completed') return false;
        if (statusFilter === 'checked_in' && b.status !== 'checked_in') return false;
        if (statusFilter === 'cancelled' && b.status !== 'cancelled' && b.status !== 'refunded') return false;
      }

      // 2. Search Query Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const guestName = (b.guest?.name || '').toLowerCase();
        const guestEmail = (b.guest?.email || '').toLowerCase();
        const propTitle = (b.property?.title || '').toLowerCase();
        const hostName = (b.property?.host?.name || '').toLowerCase();
        const bookingCode = b.id ? `#BK${b.id.slice(0, 5)}`.toLowerCase() : '';

        const matchesSearch =
          guestName.includes(query) ||
          guestEmail.includes(query) ||
          propTitle.includes(query) ||
          hostName.includes(query) ||
          bookingCode.includes(query);

        if (!matchesSearch) return false;
      }

      // 3. Time Mode Filter
      if (timeMode === 'day') {
        if (daySubFilter === 'today') {
          return bDate >= startOfToday;
        } else if (daySubFilter === 'yesterday') {
          return bDate >= startOfYesterday && bDate < startOfToday;
        } else if (daySubFilter === 'last7') {
          const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
          return bDate >= sevenDaysAgo;
        }
      } else if (timeMode === 'week') {
        const dayOfWeek = now.getDay();
        const startOfThisWeek = new Date(startOfToday.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourWeeksAgo = new Date(startOfToday.getTime() - 28 * 24 * 60 * 60 * 1000);

        if (weekSubFilter === 'this_week') {
          return bDate >= startOfThisWeek;
        } else if (weekSubFilter === 'last_week') {
          return bDate >= startOfLastWeek && bDate < startOfThisWeek;
        } else if (weekSubFilter === 'last4weeks') {
          return bDate >= fourWeeksAgo;
        }
      } else if (timeMode === 'month') {
        return bDate.getMonth() === selectedMonth && bDate.getFullYear() === selectedYear;
      } else if (timeMode === 'year') {
        return bDate.getFullYear() === selectedYear;
      }

      return true;
    });
  }, [initialBookings, searchTerm, timeMode, daySubFilter, weekSubFilter, selectedMonth, selectedYear, statusFilter]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalCount = filteredBookings.length;
    const totalAmount = filteredBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed');
    const adminRevenue = confirmedBookings.reduce((sum, b) => {
      const fee = b.service_fee ? Number(b.service_fee) : Math.round(Number(b.total_price || 0) * 0.1);
      return sum + (isNaN(fee) ? 0 : fee);
    }, 0);
    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
    const confirmedCount = confirmedBookings.length;
    const confirmedRate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

    return {
      totalCount,
      totalAmount,
      adminRevenue,
      avgAmount,
      confirmedCount,
      confirmedRate,
    };
  }, [filteredBookings]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;

    const headers = ['Booking ID', 'Guest Name', 'Guest Email', 'Property Title', 'Host Name', 'Check-In', 'Check-Out', 'Total Amount (INR)', 'Status', 'Booking Date'];
    const rows = filteredBookings.map((b) => [
      `#BK${b.id.slice(0, 5).toUpperCase()}`,
      `"${b.guest?.name || 'N/A'}"`,
      `"${b.guest?.email || 'N/A'}"`,
      `"${b.property?.title || 'N/A'}"`,
      `"${b.property?.host?.name || 'N/A'}"`,
      b.check_in,
      b.check_out,
      b.total_price || 0,
      b.status || 'unknown',
      b.created_at ? new Date(b.created_at).toLocaleString('en-IN') : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StayCool_Booking_History_${timeMode}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Bookings */}
        <div className="bg-[#0f0f15]/90 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Bookings</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Icon name="CalendarDaysIcon" size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{metrics.totalCount}</div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">Filtered count across selection</p>
        </div>

        {/* Total Booking Value */}
        <div className="bg-[#0f0f15]/90 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Booking Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Icon name="BanknotesIcon" size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400">₹{metrics.totalAmount.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">Gross booking volume</p>
        </div>

        {/* Admin Platform Revenue */}
        <div className="bg-[#0f0f15]/90 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Admin Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icon name="CurrencyRupeeIcon" size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">₹{metrics.adminRevenue.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">Platform commission (10%)</p>
        </div>

        {/* Avg Booking Value */}
        <div className="bg-[#0f0f15]/90 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Order Value</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Icon name="ChartBarIcon" size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">₹{metrics.avgAmount.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">Average price per booking</p>
        </div>

        {/* Confirmed Rate */}
        <div className="bg-[#0f0f15]/90 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Success Rate</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Icon name="CheckCircleIcon" size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-400">{metrics.confirmedRate}%</div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">{metrics.confirmedCount} successful bookings</p>
        </div>
      </div>

      {/* 2. TIME FILTER CONTROL PANEL */}
      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        
        {/* Main Time Mode Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Icon name="AdjustmentsHorizontalIcon" size={20} className="text-emerald-400" />
              <span>Time Period Filter</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Filter booking records by Day, Week, Month, or Year</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-xl">
            {(['all', 'day', 'week', 'month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTimeMode(mode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  timeMode === mode
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode === 'all' ? 'All Time' : mode === 'day' ? 'Days Wise' : mode === 'week' ? 'Week Wise' : mode === 'month' ? 'Month Wise' : 'Year Wise'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Sub-Filters depending on Time Mode */}
        {timeMode !== 'all' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* DAY WISE SUB-FILTER */}
            {timeMode === 'day' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Day Range:</span>
                {(['today', 'yesterday', 'last7'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setDaySubFilter(sub)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                      daySubFilter === sub
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sub === 'today' ? 'Today' : sub === 'yesterday' ? 'Yesterday' : 'Last 7 Days'}
                  </button>
                ))}
              </div>
            )}

            {/* WEEK WISE SUB-FILTER */}
            {timeMode === 'week' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Week Range:</span>
                {(['this_week', 'last_week', 'last4weeks'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setWeekSubFilter(sub)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                      weekSubFilter === sub
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sub === 'this_week' ? 'This Week' : sub === 'last_week' ? 'Last Week' : 'Last 4 Weeks'}
                  </button>
                ))}
              </div>
            )}

            {/* MONTH WISE SUB-FILTER */}
            {timeMode === 'month' && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    style={{ colorScheme: 'dark' }}
                    className="bg-[#0f111a] border border-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer [&>option]:bg-[#0f111a] [&>option]:text-white"
                  >
                    {monthNames.map((name, index) => (
                      <option key={name} value={index} className="bg-[#0f111a] text-white py-1">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{ colorScheme: 'dark' }}
                    className="bg-[#0f111a] border border-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer [&>option]:bg-[#0f111a] [&>option]:text-white"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr} className="bg-[#0f111a] text-white py-1">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* YEAR WISE SUB-FILTER */}
            {timeMode === 'year' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Year:</span>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                      selectedYear === yr
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Bar & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Icon name="MagnifyingGlassIcon" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guest, property, code..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <Icon name="XMarkIcon" size={14} />
              </button>
            )}
          </div>

          {/* Status Dropdown & CSV Export */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#0f111a] border border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-lg [&>option]:bg-[#0f111a] [&>option]:text-white"
            >
              <option value="all" className="bg-[#0f111a] text-white py-1.5">All Statuses</option>
              <option value="confirmed" className="bg-[#0f111a] text-white py-1.5">Confirmed</option>
              <option value="checked_in" className="bg-[#0f111a] text-white py-1.5">Checked In</option>
              <option value="completed" className="bg-[#0f111a] text-white py-1.5">Completed</option>
              <option value="cancelled" className="bg-[#0f111a] text-white py-1.5">Cancelled</option>
            </select>

            <button
              onClick={handleExportCSV}
              disabled={filteredBookings.length === 0}
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="ArrowDownTrayIcon" size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOOKINGS TABLE LIST */}
      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Guest Details</th>
                  <th className="py-3.5 px-4">Property & Host</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                {filteredBookings.map((b) => {
                  const bookingCode = `#BK${b.id.slice(0, 5).toUpperCase()}`;
                  const nights = Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60 * 24)));
                  const amount = Number(b.total_price || 0);

                  const statusColor = 
                    b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    b.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    b.status === 'checked_in' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                    (b.status === 'cancelled' || b.status === 'refunded') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Booking Code */}
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        {bookingCode}
                        <div className="text-[10px] text-zinc-500 font-sans font-normal mt-0.5">
                          {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : ''}
                        </div>
                      </td>

                      {/* Guest Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                            {b.guest?.avatar_url ? (
                              <img src={b.guest.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (b.guest?.name || 'G')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{b.guest?.name || 'Guest User'}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{b.guest?.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Property & Host */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="font-semibold text-zinc-200 truncate">{b.property?.title || 'Property'}</p>
                        <p className="text-[11px] text-zinc-500 truncate">Host: {b.property?.host?.name || 'Host'}</p>
                      </td>

                      {/* Dates & Duration */}
                      <td className="py-4 px-4">
                        <p className="font-medium text-zinc-200">
                          {new Date(b.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(b.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium">{nights} {nights === 1 ? 'night' : 'nights'}</p>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-white text-sm">₹{amount.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColor}`}>
                          {b.status}
                        </span>
                      </td>

                      {/* Action View Details */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-bold text-zinc-200 hover:text-white transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
              <Icon name="CalendarDaysIcon" size={24} />
            </div>
            <p className="text-base font-bold text-white">No Bookings Found</p>
            <p className="text-xs text-zinc-500 max-w-sm">No records match the current period or search filters. Try switching time ranges.</p>
          </div>
        )}
      </div>

      {/* 4. BOOKING DETAILS MODAL */}
      <AnimatePresence>
        {selectedBooking && (
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0f1a] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300"
              >
                <Icon name="XMarkIcon" size={18} />
              </button>

              {/* Compute booking financial info */}
              {(() => {
                const isBookingPaid =
                  selectedBooking.status === 'confirmed' ||
                  selectedBooking.status === 'completed' ||
                  selectedBooking.status === 'checked_in';

                const isBookingPending =
                  selectedBooking.status === 'pending_payment' ||
                  selectedBooking.status === 'pending';

                const isBookingFailed =
                  selectedBooking.status === 'payment_failed' ||
                  selectedBooking.status === 'failed';

                const isBookingCancelled = selectedBooking.status === 'cancelled';

                const totalPrice = Number(selectedBooking.total_price || 0);
                const paidAmount = isBookingPaid ? totalPrice : 0;

                const modalStatusStyle =
                  isBookingPaid
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : isBookingPending
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : isBookingFailed
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : isBookingCancelled
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-white/10 text-white border-white/20';

                return (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold rounded-lg text-sm">
                        #BK{selectedBooking.id.slice(0, 5).toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 font-bold text-xs uppercase rounded-full border ${modalStatusStyle}`}>
                        {selectedBooking.status ? selectedBooking.status.replace(/_/g, ' ') : 'UNKNOWN'}
                      </span>
                    </div>

                    <div className="space-y-4 divide-y divide-white/10 text-xs">
                      {/* Guest & Property */}
                      <div className="pt-2 space-y-2">
                        <p className="text-zinc-500 uppercase font-bold tracking-wider text-[10px]">Guest & Property</p>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Guest Name:</span>
                          <span className="font-bold text-white">{selectedBooking.guest?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Guest Email:</span>
                          <span className="font-medium text-zinc-200">{selectedBooking.guest?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Property:</span>
                          <span className="font-bold text-white">{selectedBooking.property?.title || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Host Name:</span>
                          <span className="font-medium text-zinc-200">{selectedBooking.property?.host?.name || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Dates & Stay */}
                      <div className="pt-3 space-y-2">
                        <p className="text-zinc-500 uppercase font-bold tracking-wider text-[10px]">Stay Details</p>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Check-In:</span>
                          <span className="font-semibold text-white">{selectedBooking.check_in}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Check-Out:</span>
                          <span className="font-semibold text-white">{selectedBooking.check_out}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Booking Date:</span>
                          <span className="font-medium text-zinc-300">
                            {selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleString('en-IN') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Financial Breakdown */}
                      <div className="pt-3 space-y-2.5">
                        <p className="text-zinc-500 uppercase font-bold tracking-wider text-[10px]">Financial Summary</p>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Booking Amount:</span>
                          <span className="font-bold text-white">₹{totalPrice.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Payment Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${modalStatusStyle}`}>
                            {selectedBooking.status ? selectedBooking.status.replace(/_/g, ' ') : 'UNKNOWN'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-white/10">
                          <span className="text-zinc-300">
                            {isBookingPaid ? 'Total Amount Paid:' : 'Amount Paid:'}
                          </span>
                          <span className={`text-lg font-black ${isBookingPaid ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            ₹{paidAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {isBookingPending && (
                          <div className="flex justify-between items-center text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mt-1">
                            <span>Pending / Due Amount:</span>
                            <span className="font-bold text-sm">₹{totalPrice.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        {isBookingFailed && (
                          <div className="flex justify-between items-center text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 mt-1">
                            <span>Payment Note:</span>
                            <span className="font-medium">Transaction Failed (Unpaid)</span>
                          </div>
                        )}

                        {isBookingCancelled && (
                          <div className="flex justify-between items-center text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mt-1">
                            <span>Booking Note:</span>
                            <span className="font-medium">Booking Cancelled (Unpaid / Inactive)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
