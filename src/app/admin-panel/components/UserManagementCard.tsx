import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

import { User } from '@/lib/types';

interface UserManagementCardProps {
  user: User;
  onManage: (id: string) => void;
}

const UserManagementCard = ({ user, onManage }: UserManagementCardProps) => {
  const statusConfig = {
    active: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
    rejected: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30' },
    pending: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
    default: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  };

  const statusStyle =
    statusConfig[user.status as keyof typeof statusConfig] || statusConfig.default;

  const roleColors: { [key: string]: { bg: string, text: string, border: string } } = {
    host: { bg: 'bg-brand-deep/20', text: 'text-brand-deep', border: 'border-brand-deep/50' },
    guest: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/50' },
    admin: { bg: 'bg-error/20', text: 'text-error', border: 'border-error/50' },
  };

  const roleStyle = roleColors[user.role] || { bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/30' };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative bg-[#0a0a0f]/80 backdrop-blur-xl border-t border-l border-white/20 border-b border-r border-black/50 rounded-xl p-4 sm:p-5 shadow-[0_15px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.8)] hover:border-white/30 transition-all duration-300 w-full min-w-0 group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-brand-deep/30 rounded-full blur-md" />
            <div className="relative w-12 h-12 rounded-full bg-[#12121a] border-2 border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <Icon name="UserIcon" size={24} className="text-zinc-200 drop-shadow-md z-10" />
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-bold text-zinc-100 text-base tracking-wide drop-shadow-sm truncate">{user.name || 'N/A'}</h4>
            <p className="text-xs text-zinc-400 font-medium tracking-wide truncate">{user.email || 'N/A'}</p>
          </div>
        </div>
        <span
          className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} shadow-inner flex items-center justify-center whitespace-nowrap`}
        >
          {user.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 mb-5">
        <div className="bg-[#050505]/60 rounded-xl p-3 border border-white/5 shadow-inner">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Role</p>
          <span
            className={`inline-block px-3 py-1 rounded-md text-[10px] font-heading font-bold uppercase tracking-widest border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
          >
            {user.role?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        <div className="bg-[#050505]/60 rounded-xl p-3 border border-white/5 shadow-inner flex flex-col justify-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Joined</p>
          <p className="font-heading font-semibold text-zinc-200 drop-shadow-sm">{new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <button
        onClick={() => onManage(user.id)}
        className="relative w-full px-4 py-3 bg-brand-deep text-brand-deep-foreground rounded-xl font-heading font-bold hover:bg-brand-default hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 flex items-center justify-center space-x-2 group/btn border border-brand-default/50"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl pointer-events-none"></div>
        <Icon name="Cog6ToothIcon" size={20} className="relative z-10 group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-transform duration-500 drop-shadow-md" />
        <span className="relative z-10 tracking-wide text-sm">Manage User</span>
      </button>
    </motion.div>
  );
};

export default UserManagementCard;
