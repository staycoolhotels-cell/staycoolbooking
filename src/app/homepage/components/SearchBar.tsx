'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  stayType: string;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [stayType, setStayType] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGuestSelector, setShowGuestSelector] = useState(false);

  const locationSuggestions = [
    'Mumbai, Maharashtra',
    'Goa, India',
    'Manali, Himachal Pradesh',
    'Jaipur, Rajasthan',
  ];

  const stayTypes = [
    { value: 'all', label: 'All Types', icon: 'HomeIcon' },
    { value: 'hotel', label: 'Hotel Rooms', icon: 'BuildingOffice2Icon' },
    { value: 'homestay', label: 'Home Stays', icon: 'HomeIcon' },
    { value: 'tent', label: 'Tents', icon: 'TentIcon' },
    { value: 'wooden', label: 'Wooden Stays', icon: 'HomeModernIcon' },
    { value: 'dormitory', label: 'Dormitory Stays', icon: 'UserGroupIcon' },
    { value: 'apartment', label: 'Apartment Stays', icon: 'BuildingLibraryIcon' },
    { value: 'resort', label: 'Resorts', icon: 'ResortIcon' },
  ];

  const handleSearch = () => {
    onSearch({
      location,
      checkIn,
      checkOut,
      guests,
      stayType,
    });
  };

  const filteredSuggestions = locationSuggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(location.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to rounded-2xl shadow-xl p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        <div className="lg:col-span-4 relative">
          <label className="block text-xs font-semibold text-text-secondary mb-1 ml-3">
            Location
          </label>
          <div className="relative">
            <Icon
              name="MapPinIcon"
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Where are you going?"
              className="w-full pl-10 pr-4 py-3 bg-input rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-text-primary placeholder-text-secondary"
            />
          </div>
          {showSuggestions && location && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-gradient-to-br from-gradient-card-from to-gradient-card-to border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setLocation(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-muted text-text-primary flex items-center space-x-3"
                >
                  <Icon name="MapPinIcon" size={16} className="text-primary" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-text-secondary mb-1 ml-3">
            Check-in
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-slate-800/80 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-400 [color-scheme:dark]"
          />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-text-secondary mb-1 ml-3">
            Check-out
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-slate-800/80 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-400 [color-scheme:dark]"
          />
        </div>
        <div className="lg:col-span-2 relative">
          <label className="block text-xs font-semibold text-text-secondary mb-1 ml-3">
            Guests
          </label>
          <button
            onClick={() => setShowGuestSelector(!showGuestSelector)}
            className="w-full text-left px-4 py-3 bg-input rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
          >
            {guests} {guests === 1 ? 'Guest' : 'Guests'}
          </button>
          {showGuestSelector && (
            <div className="absolute z-10 w-full mt-2 bg-gradient-to-br from-gradient-card-from to-gradient-card-to border border-border rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">Guests</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="p-2 rounded-full bg-muted hover:bg-muted-foreground text-text-primary"
                  >
                    <Icon name="MinusIcon" size={16} />
                  </button>
                  <span className="text-text-primary">{guests}</span>
                  <button
                    onClick={() => setGuests(guests + 1)}
                    className="p-2 rounded-full bg-muted hover:bg-muted-foreground text-text-primary"
                  >
                    <Icon name="PlusIcon" size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <button
            onClick={handleSearch}
            className="w-full h-full px-6 py-3 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-primary/40 flex items-center justify-center space-x-2"
          >
            <Icon name="MagnifyingGlassIcon" size={20} />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
