import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

interface Activity {
  id: string;
  type: 'verification' | 'booking' | 'dispute' | 'payout' | 'user_action';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivityItemProps {
  activity: Activity;
}

const RecentActivityItem = ({ activity }: RecentActivityItemProps) => {
  const typeConfig: Record<Activity['type'], { icon: any, bg: string, text: string, border: string }> = {
    verification: { icon: 'DocumentCheckIcon', bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
    booking: { icon: 'CalendarIcon', bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
    dispute: { icon: 'ExclamationTriangleIcon', bg: 'bg-error/20', text: 'text-error', border: 'border-error/30' },
    payout: { icon: 'BanknotesIcon', bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30' },
    user_action: { icon: 'UserIcon', bg: 'bg-brand-deep/20', text: 'text-brand-deep', border: 'border-brand-deep/30' },
  };

  const config = typeConfig[activity.type] || { icon: 'InformationCircleIcon', bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/30' };

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative flex items-start space-x-3 p-3.5 bg-[#12121a]/80 backdrop-blur-md rounded-xl hover:bg-[#1a1a24] transition-colors duration-300 border border-white/5 hover:border-white/10 shadow-sm hover:shadow-[0_5px_15px_rgba(0,0,0,0.5)] group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      <div className={`relative z-10 ${config.bg} p-2.5 rounded-lg flex-shrink-0 border ${config.border} shadow-inner`}>
        <div className={`absolute inset-0 ${config.bg} blur-md opacity-50`}></div>
        <Icon name={config.icon} size={20} className={`${config.text} relative z-10 drop-shadow-sm`} />
      </div>
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1">
          <h5 className="font-heading font-semibold text-zinc-200 tracking-wide drop-shadow-sm truncate pr-2">{activity.title}</h5>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap pt-1">{activity.timestamp}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-snug line-clamp-2">{activity.description}</p>
      </div>
    </motion.div>
  );
};

export default RecentActivityItem;
