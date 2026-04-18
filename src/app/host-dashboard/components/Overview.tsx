'use client';

import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import EarningsChart from './EarningsChart';
import Icon from '@/components/ui/AppIcon';
import { Property, Earning, Booking, Review } from '@/lib/types';

interface OverviewProps {
  properties: Property[];
  bookings: Booking[];
  earnings: Earning[];
  reviews: Review[];
  disputes?: any[];
  onAction?: (tabId: string, data?: any) => void;
}

const Overview = ({ properties = [], bookings = [], earnings = [], reviews = [], disputes = [], onAction }: OverviewProps) => {
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(2)
    : 'New';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(15px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8"
    >
      {/* 1. HERO GREETING */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
            Focus & Growth
          </h2>
          <p className="text-sm text-zinc-400 mt-2 font-medium">
            Your platform performance at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-xl">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">All Systems Operational</span>
        </div>
      </motion.div>

      {/* 2. TOP METRICS (4 Columns) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard title="Active Listings" value={properties?.length || 0} icon="HomeIcon" onClick={() => onAction?.('properties')} />
        <StatsCard title="Pending Bookings" value={bookings?.filter(b => b.status === 'pending').length || 0} icon="CalendarDaysIcon" onClick={() => onAction?.('bookings')} />
        <StatsCard
          title="Monthly Revenue"
          value={`₹${(earnings || []).reduce((acc, curr) => acc + curr.earnings, 0).toLocaleString('en-IN')}`}
          icon="BanknotesIcon"
          onClick={() => onAction?.('revenue-velocity')}
        />
        <StatsCard title="Guest Rating" value={averageRating} icon="StarIcon" onClick={() => onAction?.('aura-quality')} />
      </motion.div>

      {/* 3. MIDDLE ROW: ANALYTICS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart (Wider) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-heading font-bold text-white">Earnings Analytics</h3>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Your revenue velocity over time
              </p>
            </div>
            <button
              onClick={() => onAction?.('revenue-velocity')}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold transition-all text-white flex items-center gap-2 shadow-lg"
            >
              Full Report <Icon name="ArrowRightIcon" size={14} />
            </button>
          </div>
          <div className="h-[280px] md:h-[340px] relative z-10">
            <EarningsChart data={earnings || []} />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-1 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col relative overflow-hidden group"
        >
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 shadow-inner">
                <Icon name="BellIcon" size={18} className="text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">Activity</h3>
            </div>
            <button
              onClick={() => onAction?.('unified-inbox')}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              Inbox
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar relative z-10 pr-2 pb-2">
            {(bookings || []).length > 0 ? (
              (bookings || []).slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => onAction?.('bookings')}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all cursor-pointer group/item flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img src={booking.guest?.avatar_url || 'https://via.placeholder.com/32'} className="w-10 h-10 rounded-full border border-white/20 object-cover group-hover/item:border-primary/50 transition-colors shadow-inner" alt={booking.guest?.name || 'Guest'} />
                    <div>
                      <p className="text-sm font-bold text-white group-hover/item:text-primary transition-colors">{booking.guest?.name?.trim() ? booking.guest.name : 'Verified Guest'}</p>
                      <p className="text-[10px] text-zinc-400 font-medium tracking-wide">New booking</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p suppressHydrationWarning className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{new Date(booking.check_in).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                    <div
                      className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${booking.status === 'confirmed'
                        ? 'bg-success/20 text-success border border-success/30'
                        : 'bg-warning/20 text-warning border border-warning/30'
                        }`}
                    >
                      {booking.status}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
                  <Icon name="CalendarIcon" size={24} className="text-zinc-600 drop-shadow-md" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">No Activity Yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 4. BOTTOM ROW: QUICK ACTIONS & DISPUTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Quick Actions Toolbox */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1 grid grid-cols-2 gap-4">
          {[
            { label: 'Inbox', icon: 'ChatBubbleLeftRightIcon', color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/40', tabId: 'unified-inbox' },
            { label: 'Reviews', icon: 'StarIcon', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/40', tabId: 'aura-quality' },
            { label: 'Pricing', icon: 'CurrencyRupeeIcon', color: 'text-success', bg: 'bg-success/10', border: 'hover:border-success/40', tabId: 'revenue-velocity' },
            { label: 'Calendar', icon: 'CalendarDaysIcon', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'hover:border-sky-400/40', tabId: 'availability' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onAction?.(action.tabId)}
              className={`flex flex-col items-center justify-center p-5 rounded-[2rem] bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 transition-all duration-300 group ${action.border} shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className={`w-12 h-12 rounded-full ${action.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500 shadow-inner z-10`}>
                <Icon
                  name={action.icon}
                  className={`${action.color} opacity-80 group-hover:opacity-100 drop-shadow-sm`}
                  size={22}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors z-10">
                {action.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Disputes (Action Items) */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-2 lg:col-span-3 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-error/5 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-error/20 rounded-xl border border-error/30 shadow-inner">
                <Icon name="ScaleIcon" size={18} className="text-error drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-white">Action Required</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">Active disputes and issues</p>
              </div>
            </div>
            <button
              onClick={() => onAction?.('disputes')}
              className="text-[10px] font-bold uppercase text-zinc-300 hover:text-white transition-colors border border-white/20 px-4 py-2 rounded-xl hover:bg-white/10 bg-white/5 shadow-md"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {disputes && disputes.filter(d => d.status === 'open').length > 0 ? (
              disputes.filter(d => d.status === 'open').slice(0, 3).map((dispute) => (
                <div
                  key={dispute.id}
                  onClick={() => onAction?.('disputes')}
                  className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-error/40 hover:bg-error/10 transition-all cursor-pointer group/dispute flex flex-col h-full shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <p className="text-xs font-bold text-white group-hover/dispute:text-error transition-colors truncate">
                      {dispute.caseNumber}
                    </p>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 shadow-inner ${dispute.priority === 'critical' ? 'bg-error/20 text-error border border-error/30' : 'bg-warning/20 text-warning border border-warning/30'
                      }`}>
                      {dispute.priority}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-5 flex-1 leading-relaxed">{dispute.description}</p>

                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/10">
                    <Icon name="MapPinIcon" size={12} className="text-zinc-500" />
                    <p className="text-[10px] text-zinc-300 font-bold tracking-wide truncate">{dispute.propertyName}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-center space-y-4 py-10 bg-white/[0.02] rounded-[1.5rem] border border-white/5 border-dashed shadow-inner">
                <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center shadow-lg">
                  <Icon name="CheckBadgeIcon" size={32} className="text-success drop-shadow-md" />
                </div>
                <div>
                  <p className="text-base font-bold text-white mb-1 tracking-wide">You're all caught up!</p>
                  <p className="text-xs text-zinc-500 font-medium">No active issues or disputes requiring your attention.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Overview;
