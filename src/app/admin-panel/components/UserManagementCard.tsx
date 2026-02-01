import React from 'react';
import Icon from '@/components/ui/AppIcon';

import { User } from '@/lib/types';

interface UserManagementCardProps {
  user: User;
  onManage: (id: string) => void;
}

const UserManagementCard = ({ user, onManage }: UserManagementCardProps) => {
  const statusConfig = {
    active: { bg: 'bg-success/10', text: 'text-success' },
    rejected: { bg: 'bg-error/10', text: 'text-error' },
    pending: { bg: 'bg-warning/10', text: 'text-warning' },
    default: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  };

  const statusStyle =
    statusConfig[user.status as keyof typeof statusConfig] || statusConfig.default;

  const roleColors: { [key: string]: string } = {
    host: 'bg-brand-deep/10 text-brand-deep',
    guest: 'bg-primary/10 text-primary',
    admin: 'bg-error/10 text-error',
  };

  const roleStyle = roleColors[user.role] || 'bg-gray-500/10 text-gray-500';

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-brand-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Icon name="UserIcon" size={28} className="text-foreground" />
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground">{user.name || 'N/A'}</h4>
            <p className="text-sm text-text-secondary">{user.email || 'N/A'}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-heading font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center justify-center`}
        >
          {user.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Role</p>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-heading font-medium ${roleStyle}`}
          >
            {user.role?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Joined</p>
          <p className="font-heading font-semibold text-foreground">{new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <button
        onClick={() => onManage(user.id)}
        className="w-full px-4 py-2 bg-brand-deep text-brand-deep-foreground rounded-lg font-heading font-semibold hover:bg-brand-deep/90 transition-all duration-300 flex items-center justify-center space-x-2"
      >
        <Icon name="Cog6ToothIcon" size={20} />
        <span>Manage User</span>
      </button>
    </div>
  );
};

export default UserManagementCard;
