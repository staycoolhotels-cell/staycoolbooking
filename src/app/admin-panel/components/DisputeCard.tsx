'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

// 1. Defined valid icon names based on your Icon component's expectations
type IconName =
  | 'ExclamationTriangleIcon'
  | 'ExclamationCircleIcon'
  | 'InformationCircleIcon'
  | 'CheckCircleIcon'
  | 'HomeIcon'
  | 'ChatBubbleLeftRightIcon';

import { Dispute } from '@/lib/types';

interface DisputeCardProps {
  dispute: Dispute;
  onViewDetails: (id: string) => void;
}

const DisputeCard = ({ dispute, onViewDetails }: DisputeCardProps) => {
  // 2. Added explicit type to config to prevent "string not assignable" errors
  const priorityConfig: Record<Dispute['priority'], { bg: string; text: string; icon: IconName; border: string }> =
  {
    critical: { bg: 'bg-error/10', text: 'text-error', icon: 'ExclamationTriangleIcon', border: 'border-error/20' },
    high: { bg: 'bg-warning/10', text: 'text-warning', icon: 'ExclamationCircleIcon', border: 'border-warning/20' },
    medium: { bg: 'bg-brand-default/10', text: 'text-brand-default', icon: 'InformationCircleIcon', border: 'border-brand-default/20' },
    low: { bg: 'bg-success/10', text: 'text-success', icon: 'CheckCircleIcon', border: 'border-success/20' },
  };

  const statusConfig = {
    open: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30' },
    in_progress: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
    resolved: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
    closed: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' }, // Added closed status style
  };

  const config = priorityConfig[dispute.priority || 'medium'];
  const statusStyle = statusConfig[dispute.status || 'open'];

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-l border-white/20 border-b border-r border-black/50 rounded-xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.8)] transition-all duration-300 overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between mb-5">
        <div className="flex items-center space-x-4">
          <div className={`${config.bg} p-3 rounded-xl border ${config.border} shadow-inner relative`}>
            <div className="absolute inset-0 bg-current opacity-20 blur-md rounded-xl"></div>
            <Icon name={config.icon} size={24} className={`${config.text} relative z-10 drop-shadow-md`} />
          </div>
          <div>
            <h4 className="font-heading font-bold text-zinc-100 text-lg tracking-wide drop-shadow-sm">{dispute.caseNumber}</h4>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{dispute.issueType}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} shadow-inner`}
        >
          {dispute.status.replace('_', ' ')}
        </span>
      </div>

      <div className="relative z-10 space-y-4 mb-5">
        <div className="bg-[#050505]/70 rounded-xl p-4 border border-white/5 shadow-inner">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Guest</span>
            <span className="font-heading font-semibold text-zinc-200 drop-shadow-sm">{dispute.guestName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Host</span>
            <span className="font-heading font-semibold text-brand-default drop-shadow-sm">{dispute.hostName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gradient-to-r from-brand-deep/20 to-transparent p-3 rounded-lg border-l-2 border-brand-deep">
          <Icon name="HomeIcon" size={16} className="text-brand-deep drop-shadow-sm" />
          <span className="text-sm font-medium text-zinc-200">{dispute.propertyName}</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Created</span>
            <span className="text-xs text-zinc-400 font-medium">{dispute.createdDate}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Updated</span>
            <span className="text-xs text-zinc-400 font-medium">{dispute.lastUpdate}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onViewDetails(dispute.id)}
        className="relative w-full px-4 py-3 bg-brand-deep text-brand-deep-foreground rounded-xl font-heading font-bold hover:bg-brand-default hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 flex items-center justify-center space-x-2 group/btn border border-brand-default/50"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl pointer-events-none"></div>
        <Icon name="ChatBubbleLeftRightIcon" size={20} className="relative z-10 group-hover/btn:scale-110 transition-transform drop-shadow-md" />
        <span className="relative z-10 tracking-wide text-sm">View Details</span>
      </button>
    </motion.div>
  );
};

export default DisputeCard;
