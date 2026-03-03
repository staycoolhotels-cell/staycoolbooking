'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { approveHost, rejectHost } from '@/lib/admin-actions';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface HostApprovalProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    created_at: string;
  };
  onAction: (userId: string) => void; // Removes the card immediately after action
}

const HostApprovalCard: React.FC<HostApprovalProps> = ({ user, onAction }) => {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    if (loading) return;
    setLoading('approve');
    const { success, error } = await approveHost(user.id);
    if (success) {
      toast.success(`${user.name || 'Host'} approved successfully!`);
      onAction(user.id);
    } else {
      toast.error(`Failed to approve: ${error}`);
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (loading) return;
    setLoading('reject');
    const { success, error } = await rejectHost(user.id);
    if (success) {
      toast.success(`${user.name || 'Host'} rejected.`);
      onAction(user.id);
    } else {
      toast.error(`Failed to reject: ${error}`);
      setLoading(null);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative bg-gradient-to-r from-brand-deep/20 via-[#0a0a0f]/80 to-[#0a0a0f]/80 backdrop-blur-xl border border-brand-default/30 rounded-xl p-4 flex items-center justify-between gap-4 shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.7)] hover:border-brand-default/50 transition-all duration-300 overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-deep shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>

      <div className="relative z-10 flex items-center gap-4 min-w-0 flex-1">
        <div className="bg-[#12121a] rounded-full p-3 shrink-0 border border-white/10 shadow-inner relative">
          <div className="absolute inset-0 bg-brand-deep/20 rounded-full blur-md"></div>
          <Icon name="UserIcon" className="text-zinc-200 relative z-10 drop-shadow-sm" size={24} />
        </div>
        <div className="min-w-0">
          <p className="font-heading font-bold text-zinc-100 truncate text-lg tracking-wide drop-shadow-sm">{user.name || 'N/A'}</p>
          <p className="text-sm text-zinc-400 truncate mb-1">{user.email || 'N/A'}</p>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Applied:</span>
            <span className="text-xs text-brand-default/90 font-medium">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 shrink-0">
        <button
          onClick={handleApprove}
          disabled={!!loading}
          className="relative px-4 py-2 bg-success/20 text-success border border-success/50 rounded-lg font-heading font-bold text-sm hover:bg-success hover:text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-300 overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          <span className="relative z-10 tracking-wider text-[11px] uppercase">
            {loading === 'approve' ? '...' : 'Approve'}
          </span>
        </button>
        <button
          onClick={handleReject}
          disabled={!!loading}
          className="relative px-4 py-2 bg-error/20 text-error border border-error/50 rounded-lg font-heading font-bold text-sm hover:bg-error hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300 overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          <span className="relative z-10 tracking-wider text-[11px] uppercase">
            {loading === 'reject' ? '...' : 'Reject'}
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default HostApprovalCard;
