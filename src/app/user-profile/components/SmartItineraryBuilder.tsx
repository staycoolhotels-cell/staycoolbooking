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
    { name: "Johnson's Cafe", type: 'Cafe', icon: 'CoffeeIcon' },
    { name: 'Hidimba Devi Temple', type: 'Spot', icon: 'LandmarkIcon' },
    { name: 'Solang Valley Ropecar', type: 'Experience', icon: 'MountainSnowIcon' },
  ],
  Goa: [
    { name: 'Thalassa Beach Club', type: 'Cafe', icon: 'CupSodaIcon' },
    { name: 'Chapora Fort', type: 'Spot', icon: 'CastleIcon' },
    { name: 'Kayaking at Palolem', type: 'Experience', icon: 'WavesIcon' },
  ],
  Default: [
    { name: 'Local Artisan Coffee', type: 'Cafe', icon: 'CoffeeIcon' },
    { name: 'Hidden Park', type: 'Spot', icon: 'TreesIcon' },
    { name: 'Museum Visit', type: 'Experience', icon: 'LandmarkIcon' },
  ],
};

const weatherForecasts = {
  Manali: {
    temp: '15°C',
    condition: 'Partly Cloudy',
    icon: 'CloudyIcon',
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
      className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3"
    >
      <Icon name={suggestion.icon} className="w-8 h-8 text-primary flex-shrink-0" />
      <div>
        <p className="font-semibold text-white">{suggestion.name}</p>
        <p className="text-xs text-gray-400">{suggestion.type}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to border border-border rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Smart Itinerary</h2>

      {/* Weather Intelligence */}
      <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-200">
              Weather Alert for {activeBooking.properties.location}
            </p>
            <p className="font-semibold text-white mt-1">{forecast.alert}</p>
          </div>
          <div className="text-center">
            <Icon name={forecast.icon as any} className="w-10 h-10 text-yellow-300" />
            <p className="font-bold text-lg text-white">{forecast.temp}</p>
          </div>
        </div>
      </div>

      {/* Local Suggestions */}
      <div>
        <h3 className="font-semibold text-gray-300 mb-3">Local Suggestions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map(renderSuggestion)}
        </div>
      </div>
    </div>
  );
};

export default SmartItineraryBuilder;
