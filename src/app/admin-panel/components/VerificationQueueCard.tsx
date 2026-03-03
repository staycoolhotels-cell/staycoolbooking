import React from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { motion } from 'framer-motion';

import { VerificationItem } from '@/lib/types';

interface VerificationQueueCardProps {
  item: VerificationItem;
  onReview: (id: string, action: 'approved' | 'rejected') => void;
  onViewDetails?: () => void;
}

const VerificationQueueCard = ({ item, onReview, onViewDetails }: VerificationQueueCardProps) => {
  const priorityColors = {
    high: 'bg-error/10 text-error border-error/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    low: 'bg-success/10 text-success border-success/20',
  };

  const typeIcons = {
    host: 'HomeIcon',
    guest: 'UserIcon',
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative bg-[#0a0a0f]/80 backdrop-blur-xl border-t border-l border-white/20 border-b border-r border-black/50 rounded-xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.8)] hover:border-white/30 transition-shadow duration-300 cursor-pointer overflow-hidden group"
      onClick={onViewDetails}
    >
      {/* Inner highlight for glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative mt-1">
            <div className="absolute inset-0 bg-brand-deep rounded-full blur-sm opacity-50"></div>
            <AppImage
              src={item.profileImage}
              alt={item.profileImageAlt}
              className="relative w-12 h-12 rounded-full object-cover border-2 border-[#12121a] shadow-inner"
            />
            <div className="absolute -bottom-1 -right-1 bg-brand-deep rounded-full p-1 shadow-md border border-white/10">
              <Icon name={typeIcons[item.type]} size={12} className="text-brand-deep-foreground drop-shadow-sm" />
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-zinc-100 drop-shadow-sm text-lg tracking-wide">{item.name}</h4>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{item.type} Verification</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[10px] uppercase font-heading font-bold border ${priorityColors[item.priority || 'low']} shadow-inner`}
        >
          {(item.priority || 'low')}
        </span>
      </div>

      <div className="relative z-10 space-y-2.5 mb-5 bg-[#050505]/50 p-3 rounded-lg border border-white/5 shadow-inner">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Document Type</span>
          <span className="font-heading font-semibold text-zinc-300 drop-shadow-sm">{item.documentType}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Submitted</span>
          <span className="font-heading font-medium text-zinc-400">{item.submittedDate}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</span>
          <span className="px-2.5 py-1 bg-warning/10 text-warning border border-warning/20 rounded shadow-inner text-[10px] font-heading font-bold uppercase tracking-widest">
            {item.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex space-x-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReview(item.id, 'approved');
          }}
          className="relative flex-1 px-4 py-2.5 bg-success/10 text-success border border-success/30 rounded-lg font-heading font-semibold hover:bg-success hover:text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300 flex items-center justify-center space-x-2 group/btn"
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          <Icon name="CheckCircleIcon" size={18} className="group-hover/btn:scale-110 transition-transform" />
          <span className="relative z-10 text-sm tracking-wide">Approve</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReview(item.id, 'rejected');
          }}
          className="relative flex-1 px-4 py-2.5 bg-error/10 text-error border border-error/30 rounded-lg font-heading font-semibold hover:bg-error hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 flex items-center justify-center space-x-2 group/btn"
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          <Icon name="XCircleIcon" size={18} className="group-hover/btn:scale-110 transition-transform" />
          <span className="relative z-10 text-sm tracking-wide">Reject</span>
        </button>
      </div>
    </motion.div>
  );
};

export default VerificationQueueCard;
