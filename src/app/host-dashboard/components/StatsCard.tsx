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
  return (
    <motion.div
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 10 },
      }}
      className={`relative overflow-hidden bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl group ${onClick ? 'cursor-pointer hover:border-primary/50' : ''}`}
      onClick={onClick}
    >
      {/* 1. INTERNAL GLOW ORB 
          This creates the "glowing from within" look that moves slightly on hover 
      */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 transition-colors duration-500" />

      {/* 2. CARD CONTENT */}
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{title}</p>
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-heading font-bold text-white tracking-tight"
          >
            {value}
          </motion.h3>
        </div>

        {/* 3. ICON CONTAINER WITH NEON BORDER */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative p-3.5 bg-white/5 rounded-2xl border border-white/10 group-hover:border-primary/50 transition-colors">
            <Icon
              name={icon}
              size={24}
              className="text-primary drop-shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]"
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
