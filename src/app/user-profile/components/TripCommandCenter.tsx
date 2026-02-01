'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property } from '@/lib/types';
import Countdown from './Countdown';

type TripCommandCenterProps = {
  activeBooking: (Booking & { properties: Partial<Property> }) | null;
};

const TripCommandCenter = ({ activeBooking }: TripCommandCenterProps) => {
  const [isDigitalKeyVisible, setDigitalKeyVisible] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);

  const isCheckInAvailable = activeBooking
    ? new Date(activeBooking.check_in).getTime() <= Date.now()
    : false;

  useEffect(() => {
    if (isCheckInAvailable) {
      // Simulate generating a unique access code
      setAccessCode(
        `SC${activeBooking?.property_id.slice(-4).toUpperCase()}${new Date(
          activeBooking?.check_in || ''
        ).getDate()}`
      );
    }
  }, [isCheckInAvailable, activeBooking]);

  if (!activeBooking) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center h-full">
        <Icon name="LuggageIcon" className="w-12 h-12 text-gray-500 mb-4" />
        <h3 className="font-bold text-lg text-white">No Active Trips</h3>
        <p className="text-sm text-gray-400">Your next adventure will appear here.</p>
      </div>
    );
  }

  const { properties, check_in } = activeBooking;
  const property = properties;

  const handleNavigation = () => {
    const query = encodeURIComponent(property?.location || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to border border-border rounded-2xl shadow-xl overflow-hidden">
      <div
        className="p-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${property?.images?.[0] || ''})` }}
      >
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
          <h2 className="text-xs font-semibold uppercase text-primary tracking-widest">
            Trip Command Center
          </h2>
          <h3 className="text-2xl font-bold text-white mt-1">{property?.title}</h3>
          <p className="text-sm text-gray-300 flex items-center gap-2 mt-1">
            <Icon name="MapPinIcon" size={14} />
            {property?.location}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Live Countdown */}
        <div className="text-center">
          <p className="text-sm text-text-secondary font-medium mb-2">Countdown to Your Stay</p>
          <Countdown targetDate={check_in} />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNavigation}
            className="w-full bg-blue-600/20 text-blue-300 border border-blue-500/50 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all hover:bg-blue-600/40"
          >
            <Icon name="NavigationIcon" size={18} />
            <span className="font-semibold">One-Tap Navigation</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => isCheckInAvailable && setDigitalKeyVisible(true)}
            disabled={!isCheckInAvailable}
            className={`w-full rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all ${
              isCheckInAvailable
                ? 'bg-green-600/20 text-green-300 border border-green-500/50 hover:bg-green-600/40'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Icon name="KeyIcon" size={18} />
            <span className="font-semibold">
              {isCheckInAvailable ? 'View Digital Key' : 'Access on Check-In'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Digital Key Modal */}
      {isDigitalKeyVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50"
          onClick={() => setDigitalKeyVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-primary/30 rounded-2xl p-8 max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="KeyIcon" className="w-16 h-16 mx-auto text-primary animate-pulse" />
            <h3 className="text-2xl font-bold mt-4 text-white">Your Access Code</h3>
            <p className="text-gray-400 mt-2">
              Use this code to unlock your smart lock upon arrival.
            </p>
            <div className="my-6 bg-gray-900/50 border border-dashed border-gray-600 rounded-lg py-4">
              <p className="text-4xl font-mono tracking-widest text-green-400">{accessCode}</p>
            </div>
            <button
              onClick={() => setDigitalKeyVisible(false)}
              className="w-full bg-primary/20 text-primary border border-primary/50 rounded-lg py-2 font-semibold transition-colors hover:bg-primary/30"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TripCommandCenter;
