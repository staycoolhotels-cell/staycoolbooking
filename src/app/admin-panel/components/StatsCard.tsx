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
      whileHover={{
        scale: 1.02,
        rotateX: 2,
        rotateY: -2,
        y: -5,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${bgColor} rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md transition-shadow duration-300 relative overflow-hidden`}
    >
      {/* Glossy overlay effect for 3D feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none opacity-50 rounded-xl" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-heading font-medium text-white/80 mb-2">{title}</p>
          <p className="text-3xl font-heading font-bold text-white mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{value}</p>
          {trend && (
            <div className="flex items-center space-x-1 drop-shadow-sm">
              <Icon
                name={trend.isPositive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'}
                size={16}
                className="text-white"
              />
              <span className={`text-sm font-heading font-medium text-white`}>{trend.value}</span>
              <span className="text-sm text-white/80">vs last month</span>
            </div>
          )}
        </div>
        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm border border-white/20 shadow-inner">
          <Icon name={icon} size={24} className="text-white drop-shadow-md" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
