'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { fetchBookingDetailsAsAdmin } from '@/lib/admin-actions';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// ─── Data Processing ────────────────────────────────────────────────────────
const processData = (transactions: Transaction[]) => {
  const totalRevenue = transactions
    .filter((t) => t.status === 'completed')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalRefunds = transactions
    .filter((t) => t.status === 'refunded')
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const netRevenue = totalRevenue - totalRefunds;
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  const monthlyData = transactions.reduce(
    (acc, t) => {
      const month = format(new Date(t.date), 'MMM');
      if (!acc[month]) acc[month] = { revenue: 0, refunds: 0 };
      if (t.status === 'completed') acc[month].revenue += t.amount || 0;
      return acc;
    },
    {} as Record<string, { revenue: number; refunds: number }>
  );

  const chartData = Object.keys(monthlyData).map((month) => ({
    name: month,
    Revenue: monthlyData[month].revenue,
    Refunds: Math.abs(monthlyData[month].refunds),
  }));

  return { totalRevenue, totalRefunds, netRevenue, pendingCount, chartData };
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d0d14]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-300 font-medium">{entry.name}:</span>
            <span className="text-white font-bold">
              {"\u20B9"}{Number(entry.value).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Status Config ───────────────────────────────────────────────────────────
const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  completed: {
    bg: 'bg-emerald-500/10 border border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Completed',
  },
  pending: {
    bg: 'bg-amber-500/10 border border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Pending',
  },
  failed: {
    bg: 'bg-rose-500/10 border border-rose-500/20',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    label: 'Failed',
  },
  refunded: {
    bg: 'bg-violet-500/10 border border-violet-500/20',
    text: 'text-violet-400',
    dot: 'bg-violet-400',
    label: 'Refunded',
  },
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  icon: string;
  glow: string;
  border: string;
  iconColor: string;
  blobColor: string;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
}

const KpiCard = ({ title, value, icon, glow, border, iconColor, blobColor, subtitle, onClick, active }: KpiCardProps) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative group overflow-hidden rounded-xl md:rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl p-3.5 md:p-6 transition-all duration-500 cursor-pointer border ${
      active ? 'ring-2 ring-white/20' : ''
    }`}
    style={{ borderColor: active ? glow : border, boxShadow: active ? `0 0 20px ${glow}` : 'none' }}
  >
    {/* Glow on hover or if active */}
    <div
      className={`absolute inset-0 transition-opacity duration-700 rounded-xl md:rounded-2xl ${active ? 'opacity-40' : 'opacity-0 group-hover:opacity-100'}`}
      style={{ boxShadow: `inset 0 0 40px ${glow}` }}
    />
    {/* Blob */}
    <div
      className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
      style={{ backgroundColor: blobColor }}
    />
    {/* Bottom accent */}
    <div
      className={`absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      style={{ background: `linear-gradient(to right, transparent, ${glow}, transparent)` }}
    />

    <div className="relative z-10 flex flex-col gap-2 md:gap-4">
      <div className="flex items-start justify-between">
        <div
          className="p-2 md:p-2.5 rounded-lg md:rounded-xl border backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 flex items-center justify-center"
          style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <div className="md:hidden">
            <Icon name={icon as any} size={16} className={iconColor} />
          </div>
          <div className="hidden md:block">
            <Icon name={icon as any} size={20} className={iconColor} />
          </div>
        </div>
        <span className="text-[8px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1 hidden sm:block">
          All Time
        </span>
      </div>
      <div>
        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider md:tracking-[0.2em] mb-1 md:mb-1.5 truncate">{title}</p>
        <h3 className="text-lg md:text-3xl font-heading font-black text-white tracking-tight leading-none truncate">
          {value}
        </h3>
        {subtitle && <p className="text-[9px] md:text-[10px] text-zinc-600 mt-1 md:mt-2 font-medium truncate">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
interface FinancialsListProps {
  initialTransactions: Transaction[];
}

const FinancialsList = ({ initialTransactions }: FinancialsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { totalRevenue, totalRefunds, netRevenue, pendingCount, chartData } = processData(transactions);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('realtime-bookings-financials')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        async (payload) => {
          // For financials, we need joined data (guest, property, host)
          // Given this is an admin panel, a targeted refetch of the new/updated record is better.

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const booking = await fetchBookingDetailsAsAdmin(payload.new.id);

            if (booking) {
              const mapped: Transaction = {
                id: booking.id,
                transactionId: `TXN-${booking.id.slice(0, 8).toUpperCase()}`,
                propertyName: booking.property?.title || 'Unknown Property',
                guestName: booking.guest?.name || 'Unknown Guest',
                guestAddress: (booking.guest as any)?.email || 'Address not provided',
                hostName: booking.property?.host?.name || 'Unknown Host',
                amount: Number(booking.total_price),
                date: booking.created_at,
                status: (booking.status === 'confirmed' || booking.status === 'completed') ? 'completed' : 
                        (booking.status === 'refunded' ? 'refunded' : 'pending'),
                paymentMethod: 'Razorpay'
              };

              setTransactions((prev) => {
                const filtered = prev.filter((t) => t.id !== mapped.id);
                return [...filtered, mapped].sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                );
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) => prev.filter((t) => t.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    const matchSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpiCards: KpiCardProps[] = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: 'CurrencyRupeeIcon',
      glow: 'rgba(99,102,241,0.35)',
      border: 'rgba(99,102,241,0.25)',
      iconColor: 'text-indigo-400',
      blobColor: 'rgba(99,102,241,0.5)',
      subtitle: 'From completed transactions',
      active: statusFilter === 'all',
      onClick: () => setStatusFilter('all'),
    },
    {
      title: 'Total Refunds',
      value: `₹${Math.abs(totalRefunds).toLocaleString('en-IN')}`,
      icon: 'ArrowUturnLeftIcon',
      glow: 'rgba(239,68,68,0.35)',
      border: 'rgba(239,68,68,0.25)',
      iconColor: 'text-rose-400',
      blobColor: 'rgba(239,68,68,0.5)',
      subtitle: 'Refunded to guests',
      active: statusFilter === 'refunded',
      onClick: () => setStatusFilter('refunded'),
    },
    {
      title: 'Net Revenue',
      value: `₹${netRevenue.toLocaleString('en-IN')}`,
      icon: 'BanknotesIcon',
      glow: 'rgba(16,185,129,0.35)',
      border: 'rgba(16,185,129,0.25)',
      iconColor: 'text-emerald-400',
      blobColor: 'rgba(16,185,129,0.5)',
      subtitle: 'Revenue minus refunds',
      active: false, // Just informational
      onClick: () => setStatusFilter('all'),
    },
    {
      title: 'Pending Transactions',
      value: String(pendingCount),
      icon: 'ClockIcon',
      glow: 'rgba(234,179,8,0.35)',
      border: 'rgba(234,179,8,0.25)',
      iconColor: 'text-amber-400',
      blobColor: 'rgba(234,179,8,0.5)',
      subtitle: 'Awaiting settlement',
      active: statusFilter === 'pending',
      onClick: () => setStatusFilter('pending'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
          >
            <KpiCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* ── Revenue Chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/8 p-6"
      >
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Analytics</p>
              <h2 className="text-xl font-heading font-black text-white">Revenue Overview</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-indigo-400 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-rose-400 inline-block" />
                Refunds
              </span>
            </div>
          </div>
          <div className="h-[200px] md:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="refundsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#818cf8' }}
                />
                <Area
                  type="monotone"
                  dataKey="Refunds"
                  stroke="#fb7185"
                  strokeWidth={2.5}
                  fill="url(#refundsGrad)"
                  dot={{ r: 4, fill: '#fb7185', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#fb7185' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── Transactions Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/8"
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-white/8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Records</p>
            <h2 className="text-xl font-heading font-black text-white">Recent Transactions</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Icon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors w-44"
              />
            </div>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900">All Status</option>
              <option value="completed" className="bg-zinc-900">Completed</option>
              <option value="pending" className="bg-zinc-900">Pending</option>
              <option value="failed" className="bg-zinc-900">Failed</option>
              <option value="refunded" className="bg-zinc-900">Refunded</option>
            </select>
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3 p-4">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 text-zinc-600">
                <Icon name="DocumentMagnifyingGlassIcon" size={36} />
                <p className="text-sm font-medium">No transactions found</p>
              </div>
            ) : (
              filtered.map((transaction, i) => {
                const cfg = statusConfig[transaction.status] ?? statusConfig['pending'];
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors rounded-xl p-4 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-zinc-300 bg-white/5 px-2 py-1 rounded-lg border border-white/8">
                          {transaction.id.slice(0, 13)}…
                        </span>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}
                      >
                        <span className={`w-1 h-1 rounded-full ${cfg.dot} animate-pulse`} />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex justify-between items-end gap-2 mt-1">
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Amount</div>
                        <span className="text-lg font-heading font-black text-white">
                          {"\u20B9"}{transaction.amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-300 font-medium">
                          {format(new Date(transaction.date), 'dd MMM yyyy')}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {format(new Date(transaction.date), 'hh:mm a')}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Transaction ID', 'Date', 'Amount', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-600">
                        <Icon name="DocumentMagnifyingGlassIcon" size={36} />
                        <p className="text-sm font-medium">No transactions found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((transaction, i) => {
                    const cfg = statusConfig[transaction.status] ?? statusConfig['pending'];
                    return (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-200 group"
                      >
                        {/* ID */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded-lg border border-white/8">
                            {transaction.id.slice(0, 13)}…
                          </span>
                        </td>
                        {/* Date */}
                        <td className="px-5 py-4">
                          <div className="text-sm text-zinc-300 font-medium">
                            {format(new Date(transaction.date), 'dd MMM yyyy')}
                          </div>
                          <div className="text-xs text-zinc-600">
                            {format(new Date(transaction.date), 'hh:mm a')}
                          </div>
                        </td>
                        {/* Amount */}
                        <td className="px-5 py-4">
                          <span className="text-base font-heading font-black text-white">
                            {"\u20B9"}{transaction.amount?.toLocaleString('en-IN')}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                            {cfg.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-zinc-600">
              Showing <span className="text-zinc-400 font-semibold">{filtered.length}</span> of{' '}
              <span className="text-zinc-400 font-semibold">{transactions.length}</span> transactions
            </p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-zinc-600 font-medium">Live</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FinancialsList;
