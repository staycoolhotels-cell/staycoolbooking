'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

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
  onResolve: (id: string) => void;
}

const DisputeCard = ({ dispute, onResolve }: DisputeCardProps) => {
  // 2. Added explicit type to config to prevent "string not assignable" errors
  const priorityConfig: Record<Dispute['priority'], { bg: string; text: string; icon: IconName }> =
    {
      critical: { bg: 'bg-error/10', text: 'text-error', icon: 'ExclamationTriangleIcon' },
      high: { bg: 'bg-warning/10', text: 'text-warning', icon: 'ExclamationCircleIcon' },
      medium: { bg: 'bg-primary/10', text: 'text-primary', icon: 'InformationCircleIcon' },
      low: { bg: 'bg-success/10', text: 'text-success', icon: 'CheckCircleIcon' },
    };

  const statusConfig = {
    open: { bg: 'bg-error/10', text: 'text-error' },
    in_progress: { bg: 'bg-warning/10', text: 'text-warning' },
    resolved: { bg: 'bg-success/10', text: 'text-success' },
    closed: { bg: 'bg-text-secondary/10', text: 'text-text-secondary' }, // Added closed status style
  };

  const config = priorityConfig[dispute.priority];
  const statusStyle = statusConfig[dispute.status];

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-brand-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`${config.bg} p-2 rounded-lg`}>
            <Icon name={config.icon} size={20} className={config.text} />
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground">{dispute.caseNumber}</h4>
            <p className="text-sm text-text-secondary">{dispute.issueType}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-heading font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          {dispute.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Guest:</span>
            <span className="font-heading font-medium text-foreground">{dispute.guestName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Host:</span>
            <span className="font-heading font-medium text-foreground">{dispute.hostName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Icon name="HomeIcon" size={16} className="text-text-secondary" />
          <span className="text-sm text-foreground">{dispute.propertyName}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Created: {dispute.createdDate}</span>
          <span>Updated: {dispute.lastUpdate}</span>
        </div>
      </div>

      <button
        onClick={() => onResolve(dispute.id)}
        className="w-full px-4 py-2 bg-brand-deep text-brand-deep-foreground rounded-lg font-heading font-semibold hover:bg-brand-deep/90 transition-all duration-300 flex items-center justify-center space-x-2"
      >
        <Icon name="ChatBubbleLeftRightIcon" size={20} />
        <span>Manage Dispute</span>
      </button>
    </div>
  );
};

export default DisputeCard;
