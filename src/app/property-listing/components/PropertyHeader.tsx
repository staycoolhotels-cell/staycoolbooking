import React from 'react';
import Icon from '@/components/ui/AppIcon';

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
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mb-4">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight">{name}</h1>
              {isVerified && (
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-success/10 border border-success/20 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-md">
                  <Icon name="CheckBadgeIcon" size={18} className="text-success" variant="solid" />
                  <span className="text-xs font-heading font-bold tracking-wide text-success uppercase">Verified Host</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({ title: name, url: window.location.href }).catch(console.error);
                  }
                }}
                className="flex-1 md:flex-none group flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 backdrop-blur-xl"
              >
                <Icon name="ShareIcon" size={20} className="text-zinc-400 group-hover:text-sky-400 transition-colors" />
                <span className="text-sm text-zinc-300 font-semibold tracking-wide">Share</span>
              </button>
              
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    // Add a small visual feedback logic if desired, or keep simple
                  }
                }}
                className="flex-1 md:flex-none group flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 backdrop-blur-xl"
              >
                <Icon name="LinkIcon" size={20} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                <span className="text-sm text-zinc-300 font-semibold tracking-wide">Copy Link</span>
              </button>

              {onSave && (
                <button
                  onClick={onSave}
                  className="w-full sm:w-auto flex-1 md:flex-none group flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 backdrop-blur-xl"
                >
                  <Icon
                    name="HeartIcon"
                    size={22}
                    variant={isSaved ? "solid" : "outline"}
                    className={`${isSaved ? 'text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-zinc-400 group-hover:text-rose-400'} transition-all duration-300`}
                  />
                  <span className="text-sm text-zinc-300 font-semibold tracking-wide">
                    {isSaved ? 'Saved' : 'Save'}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
              <Icon name="HomeModernIcon" size={16} className="text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">{type === 'Hostel' ? 'Dormitory' : type}</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
              <Icon name="MapPinIcon" size={16} className="text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">{location}</span>
            </div>

            {numBeds !== undefined && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                <Icon name="QueueListIcon" size={16} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">{numBeds} Beds</span>
              </div>
            )}

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer group">
              <Icon name="StarIcon" size={16} className="text-amber-400 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" variant="solid" />
              <span className="text-sm font-bold text-white">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">({reviewCount} reviews)</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
              <Icon name="CalendarDaysIcon" size={16} />
              <span className="text-sm font-semibold">
                {totalBookings.toLocaleString('en-IN')} bookings
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyHeader;
