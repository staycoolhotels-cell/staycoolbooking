import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  bgColor: string;
}

const StatsCard = ({ title, value, icon, trend, bgColor }: StatsCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group overflow-hidden rounded-[2rem] bg-[#0a0a0f] border border-white/10 p-5 md:p-6 transition-all duration-500 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40 ${bgColor}`} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
            <Icon name={icon} size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <Icon name={trend.isPositive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} size={12} />
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight">
            {value}
          </h3>
          {trend && (
            <p className="text-[10px] text-zinc-600 mt-2 font-medium">vs last month</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
