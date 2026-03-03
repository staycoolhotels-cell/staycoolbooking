'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface MapProperty {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  price: number;
  available: boolean;
  image: string;
}

interface InteractiveMapProps {
  properties: MapProperty[];
  onPropertySelect: (id: string | number) => void;
}

const InteractiveMap = ({ properties, onPropertySelect }: InteractiveMapProps) => {
  const [hoveredProperty, setHoveredProperty] = useState<MapProperty | null>(null);

  // This is a placeholder for the map. In a real app, you would use a map library like Mapbox or Google Maps.
  const mapImageUrl =
    'https://images.unsplash.com/photo-1593817354964-5dd6370228ce?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Explore Properties on the Map
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Visually discover your next stay. Hover over a marker to see details.
          </p>
        </div>
        <div className="relative h-[600px] w-full rounded-2xl shadow-2xl overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src="https://www.openstreetmap.org/export/embed.html?bbox=-0.489%2C51.28%2C0.236%2C51.686&layer=mapnik&marker=51.4825%2C-0.1275"
            style={{ border: '1px solid black' }}
          ></iframe>

          {properties.map((property) => (
            <div
              key={property.id}
              className="absolute"
              style={{
                top: `${property.lat}%`,
                left: `${property.lng}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setHoveredProperty(property)}
              onMouseLeave={() => setHoveredProperty(null)}
            >
              <button
                onClick={() => onPropertySelect(property.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${hoveredProperty?.id === property.id
                    ? 'bg-primary text-white scale-125'
                    : 'bg-white text-primary'
                  }`}
              >
                <span className="font-bold text-sm">₹{Math.round(property.price / 1000)}k</span>
              </button>

              {hoveredProperty?.id === property.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-64 mb-3 bg-white rounded-lg shadow-2xl p-3 z-10">
                  <AppImage
                    src={hoveredProperty.image}
                    alt={hoveredProperty.title}
                    className="w-full h-32 rounded-md"
                    fill={true}
                    objectFit="cover"
                  />
                  <h4 className="mt-2 font-bold text-gray-800 truncate">{hoveredProperty.title}</h4>
                  <p className="text-primary font-semibold">
                    ₹{hoveredProperty.price.toLocaleString('en-IN')} / night
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InteractiveMap;
