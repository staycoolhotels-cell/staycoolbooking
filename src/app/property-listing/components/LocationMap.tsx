'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  locationName: string;
  address: string;
  nearbyAttractions: Array<{
    name: string;
    distance: string;
    type: string;
  }>;
}

export const LocationMap = ({
  latitude,
  longitude,
  locationName,
  address,
  nearbyAttractions,
}: LocationMapProps) => {
  
  // Construct the embed URL. 
  // We use the coordinates if available for better accuracy, fall back to address string.
  const embedUrl = latitude && longitude 
    ? `https://www.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  // Construct the directions URL
  const directionsUrl = latitude && longitude 
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
        <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Location &amp; Nearby
        </h2>
        
        <a 
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-sky-500/20"
        >
          <Icon name="MapIcon" size={18} />
          <span>Get Directions</span>
        </a>
      </div>

      {/* Location name row */}
      <div className="mb-4 md:mb-8">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10 flex-shrink-0">
            <Icon name="MapPinIcon" size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-bold text-white mb-0.5">
              {locationName}
            </h3>
            <p className="text-xs md:text-sm font-medium text-zinc-400">{address}</p>
          </div>
        </div>
      </div>

      {/* Map iframe — shorter on mobile */}
      <div className="w-full h-48 md:h-96 rounded-2xl overflow-hidden mb-4 md:mb-8 border border-white/10 shadow-lg shadow-black/50 bg-zinc-950 relative">
        <iframe
          width="100%"
          height="100%"
          style={{ 
            border: 0, 
            filter: 'grayscale(1) invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)',
            opacity: 0.85
          }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
          title={`Map of ${locationName}`}
        />
        {/* Overlay to catch scroll but allow interaction? Actually, pointer-events-none on a child is better if we want to prevent zoom on scroll, but iframe doesn't support that easily without a wrapper. */}
      </div>

      {/* Nearby Attractions */}
      {nearbyAttractions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-3 md:mb-5 flex items-center gap-2">
            <Icon name="MapPinIcon" size={14} />
            <span>Nearby Attractions</span>
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1 ml-2" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {nearbyAttractions.map((attraction, index) => (
              <div
                key={index}
                className="group flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-9 h-9 md:w-12 md:h-12 bg-white/[0.05] rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/30">
                  <Icon
                    name={
                      attraction.type === 'restaurant'
                        ? 'BuildingStorefrontIcon'
                        : attraction.type === 'park'
                          ? 'MapIcon'
                          : 'BuildingOffice2Icon'
                    }
                    size={18}
                    className="text-white/70 group-hover:text-primary transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs md:text-sm font-semibold text-white group-hover:text-white transition-colors">
                    {attraction.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{attraction.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="mt-4 md:mt-8 p-3 md:p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start space-x-3 backdrop-blur-sm">
        <div className="mt-0.5 flex-shrink-0">
          <Icon
            name="InformationCircleIcon"
            size={18}
            className="text-primary"
          />
        </div>
        <p className="text-xs md:text-sm font-medium text-blue-100/80 leading-relaxed">
          Exact location will be shared after booking confirmation for your safety and privacy.
        </p>
      </div>
    </div>
  );
};

export default LocationMap;
