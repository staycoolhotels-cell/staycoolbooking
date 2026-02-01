'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
  address: string;
  nearbyAttractions: Array<{
    name: string;
    distance: string;
    type: string;
  }>;
}

const LocationMap = ({
  latitude,
  longitude,
  locationName,
  address,
  nearbyAttractions,
}: LocationMapProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">Location & Nearby</h2>

      <div className="mb-6">
        <div className="flex items-start space-x-3 mb-4">
          <Icon name="MapPinIcon" size={24} className="text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
              {locationName}
            </h3>
            <p className="text-sm text-text-secondary">{address}</p>
          </div>
        </div>
      </div>

      <div className="w-full h-96 rounded-xl overflow-hidden mb-6">
        <iframe
          width="100%"
          height="100%"
          loading="lazy"
          title={locationName}
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`}
          className="border-0"
        ></iframe>
      </div>

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Nearby Attractions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyAttractions.map((attraction, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon
                  name={
                    attraction.type === 'restaurant'
                      ? 'BuildingStorefrontIcon'
                      : attraction.type === 'park'
                        ? 'MapIcon'
                        : 'BuildingOffice2Icon'
                  }
                  size={20}
                  className="text-primary"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-heading font-semibold text-foreground mb-1">
                  {attraction.name}
                </h4>
                <p className="text-xs text-text-secondary">{attraction.distance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-primary/10 rounded-lg flex items-start space-x-3">
        <Icon
          name="InformationCircleIcon"
          size={20}
          className="text-primary flex-shrink-0 mt-0.5"
        />
        <p className="text-sm text-foreground">
          Exact location will be shared after booking confirmation for your safety and privacy.
        </p>
      </div>
    </div>
  );
};

export default LocationMap;
