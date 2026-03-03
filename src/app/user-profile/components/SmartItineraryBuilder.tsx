'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';

type SmartItineraryBuilderProps = {
  activeBooking: (Booking & { properties: Partial<Property> }) | null;
};

// Mock data for local suggestions and weather - in a real app, this would come from APIs
const localSuggestions = {
  Manali: [
    { name: "Johnson's Cafe", type: 'Cafe', icon: 'BuildingStorefrontIcon' },
    { name: 'Hidimba Devi Temple', type: 'Spot', icon: 'MapPinIcon' },
    { name: 'Solang Valley Ropecar', type: 'Experience', icon: 'TicketIcon' },
  ],
  Goa: [
    { name: 'Thalassa Beach Club', type: 'Cafe', icon: 'SparklesIcon' },
    { name: 'Chapora Fort', type: 'Spot', icon: 'BuildingLibraryIcon' },
    { name: 'Kayaking at Palolem', type: 'Experience', icon: 'GlobeAltIcon' },
  ],
  Default: [
    { name: 'Local Artisan Coffee', type: 'Cafe', icon: 'BuildingStorefrontIcon' },
    { name: 'Hidden Park', type: 'Spot', icon: 'SunIcon' },
    { name: 'Museum Visit', type: 'Experience', icon: 'BuildingLibraryIcon' },
  ],
};

const weatherForecasts = {
  Manali: {
    temp: '15°C',
    condition: 'Partly Cloudy',
    icon: 'CloudIcon',
    alert: 'Carry a light jacket for cool evenings.',
  },
  Goa: {
    temp: '28°C',
    condition: 'Sunny',
    icon: 'SunIcon',
    alert: 'Sunscreen and sunglasses are a must!',
  },
  Default: {
    temp: '22°C',
    condition: 'Clear Skies',
    icon: 'SunIcon',
    alert: 'Perfect weather for exploring.',
  },
};

const SmartItineraryBuilder = ({ activeBooking }: SmartItineraryBuilderProps) => {
  if (!activeBooking) {
    return null; // Don't render if there's no active trip
  }

  const locationKey = activeBooking.properties.location?.includes('Manali')
    ? 'Manali'
    : activeBooking.properties.location?.includes('Goa')
      ? 'Goa'
      : 'Default';
  const suggestions = localSuggestions[locationKey as keyof typeof localSuggestions];
  const forecast = weatherForecasts[locationKey as keyof typeof weatherForecasts];

  const renderSuggestion = (suggestion: any, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-3 flex items-center gap-3 hover:bg-zinc-900/80 transition-colors"
    >
      <Icon name={suggestion.icon} className="w-8 h-8 text-sky-500 flex-shrink-0" />
      <div>
        <p className="font-semibold text-white">{suggestion.name}</p>
        <p className="text-xs text-zinc-400">{suggestion.type}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2rem] shadow-xl p-6 shadow-sky-900/5">
      <h2 className="text-xl font-bold text-white mb-4">Smart Itinerary</h2>

      {/* Weather Intelligence */}
      <div className="bg-zinc-950/40 border border-sky-500/20 rounded-2xl p-4 mb-6 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-sky-300 font-medium tracking-wide">
              Weather Alert for {activeBooking.properties.location}
            </p>
            <p className="font-semibold text-white mt-1">{forecast.alert}</p>
          </div>
          <div className="text-center">
            <Icon name={forecast.icon as any} className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
            <p className="font-bold text-lg text-white">{forecast.temp}</p>
          </div>
        </div>
      </div>

      {/* Local Suggestions */}
      <div>
        <h3 className="font-semibold text-zinc-300 mb-3">Local Suggestions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map(renderSuggestion)}
        </div>
      </div>
    </div>
  );
};

export default SmartItineraryBuilder;
