'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  bgColor: string;
  accentColor?: string;
  onClick?: () => void;
}

const colorMap: Record<string, { glow: string; border: string; icon: string; badge: string }> = {
  'bg-blue-500': {
    glow: 'rgba(59,130,246,0.35)',
    border: 'rgba(59,130,246,0.25)',
    icon: 'text-blue-400',
    badge: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-300',
  },
  'bg-indigo-500': {
    glow: 'rgba(99,102,241,0.35)',
    border: 'rgba(99,102,241,0.25)',
    icon: 'text-indigo-400',
    badge: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-300',
  },
  'bg-green-500': {
    glow: 'rgba(34,197,94,0.35)',
    border: 'rgba(34,197,94,0.25)',
    icon: 'text-emerald-400',
    badge: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
  },
  'bg-emerald-500': {
    glow: 'rgba(16,185,129,0.35)',
    border: 'rgba(16,185,129,0.25)',
    icon: 'text-emerald-400',
    badge: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
  },
  'bg-purple-500': {
    glow: 'rgba(168,85,247,0.35)',
    border: 'rgba(168,85,247,0.25)',
    icon: 'text-purple-400',
    badge: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300',
  },
  'bg-teal-500': {
    glow: 'rgba(20,184,166,0.35)',
    border: 'rgba(20,184,166,0.25)',
    icon: 'text-teal-400',
    badge: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-300',
  },
  'bg-yellow-500': {
    glow: 'rgba(234,179,8,0.35)',
    border: 'rgba(234,179,8,0.25)',
    icon: 'text-amber-400',
    badge: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300',
  },
  'bg-red-500': {
    glow: 'rgba(239,68,68,0.35)',
    border: 'rgba(239,68,68,0.25)',
    icon: 'text-rose-400',
    badge: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-300',
  },
};

const StatsCard = ({ title, value, icon, subtitle, trend, bgColor, onClick }: StatsCardProps) => {
  const colors = colorMap[bgColor] || colorMap['bg-indigo-500'];

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{ borderColor: colors.border }}
      className="relative group overflow-hidden rounded-xl md:rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border p-4 md:p-6 transition-all duration-500 hover:shadow-2xl cursor-pointer"
    >
      {/* Ambient Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl md:rounded-2xl"
        style={{ boxShadow: `inset 0 0 40px ${colors.glow}` }}
      />

      {/* Top-right Corner Gradient Blob */}
      <div
        className="absolute -right-6 -top-6 w-24 h-24 md:w-28 md:h-28 rounded-full blur-2xl opacity-25 group-hover:opacity-50 transition-opacity duration-500"
        style={{ backgroundColor: colors.glow }}
      />

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${colors.glow}, transparent)` }}
      />

      <div className="relative z-10 flex flex-col h-full gap-3 md:gap-4">
        {/* Icon + Trend Row */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 min-w-0">
          <div
            className="p-2 md:p-2.5 rounded-lg md:rounded-xl border backdrop-blur-sm transition-all duration-300 group-hover:scale-105 shrink-0"
            style={{ borderColor: colors.border, backgroundColor: `rgba(255,255,255,0.04)` }}
          >
            <div className="md:hidden">
              <Icon name={icon} size={16} className={`${colors.icon} transition-colors`} />
            </div>
            <div className="hidden md:block">
              <Icon name={icon} size={20} className={`${colors.icon} transition-colors`} />
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 md:px-2.5 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-bold uppercase tracking-wider bg-gradient-to-br border shrink-0 max-w-full ${trend.isPositive ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300' : 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-300'}`}>
              <Icon name={trend.isPositive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} size={10} className="shrink-0" />
              <span className="truncate">{trend.value}</span>
            </div>
          )}
        </div>

        {/* Value + Label */}
        <div>
          <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1 md:mb-1.5">{title}</p>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight leading-none">
            {value}
          </h3>
          {subtitle ? (
            <p className="text-[9px] md:text-[10px] text-zinc-400 mt-1 md:mt-1.5 font-medium">{subtitle}</p>
          ) : trend ? (
            <p className="text-[8px] md:text-[10px] text-zinc-600 mt-1 md:mt-2 font-medium">compared to last month</p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
