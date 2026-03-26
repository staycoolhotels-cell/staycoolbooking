'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';
import { getNearbyPlaces } from '@/lib/google-places';

type SmartItineraryBuilderProps = {
  activeBooking: (Booking & { properties: Partial<Property> }) | null;
};

const SmartItineraryBuilder = ({ activeBooking }: SmartItineraryBuilderProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!activeBooking?.properties?.location) return;
      
      setIsLoading(true);
      try {
        const address = activeBooking.properties.location;
        const result = await getNearbyPlaces(address);
        if (result?.suggestions) {
          setSuggestions(result.suggestions);
        }
      } catch (error) {
        console.error('Failed to fetch itinerary suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [activeBooking?.properties?.location]);

  if (!activeBooking) {
    return null;
  }

  // Mock weather forecast - could also be made real-time with an API
  const forecast = {
    temp: '22°C',
    condition: 'Clear Skies',
    icon: 'SunIcon',
    alert: 'Perfect weather for exploring.',
  };

  const renderSuggestion = (suggestion: any, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-3 flex items-center gap-3 hover:bg-zinc-900/80 transition-colors"
    >
      <Icon name={suggestion.icon as any} className="w-8 h-8 text-sky-500 flex-shrink-0" />
      <div>
        <p className="font-semibold text-white truncate max-w-[150px]">{suggestion.name}</p>
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
              Expedition Alert for {activeBooking.properties.location || activeBooking.properties.title}
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
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-800/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map(renderSuggestion)}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm italic">Scanning for coordinates... suggestions will appear shortly.</p>
        )}
      </div>
    </div>
  );
};

export default SmartItineraryBuilder;
