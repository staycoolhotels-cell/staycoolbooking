'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion'; // Added Variants type
import { Button, TextField } from '@mui/material';
import { Search, MapPin, Calendar, Star, Shield, Award } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

const UltraLuxuryHeroSection = () => {
  // 1. Explicitly type the variants for better TypeScript support
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
    // 2. Fix: Explicitly type the dynamic variant argument
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center text-white">
      {/* Background Image */}
      <motion.div
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center px-4"
      >
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight"
          style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
        >
          Find Your Stay
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-8 text-gray-200"
        >
          Discover a curated collection of the world&apos;s most extraordinary properties, where
          luxury meets tranquility.
        </motion.p>

        {/* Glassmorphism Search Bar */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-4xl p-4 mb-12 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 shadow-2xl"
        >
          <form className="flex items-center gap-4">
            <div className="flex-grow flex items-center gap-2 px-4">
              <MapPin className="text-gray-300" />
              <TextField
                variant="standard"
                placeholder="Where to?"
                fullWidth
                InputProps={{
                  disableUnderline: true,
                  style: { color: 'white' },
                }}
                sx={{
                  '.MuiInput-input': { padding: '12px 0' },
                  '& .MuiInput-input::placeholder': { color: '#d1d5db', opacity: 1 },
                }}
              />
            </div>
            <div className="hidden md:flex items-center gap-2 px-4">
              <Calendar className="text-gray-300" />
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
                  '& .MuiInput-input::placeholder': { color: '#d1d5db', opacity: 1 },
                }}
              />
            </div>
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: '9999px',
                padding: '12px 32px',
                fontSize: '1.125rem',
                color: 'white',
                background:
                  'linear-gradient(45deg, var(--gradient-primary-from), var(--gradient-primary-to))',
                boxShadow: '0 4px 15px 0 rgba(0, 191, 255, 0.4)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(0, 191, 255, 0.5)',
                  background:
                    'linear-gradient(45deg, var(--gradient-primary-from), var(--gradient-primary-to))',
                },
              }}
            >
              <Search className="mr-2" />
              Search
            </Button>
          </form>
        </motion.div>

        {/* Feature Icons */}
        <div className="flex items-center justify-center gap-8 md:gap-16">
          {[
            { IconComp: Star, text: 'Top Rated' },
            { IconComp: Shield, text: 'Verified' },
            { IconComp: Award, text: 'Best Value' },
          ].map((feature, i) => (
            <motion.div
              key={feature.text}
              custom={i} // 3. Correctly passing the custom prop for dynamic delays
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-2"
            >
              <feature.IconComp className="w-10 h-10 text-primary" />
              <span className="font-semibold text-gray-200">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default UltraLuxuryHeroSection;
