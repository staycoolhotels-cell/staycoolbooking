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
          <div className="flex items-center justify-between mb-3 w-full">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{name}</h1>
              {isVerified && (
                <div className="flex items-center space-x-1 px-3 py-1 bg-success/10 rounded-full">
                  <Icon name="CheckBadgeIcon" size={20} className="text-success" variant="solid" />
                  <span className="text-sm font-heading font-medium text-success">Verified</span>
                </div>
              )}
            </div>

            {onSave && (
              <button
                onClick={onSave}
                className="group flex flex-col items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors shrink-0"
              >
                <Icon
                  name="HeartIcon"
                  size={26}
                  variant={isSaved ? "solid" : "outline"}
                  className={`${isSaved ? 'text-rose-500' : 'text-zinc-400 group-hover:text-white'} transition-colors`}
                />
                <span className="text-[10px] text-zinc-500 font-medium mt-1">
                  {isSaved ? 'Saved' : 'Save'}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-text-secondary">
            <div className="flex items-center space-x-2">
              <Icon name="HomeModernIcon" size={20} />
              <span className="text-sm font-heading font-medium">{type}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Icon name="MapPinIcon" size={20} />
              <span className="text-sm font-heading font-medium">{location}</span>
            </div>

            {numBeds !== undefined && (
              <div className="flex items-center space-x-2">
                <Icon name="QueueListIcon" size={20} />
                <span className="text-sm font-heading font-medium">{numBeds} Beds</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Icon name="StarIcon" size={20} className="text-warning" variant="solid" />
              <span className="text-sm font-heading font-semibold text-foreground">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm font-heading font-medium">({reviewCount} reviews)</span>
            </div>

            <div className="flex items-center space-x-2">
              <Icon name="CalendarDaysIcon" size={20} />
              <span className="text-sm font-heading font-medium">
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
