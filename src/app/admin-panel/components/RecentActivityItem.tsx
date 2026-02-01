import React from 'react';
import Icon from '@/components/ui/AppIcon';

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
  const typeConfig = {
    verification: { icon: 'DocumentCheckIcon', bg: 'bg-primary/10', text: 'text-primary' },
    booking: { icon: 'CalendarIcon', bg: 'bg-success/10', text: 'text-success' },
    dispute: { icon: 'ExclamationTriangleIcon', bg: 'bg-error/10', text: 'text-error' },
    payout: { icon: 'BanknotesIcon', bg: 'bg-warning/10', text: 'text-warning' },
    user_action: { icon: 'UserIcon', bg: 'bg-brand-deep/10', text: 'text-brand-deep' },
  };

  const config = typeConfig[activity.type];

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors duration-200">
      <div className={`${config.bg} p-2 rounded-lg flex-shrink-0`}>
        <Icon name={config.icon} size={20} className={config.text} />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-heading font-medium text-foreground mb-1">{activity.title}</h5>
        <p className="text-sm text-text-secondary mb-2">{activity.description}</p>
        <span className="text-xs text-text-secondary">{activity.timestamp}</span>
      </div>
    </div>
  );
};

export default RecentActivityItem;
