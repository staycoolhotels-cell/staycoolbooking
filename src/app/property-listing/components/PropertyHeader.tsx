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
}

const PropertyHeader = ({
  name,
  type,
  location,
  rating,
  reviewCount,
  isVerified,
  totalBookings,
}: PropertyHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{name}</h1>
            {isVerified && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-success/10 rounded-full">
                <Icon name="CheckBadgeIcon" size={20} className="text-success" variant="solid" />
                <span className="text-sm font-heading font-medium text-success">Verified</span>
              </div>
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
