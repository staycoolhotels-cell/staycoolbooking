'use client';

import React from 'react';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { Button, TextField } from '@mui/material';
import { Search, MapPin, Calendar, Star, Shield, Award } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

interface UltraLuxuryHeroSectionProps {
  onSearch?: (term: string) => void;
}

const UltraLuxuryHeroSection = ({ onSearch }: UltraLuxuryHeroSectionProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center text-white">
      {/* Background Image */}
      <motion.div
        style={{ y: y1 }}
        initial={{ scale: 1 }}
        animate={{ scale: 1.1 }}
        transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        className="absolute inset-0 z-0"
      >
        <AppImage
          src="https://images.unsplash.com/photo-1763478958711-dd84b33cfe16?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Luxury Villa"
          fill
          priority
          unoptimized
          className="object-cover brightness-[0.4]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent z-10" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        style={{ y: y2, opacity }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center px-4 mt-24"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight"
          style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
        >
          Find Your Stay
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-8 text-zinc-300 px-4"
        >
          Discover a curated collection of the world&apos;s most extraordinary properties, where
          luxury meets tranquility.
        </motion.p>

        {/* Glassmorphism Search Bar */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-4xl p-2 md:p-4 mb-12 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 shadow-2xl mx-4"
        >
          <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-4">
            <div className="flex-grow flex items-center gap-2 px-2 md:px-4">
              <MapPin className="text-zinc-400 w-5 h-5 md:w-6 md:h-6" />
              <TextField
                variant="standard"
                placeholder="Where to?"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  style: { color: 'white', fontSize: '0.9rem' },
                }}
                sx={{
                  '.MuiInput-input': { padding: '12px 0' },
                  '& .MuiInput-input::placeholder': { color: '#a1a1aa', opacity: 1 },
                }}
              />
            </div>
            <div className="hidden md:flex items-center gap-2 px-4">
              <Calendar className="text-zinc-400" />
              <TextField
                variant="standard"
                placeholder="Select Dates"
                fullWidth
                InputProps={{
                  disableUnderline: true,
                  style: { color: 'white' },
                }}
                sx={{
                  '.MuiInput-input': { padding: '12px 0' },
                  '& .MuiInput-input::placeholder': { color: '#a1a1aa', opacity: 1 },
                }}
              />
            </div>
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: '9999px',
                padding: { xs: '8px 20px', md: '12px 32px' },
                fontSize: { xs: '0.9rem', md: '1.125rem' },
                color: 'white',
                background: '#0ea5e9', // Sky-500
                boxShadow: '0 4px 15px 0 rgba(14, 165, 233, 0.4)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(14, 165, 233, 0.5)',
                  background: '#0284c7', // Sky-600
                },
              }}
            >
              <Search className="mr-0 md:mr-2 w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline">Search</span>
            </Button>
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
