'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  onClick?: () => void;
}

/**
 * Premium Glassmorphic Stats Card
 * Featuring internal glow effects and spring-based animations.
 */
const StatsCard = ({ title, value, icon, onClick }: StatsCardProps) => {
  const isLongValue = typeof value === 'string' && value.length > 7;

  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 10 },
      }}
      className={`relative overflow-hidden bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl group ${onClick ? 'cursor-pointer hover:border-primary/50' : ''}`}
      onClick={onClick}
    >
      {/* 1. INTERNAL GLOW ORB 
          This creates the "glowing from within" look that moves slightly on hover 
      */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 transition-colors duration-500" />

      {/* 2. CARD CONTENT */}
      <div className="flex flex-col-reverse lg:flex-row lg:justify-between items-start gap-4 lg:gap-2 relative z-10 w-full">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 leading-tight">{title}</p>
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${
              isLongValue
                ? 'text-base sm:text-lg lg:text-base xl:text-lg'
                : 'text-lg sm:text-xl lg:text-2xl'
            } font-heading font-bold text-white tracking-tight whitespace-nowrap`}
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </motion.h3>
        </div>

        {/* 3. ICON CONTAINER WITH NEON BORDER */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-primary/50 transition-colors">
            <Icon
              name={icon}
              size={18}
              className="text-primary sm:w-5 sm:h-5"
            />
          </div>
        </div>
      </div>

      {/* 4. SUBTLE DECORATIVE ELEMENTS */}
      <div className="mt-4 flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
        <div className="w-1 h-1 rounded-full bg-primary/40" />
      </div>

      {/* Glass Reflection Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
};

export default StatsCard;
