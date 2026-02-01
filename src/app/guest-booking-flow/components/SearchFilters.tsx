'use client';

import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const SearchFilters = ({ filters, setFilters }: { filters: any; setFilters: any }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleDateChange = (name: string, value: Date | null) => {
    setFilters({ ...filters, [name]: value ? value.toISOString().split('T')[0] : '' });
  };

  const handleGuestChange = (delta: number) => {
    setFilters((prev: any) => {
      const newGuests = Math.max(1, prev.guests + delta);
      return { ...prev, guests: newGuests };
    });
  };

  return (
    <div className="p-4 rounded-xl shadow-brand-md flex items-center space-x-4 bg-card/50 backdrop-blur-md border border-brand-energetic/20">
      <div className="flex-1">
        <label className="text-xs font-semibold text-gray-500">Location</label>
        <input
          type="text"
          name="location"
          value={filters.location}
          onChange={handleInputChange}
          className="w-full p-2 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs font-semibold text-text-secondary">Check-in</label>
        <DatePicker
          label="Check-in"
          value={filters.checkIn ? new Date(filters.checkIn) : null}
          onChange={(newValue) => handleDateChange('checkIn', newValue)}
          minDate={new Date()}
          slotProps={{
            textField: {
              name: 'checkIn',
              className:
                'w-full p-2 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow',
            },
            popper: {
              sx: {
                zIndex: 1300, // Ensure it's above other content
                '& .MuiPaper-root': {
                  // Target the Paper component within the Popper
                  backgroundColor: 'rgb(32, 43, 56, 0.5)', // bg-card/50
                  backdropFilter: 'blur(8px)', // backdrop-blur-md
                  border: '1px solid rgba(0, 191, 255, 0.2)', // border-brand-energetic/20
                  boxShadow: '0 4px 16px rgba(135, 206, 235, 0.12)', // shadow-brand-md
                  borderRadius: '1.5rem', // rounded-3xl
                  '.MuiPickersDay-root': {
                    // Customize day styling for better contrast
                    color: 'rgb(224, 231, 235)', // text-text-primary
                    '&.Mui-selected': {
                      backgroundColor: 'rgb(0, 191, 255) !important', // bg-primary
                      color: 'rgb(255, 255, 255)', // text-white
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 191, 255, 0.25) !important', // More distinct hover
                    },
                    '&.MuiPickersDay-today': {
                      border: '1px solid rgb(0, 191, 255)', // border-primary
                    },
                    fontFamily: 'Montserrat, sans-serif', // Consistent font
                  },
                  '.MuiPickersCalendarHeader-root': {
                    color: 'rgb(224, 231, 235)', // text-text-primary
                    fontFamily: 'Montserrat, sans-serif', // Consistent font
                  },
                  '.MuiSvgIcon-root': {
                    // navigation arrows
                    color: 'rgb(224, 231, 235)', // text-text-primary
                  },
                  '.MuiTypography-root': {
                    // Month and Year text
                    color: 'rgb(224, 231, 235)', // text-text-primary
                    fontFamily: 'Montserrat, sans-serif', // Consistent font
                  },
                  '.MuiCalendarPicker-root': {
                    backgroundColor: 'transparent', // Ensure picker background is transparent
                  },
                  '.MuiPickersToolbar-root': {
                    backgroundColor: 'transparent', // Ensure toolbar background is transparent
                    color: 'rgb(224, 231, 235)', // text-text-primary
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className="flex-1">
        <label className="text-xs font-semibold text-text-secondary">Check-out</label>
        <DatePicker
          label="Check-out"
          value={filters.checkOut ? new Date(filters.checkOut) : null}
          onChange={(newValue) => handleDateChange('checkOut', newValue)}
          minDate={filters.checkIn ? new Date(filters.checkIn) : new Date()}
          slotProps={{
            textField: {
              name: 'checkOut',
              className:
                'w-full p-2 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow',
            },
            popper: {
              sx: {
                zIndex: 1300, // Ensure it's above other content
                '& .MuiPaper-root': {
                  // Target the Paper component within the Popper
                  backgroundColor: 'rgb(32, 43, 56, 0.5)', // bg-card/50
                  backdropFilter: 'blur(8px)', // backdrop-blur-md
                  border: '1px solid rgba(0, 191, 255, 0.2)', // border-brand-energetic/20
                  boxShadow: '0 4px 16px rgba(135, 206, 235, 0.12)', // shadow-brand-md
                  borderRadius: '1.5rem', // rounded-3xl
                  '.MuiPickersDay-root': {
                    // Customize day styling for better contrast
                    color: 'rgb(224, 231, 235)', // text-text-primary
                    '&.Mui-selected': {
                      backgroundColor: 'rgb(0, 191, 255) !important', // bg-primary
                      color: 'rgb(255, 255, 255)', // text-white
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 191, 255, 0.25) !important', // More distinct hover
                    },
                    '&.MuiPickersDay-today': {
                      border: '1px solid rgb(0, 191, 255)', // border-primary
                    },
                    fontFamily: 'Montserrat, sans-serif', // Consistent font
                  },
                  '.MuiPickersCalendarHeader-root': {
                    color: 'rgb(224, 231, 235)', // text-text-primary
                    fontFamily: 'Montserrat, sans-serif', // Consistent font
                  },
                  '.MuiSvgIcon-root': {
                    // navigation arrows
                    color: 'rgb(224, 231, 235)', // text-text-primary
                  },
                  '.MuiTypography-root': {
                    // Month and Year text
                    color: 'rgb(224, 231, 235)', // text-text-primary
                    fontFamily: 'Montserrat, sans-serif', // Consistent font
                  },
                  '.MuiCalendarPicker-root': {
                    backgroundColor: 'transparent', // Ensure picker background is transparent
                  },
                  '.MuiPickersToolbar-root': {
                    backgroundColor: 'transparent', // Ensure toolbar background is transparent
                    color: 'rgb(224, 231, 235)', // text-text-primary
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className="flex-1">
        <label className="text-xs font-semibold text-text-secondary">Guests</label>
        <div className="flex items-center justify-between w-full p-2 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus-within:ring-2 focus-within:ring-brand-energetic hover:shadow-sm transition-shadow">
          <button
            type="button"
            onClick={() => handleGuestChange(-1)}
            className="p-1 text-lg font-bold text-text-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={filters.guests <= 1}
          >
            -
          </button>
          <span className="font-medium text-text-primary">{filters.guests}</span>
          <button
            type="button"
            onClick={() => handleGuestChange(1)}
            className="p-1 text-lg font-bold text-text-primary hover:text-primary transition-colors"
          >
            +
          </button>
        </div>
      </div>{' '}
    </div>
  );
};

export default SearchFilters;
