import React from 'react';
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
  const availableAmenities = amenities.filter((a) => a.available);
  const unavailableAmenities = amenities.filter((a) => !a.available);

  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
        Amenities & Facilities
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {availableAmenities.map((amenity) => (
          <div
            key={amenity.id}
            className="flex items-start space-x-4 p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors duration-200"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name={amenity.icon} size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-heading font-semibold text-foreground mb-1">
                {amenity.name}
              </h3>
              <p className="text-sm text-text-secondary">{amenity.description}</p>
            </div>
            <Icon name="CheckCircleIcon" size={20} className="text-success" variant="solid" />
          </div>
        ))}
      </div>

      {unavailableAmenities.length > 0 && (
        <>
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              Not Available
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unavailableAmenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg opacity-60"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Icon name={amenity.icon} size={24} className="text-text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-heading font-medium text-text-secondary mb-1">
                      {amenity.name}
                    </h3>
                  </div>
                  <Icon name="XCircleIcon" size={20} className="text-text-secondary" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AmenitiesSection;
