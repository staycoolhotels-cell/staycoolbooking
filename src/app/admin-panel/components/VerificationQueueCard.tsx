import React from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

import { VerificationItem } from '@/lib/types';

interface VerificationQueueCardProps {
  item: VerificationItem;
  onReview: (id: string, action: 'approved' | 'rejected') => void;
}

const VerificationQueueCard = ({ item, onReview }: VerificationQueueCardProps) => {
  const priorityColors = {
    high: 'bg-error/10 text-error',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-success/10 text-success',
  };

  const typeIcons = {
    host: 'HomeIcon',
    guest: 'UserIcon',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-brand-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <AppImage
              src={item.profileImage}
              alt={item.profileImageAlt}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
              <Icon name={typeIcons[item.type]} size={12} className="text-primary-foreground" />
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground">{item.name}</h4>
            <p className="text-sm text-text-secondary capitalize">{item.type} Verification</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-heading font-medium ${priorityColors[item.priority]}`}
        >
          {item.priority.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Document Type:</span>
          <span className="font-heading font-medium text-foreground">{item.documentType}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Submitted:</span>
          <span className="font-heading font-medium text-foreground">{item.submittedDate}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Status:</span>
          <span className="px-2 py-1 bg-warning/10 text-warning rounded text-xs font-heading font-medium">
            {item.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onReview(item.id, 'approved')}
          className="w-full px-4 py-2 bg-success/10 text-success rounded-lg font-heading font-semibold hover:bg-success/20 transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <Icon name="CheckCircleIcon" size={20} />
          <span>Approve</span>
        </button>
        <button
          onClick={() => onReview(item.id, 'rejected')}
          className="w-full px-4 py-2 bg-error/10 text-error rounded-lg font-heading font-semibold hover:bg-error/20 transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <Icon name="XCircleIcon" size={20} />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
};

export default VerificationQueueCard;
