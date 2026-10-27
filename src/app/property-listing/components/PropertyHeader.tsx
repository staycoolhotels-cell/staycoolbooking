import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

interface PropertyHeaderProps {
  name: string;
  type: string;
  location: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  totalBookings: number;
  numBeds?: number;
  isSaved?: boolean;
  onSave?: () => void;
}

const PropertyHeader = ({
  name,
  type,
  location,
  rating,
  reviewCount,
  isVerified,
  totalBookings,
  numBeds,
  isSaved = false,
  onSave,
}: PropertyHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs / Category */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-500/80">
          <span>{type === 'Hostel' ? 'Dormitory' : type}</span>
          <span className="w-1 h-1 rounded-full bg-sky-500/30" />
          <span>{location.split(',')[0]}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.9]">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Icon name="MapPinIcon" size={18} className="text-sky-400" />
                <span className="text-sm font-medium tracking-tight">{location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="StarIcon" size={18} className="text-amber-400" variant="solid" />
                <span className="text-sm font-bold text-white">{rating > 0 ? rating.toFixed(1) : "New"}</span>
                <span className="text-sm font-medium text-zinc-500">({reviewCount} reviews)</span>
              </div>
              {isVerified && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <Icon name="CheckBadgeIcon" size={16} className="text-emerald-400" variant="solid" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({ title: name, url: window.location.href }).catch(console.error);
                }
              }}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all duration-300"
            >
              <Icon name="ShareIcon" size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-bold text-zinc-300 group-hover:text-white">Share</span>
            </button>
            
            {onSave && (
              <button
                onClick={onSave}
                className="group flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all duration-300"
              >
                <Icon
                  name="HeartIcon"
                  size={20}
                  variant={isSaved ? "solid" : "outline"}
                  className={`${isSaved ? 'text-rose-500 scale-110' : 'text-zinc-400 group-hover:text-rose-400'} transition-all duration-300`}
                />
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white">
                  {isSaved ? 'Saved' : 'Save'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3 p-1.5 bg-white/[0.02] border border-white/5 rounded-[2rem] w-fit">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full">
          <Icon name="CalendarDaysIcon" size={16} className="text-sky-400" />
          <span className="text-xs font-bold text-zinc-300">
            {totalBookings === 1 ? '1 Booking' : `${totalBookings.toLocaleString('en-IN')} Bookings`}
          </span>
        </div>
        {numBeds !== undefined && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full">
            <Icon name="QueueListIcon" size={16} className="text-zinc-400" />
            <span className="text-xs font-bold text-zinc-300">{numBeds} Beds Available</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-300 tracking-tight">Available Now</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyHeader;

