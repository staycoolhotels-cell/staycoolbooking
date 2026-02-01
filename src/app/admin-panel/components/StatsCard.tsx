import React from 'react';
import Icon from '@/components/ui/AppIcon';

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
    <div
      className={`${bgColor} rounded-xl p-6 shadow-brand-sm hover:shadow-brand-md transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-heading font-medium text-white/80 mb-2">{title}</p>
          <p className="text-3xl font-heading font-bold text-white mb-3">{value}</p>
          {trend && (
            <div className="flex items-center space-x-1">
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
        <div className="bg-white/30 p-3 rounded-lg">
          <Icon name={icon} size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
