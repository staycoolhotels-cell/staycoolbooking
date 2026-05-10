'use client';

import React from 'react';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { Button, TextField } from '@mui/material';
import { Search, MapPin, Star, Shield, Award, X, Home, Building, Tent, Building2, Palmtree, Bed, Hotel, Sofa, LayoutGrid } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface UltraLuxuryHeroSectionProps {
  onSearch?: (filters: { location: string; dates?: DateRange; stayType?: string }) => void;
}

const UltraLuxuryHeroSection = ({ onSearch }: UltraLuxuryHeroSectionProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [stayType, setStayType] = React.useState<string>('all');
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isStayTypeOpen, setIsStayTypeOpen] = React.useState(false);

  const stayTypes = [
    { id: 'all', name: 'All Stays', icon: LayoutGrid },
    { id: 'hotel', name: 'Hotel Rooms', icon: Hotel },
    { id: 'homestay', name: 'Home Stays', icon: Home },
    { id: 'villa', name: 'Villas', icon: Building2 },
    { id: 'tent', name: 'Tents', icon: Tent },
    { id: 'wooden', name: 'Wooden Stays', icon: Sofa },
    { id: 'dormitory', name: 'Dormitory Stays', icon: Bed },
    { id: 'apartment', name: 'Apartments', icon: Building },
    { id: 'resort', name: 'Resorts', icon: Palmtree },
  ];

  const hasFilters = searchTerm.trim() !== '' || !!dateRange || stayType !== 'all';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ location: searchTerm, dates: dateRange, stayType });
    }
  };

  const handleCancel = () => {
    setSearchTerm('');
    setDateRange(undefined);
    setStayType('all');
    if (onSearch) {
      onSearch({ location: '', dates: undefined, stayType: 'all' });
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.5,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const iconVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.3 + 1.5,
        type: 'spring',
        stiffness: 150,
        damping: 10,
      },
    }),
  };

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]); // Background moves slower
  const y2 = useTransform(scrollY, [0, 500], [0, -150]); // Text moves up faster feels like zooming
  const opacity = useTransform(scrollY, [0, 300], [1, 0]); // Fade out text

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-start text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          style={{ y: y1 }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
          className="w-full h-full"
        >
          <AppImage
            src="https://images.unsplash.com/photo-1763478958711-dd84b33cfe16?q=70&w=1200&auto=format&fit=crop"
            alt="Luxury Villa Background - StayCool Luxury Stays"
            fill
            priority
            fetchPriority="high"
            className="object-cover brightness-[0.4]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent z-10" />
      </div>

      {/* Main Content */}
      <motion.div
        style={{ 
          y: typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : y2, 
          opacity 
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center px-6 mt-20 sm:mt-0 pt-10 sm:pt-32 md:pt-36 pb-12 w-full"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight leading-tight"
          style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
        >
          Find Your Stay
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-8 text-zinc-300"
        >
          Discover a curated collection of the world&apos;s most extraordinary properties, where
          luxury meets tranquility.
        </motion.p>

        {/* Glassmorphism Search Bar */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-4xl p-2 mb-12 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] md:rounded-full border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.37)]"
        >
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch w-full relative">
            
            {/* Where To */}
            <div className="w-full md:w-[30%] flex flex-col justify-center px-6 md:px-7 py-3.5 text-left hover:bg-white/20 md:rounded-full rounded-t-[2rem] transition-all duration-300 cursor-text group">
              <label htmlFor="where-to-input" className="text-[11px] font-extrabold text-white uppercase tracking-wider cursor-text mb-0.5 whitespace-nowrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Where to?</label>
              <div className="flex items-center gap-2">
                <input
                  id="where-to-input"
                  type="text"
                  placeholder="Search destinations"
                  aria-label="Destination location"
                  className="bg-transparent border-none outline-none text-white text-[15px] font-medium placeholder:text-zinc-300 w-full p-0 flex-1 truncate"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="flex-shrink-0 text-zinc-300 hover:text-white transition-colors"
                    aria-label="Clear destination search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center">
              <div className="w-px h-10 bg-white/30 drop-shadow-md" />
            </div>

            {/* Check In & Check Out */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button 
                  type="button"
                  aria-label="Select check-in and check-out dates"
                  className="w-full md:w-auto flex-grow flex flex-row items-stretch border-t border-white/20 md:border-t-0 bg-transparent text-left p-0 focus:outline-none focus:ring-2 focus:ring-sky-500 md:focus:rounded-full"
                >
                  <div className="flex-1 flex flex-col justify-center px-5 md:px-7 py-3.5 hover:bg-white/20 md:rounded-full transition-all duration-300 cursor-pointer group border-r border-white/20 md:border-r-0">
                    <span className="text-[11px] font-extrabold text-white uppercase tracking-wider mb-0.5 whitespace-nowrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Check in</span>
                    <span className="text-[14px] md:text-[15px] font-medium text-zinc-100 truncate transition-colors" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {dateRange?.from ? <span className="text-white">{format(dateRange.from, 'MMM dd, yyyy')}</span> : 'Add dates'}
                    </span>
                  </div>
                  
                  <div className="hidden md:flex items-center">
                    <div className="w-px h-10 bg-white/30 drop-shadow-md" />
                  </div>

                  <div className="flex-1 flex flex-col justify-center px-5 md:px-7 py-3.5 hover:bg-white/20 md:rounded-full transition-all duration-300 cursor-pointer group">
                    <span className="text-[11px] font-extrabold text-white uppercase tracking-wider mb-0.5 whitespace-nowrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Check out</span>
                    <span className="text-[14px] md:text-[15px] font-medium text-zinc-100 truncate transition-colors" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {dateRange?.to ? <span className="text-white">{format(dateRange.to, 'MMM dd, yyyy')}</span> : 'Add dates'}
                    </span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 border border-white/10 bg-black/50 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] mt-4 relative z-50 overflow-visible" align="center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from || new Date()}
                  disabled={{ before: new Date(new Date().setHours(0,0,0,0)) }}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (
                      range?.from &&
                      range?.to &&
                      range.from.toDateString() === range.to.toDateString()
                    ) {
                      // User clicked a single date — keep only check-in, clear check-out
                      setDateRange({ from: range.from, to: undefined });
                    } else {
                      setDateRange(range);
                      // Auto-close when both dates are selected
                      if (range?.from && range?.to) {
                        setIsCalendarOpen(false);
                      }
                    }
                  }}
                  numberOfMonths={1}
                  className="p-5 text-zinc-100 bg-transparent relative z-10"
                />
              </PopoverContent>
            </Popover>

            <div className="hidden md:flex items-center">
              <div className="w-px h-10 bg-white/30 drop-shadow-md" />
            </div>

            {/* Stay Type */}
            <Popover open={isStayTypeOpen} onOpenChange={setIsStayTypeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full md:w-auto flex flex-col items-center justify-center px-5 md:px-7 py-3.5 hover:bg-white/20 md:rounded-full transition-all duration-300 cursor-pointer group border-t border-white/20 md:border-t-0 text-center"
                >
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-wider mb-0.5 whitespace-nowrap" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Stay Type</span>
                  <span className="text-[14px] md:text-[15px] font-medium text-zinc-100 truncate transition-colors" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {stayTypes.find(t => t.id === stayType)?.name || 'All Stays'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 border border-white/10 bg-black/70 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] mt-4 relative z-50" align="center">
                <div className="grid grid-cols-1 gap-1">
                  {stayTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setStayType(type.id);
                        setIsStayTypeOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${stayType === type.id ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/10 text-zinc-300 hover:text-white'}`}
                    >
                      <type.icon className={`w-4 h-4 ${stayType === type.id ? 'text-sky-400' : 'text-zinc-500'}`} />
                      <span className="text-sm font-semibold">{type.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Search & Cancel Buttons */}
            <div className="w-full md:w-auto p-2 flex items-center justify-center gap-2 border-t border-white/20 md:border-t-0 flex-shrink-0">
              {hasFilters && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold py-3.5 px-5 md:py-4 rounded-[1.5rem] md:rounded-full border border-white/20 hover:border-white/40 transition-all duration-300"
                  aria-label="Clear current filters"
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[14px] tracking-wide">Cancel</span>
                </button>
              )}
              <button
                type="submit"
                aria-label="Submit search for properties"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-bold py-3.5 px-6 md:px-7 md:py-4 rounded-[1.5rem] md:rounded-full shadow-[0_4px_20px_rgba(14,165,233,0.4)] hover:shadow-[0_8px_25px_rgba(14,165,233,0.6)] hover:scale-[1.02] transition-all duration-300 w-full md:w-auto"
              >
                <Search className="w-5 h-5 flex-shrink-0" />
                <span className="text-[15px] tracking-wide">Search</span>
              </button>
            </div>

          </form>
        </motion.div>

        {/* Feature Icons */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-16">
          {[
            { IconComp: Star, text: 'Top Rated' },
            { IconComp: Shield, text: 'Verified' },
            { IconComp: Award, text: 'Best Value' },
          ].map((feature, i) => (
            <motion.div
              key={feature.text}
              custom={i}
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-2"
            >
              <feature.IconComp className="w-8 h-8 md:w-10 md:h-10 text-sky-400" />
              <span className="text-sm md:text-base font-semibold text-zinc-200">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default UltraLuxuryHeroSection;
