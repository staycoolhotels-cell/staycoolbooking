'use client';

import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import EarningsChart from './EarningsChart';
import BookingCard from './BookingCard';
import Icon from '@/components/ui/AppIcon';
import { Property, Earning, Booking, Review } from '@/lib/types';

interface OverviewProps {
  properties: Property[];
  bookings: Booking[];
  earnings: Earning[];
  reviews: Review[];
  disputes?: any[];
  onAction?: (tabId: string) => void;
}

/**
 * Premium Bento Grid Overview
 * Featuring staggered animations and high-density glass tiles.
 */
const Overview = ({ properties, bookings, earnings, reviews, disputes, onAction }: OverviewProps) => {
  // Calculate Average Guest Rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(2)
    : 'New';

  // Animation variants for the container and children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 lg:grid-rows-6 gap-6"
    >
      {/* 1. TOP METRICS - 4 Glassy Stats Cards */}
      <motion.div variants={itemVariants} className="lg:col-span-1 lg:row-span-1">
        <StatsCard title="Active Listings" value={properties.length} icon="HomeIcon" onClick={() => onAction?.('properties')} />
      </motion.div>
      <motion.div variants={itemVariants} className="lg:col-span-1 lg:row-span-1">
        <StatsCard title="Pending Bookings" value={bookings.filter(b => b.status === 'pending').length} icon="CalendarDaysIcon" onClick={() => onAction?.('bookings')} />
      </motion.div>
      <motion.div variants={itemVariants} className="lg:col-span-1 lg:row-span-1">
        <StatsCard
          title="Monthly Revenue"
          value={`₹${earnings.reduce((acc, curr) => acc + curr.earnings, 0).toLocaleString('en-IN')}`}
          icon="BanknotesIcon"
          onClick={() => onAction?.('earnings')}
        />
      </motion.div>
      <motion.div variants={itemVariants} className="lg:col-span-1 lg:row-span-1">
        <StatsCard title="Guest Rating" value={averageRating} icon="StarIcon" onClick={() => onAction?.('aura-quality')} />
      </motion.div>
      <motion.div variants={itemVariants} className="lg:col-span-1 lg:row-span-1">
        <StatsCard
          title="Active Disputes"
          value={disputes?.filter(d => d.status === 'open').length || 0}
          icon="ScaleIcon"
          onClick={() => onAction?.('disputes')}
        />
      </motion.div>


      <motion.div
        variants={itemVariants}
        className="lg:col-span-1 lg:row-span-5 bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
              <Icon name="ScaleIcon" size={18} />
            </div>
            <h3 className="text-xl font-heading font-bold text-white">Open Disputes</h3>
          </div>
          <button
            onClick={() => onAction?.('disputes')}
            className="text-[10px] font-bold uppercase text-sky-400 hover:text-sky-300 transition-colors"
          >
            All
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {disputes && disputes.filter(d => d.status === 'open').length > 0 ? (
            disputes.filter(d => d.status === 'open').slice(0, 3).map((dispute) => (
              <div
                key={dispute.id}
                onClick={() => onAction?.('disputes')}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                    {dispute.caseNumber}
                  </p>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${dispute.priority === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                    {dispute.priority}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 line-clamp-1 mb-2">{dispute.description}</p>
                <p className="text-[9px] text-sky-400/60 font-medium">Property: {dispute.propertyName}</p>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30 py-10">
              <Icon name="CheckCircleIcon" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-wider">No Active Issues</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. MAIN EARNINGS CHART - Large Bento Tile */}
      <motion.div
        variants={itemVariants}
        className="lg:col-span-3 lg:row-span-3 bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h3 className="text-xl font-heading font-bold text-white">Earnings Performance</h3>
            <p className="text-xs text-white/40 font-medium">
              Revenue trends for the current period
            </p>
          </div>
          <button
            onClick={() => onAction?.('revenue-velocity')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold transition-all"
          >
            View Reports
          </button>
        </div>

        <div className="h-[320px] relative z-10">
          <EarningsChart data={earnings} />
        </div>
      </motion.div>

      {/* 3. RECENT ACTIVITY - Tall Bento Tile */}
      <motion.div
        variants={itemVariants}
        className="lg:col-span-1 lg:row-span-5 bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Icon name="BellIcon" size={18} />
          </div>
          <h3 className="text-xl font-heading font-bold text-white">Latest Activity</h3>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {bookings.length > 0 ? (
            bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img src={booking.guest?.avatar_url || 'https://via.placeholder.com/32'} className="w-8 h-8 rounded-full border border-white/10" alt={booking.guest?.name || 'Guest'} />
                  <p className="text-sm font-bold group-hover:text-primary transition-colors">{booking.guest?.name || 'Guest'}</p>
                </div>
                <p suppressHydrationWarning className="text-[10px] text-white/40 uppercase font-black">{new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}</p>
                <div
                  className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter ${booking.status === 'confirmed'
                    ? 'bg-success/20 text-success'
                    : 'bg-white/10 text-white/40'
                    }`}
                >
                  {booking.status.replace('_', ' ')}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
              <Icon name="InboxIcon" size={40} />
              <p className="text-xs font-medium">No recent bookings found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. QUICK ACTIONS TOOLBOX - Bottom Wide Tiles */}
      <motion.div
        variants={itemVariants}
        className="lg:col-span-3 lg:row-span-2 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Messages', icon: 'ChatBubbleLeftRightIcon', color: 'text-primary', tabId: 'unified-inbox' },
          { label: 'Reviews', icon: 'StarIcon', color: 'text-yellow-500', tabId: 'aura-quality' },
          { label: 'Pricing', icon: 'TagIcon', color: 'text-success', tabId: 'revenue-velocity' },
          { label: 'Calendar', icon: 'CalendarDaysIcon', color: 'text-availability', tabId: 'availability' },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => onAction?.(action.tabId)}
            className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Icon
                name={action.icon}
                className={`${action.color} opacity-60 group-hover:opacity-100`}
                size={24}
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Overview;
