import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Amenity {
  id: number;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

interface AmenitiesSectionProps {
  amenities: Amenity[];
}

const AmenitiesSection = ({ amenities }: AmenitiesSectionProps) => {
  const [showAll, setShowAll] = useState(false);

  const availableAmenities = amenities.filter((a) => a.available);
  const unavailableAmenities = amenities.filter((a) => !a.available);

  const displayLimit = 4;
  const displayedAvailable = showAll ? availableAmenities : availableAmenities.slice(0, displayLimit);
  const hasMore = availableAmenities.length > displayLimit || unavailableAmenities.length > 0;

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:p-8 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Icon name="Squares2X2Icon" size={20} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Amenities & Facilities
        </h2>
      </div>

      <div className={`grid grid-cols-2 gap-2 sm:gap-4 ${hasMore && !showAll ? 'mb-6' : 'mb-8'}`}>
        {displayedAvailable.map((amenity) => (
          <div
            key={amenity.id}
            className="group flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-colors duration-300"
          >
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-success/10 sm:bg-white/[0.05] rounded-full sm:rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-success/20 sm:border-white/5 group-hover:border-primary/30">
              <Icon name={amenity.icon} size={16} className="text-success sm:text-white/70 group-hover:text-primary transition-colors w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
              <h3 className="text-[11px] sm:text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">
                {amenity.name}
              </h3>
              {amenity.description && (
                <p className="hidden sm:block text-[10px] sm:text-xs text-zinc-400 mt-0.5 line-clamp-2">{amenity.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!showAll && hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full md:w-auto px-8 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>Show all {amenities.length} amenities</span>
        </button>
      )}

      {showAll && unavailableAmenities.length > 0 && (
        <div className="pt-8 border-t border-white/5">
          <h3 className="text-sm font-semibold tracking-widest text-white/40 uppercase mb-5 flex items-center gap-2">
            <Icon name="NoSymbolIcon" size={16} />
            <span>Not Available</span>
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1 ml-2" />
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {unavailableAmenities.map((amenity) => (
              <div
                key={amenity.id}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3 p-3 bg-white/[0.01] rounded-xl opacity-50"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/[0.03] rounded-lg">
                  <Icon name={amenity.icon} size={16} className="text-zinc-600 sm:!w-5 sm:!h-5" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                  <h3 className="text-[11px] sm:text-sm font-medium text-zinc-500 line-through truncate leading-tight">
                    {amenity.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAll && hasMore && (
        <div className="pt-8">
          <button
            onClick={() => setShowAll(false)}
            className="w-full md:w-auto px-8 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Show less</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AmenitiesSection;
