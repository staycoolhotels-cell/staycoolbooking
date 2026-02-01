'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { approveHost, rejectHost } from '@/lib/admin-actions';

// It's better to define a specific type for the user/profile data passed to this component
interface HostApprovalProps {
  user: {
    id: string;
    // The following fields need to be fetched and passed to this component
    name?: string; 
    email?: string;
    created_at: string;
  };
  onAction: () => void; // Callback to refresh the list after an action
}

const HostApprovalCard: React.FC<HostApprovalProps> = ({ user, onAction }) => {
  const handleApprove = async () => {
    const { success, error } = await approveHost(user.id);
    if (success) {
      alert('Host approved successfully!');
      onAction();
    } else {
      alert(`Error approving host: ${error}`);
    }
  };

  const handleReject = async () => {
    const { success, error } = await rejectHost(user.id);
    if (success) {
      alert('Host rejected successfully!');
      onAction();
    } else {
      alert(`Error rejecting host: ${error}`);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-muted rounded-full p-3">
          <Icon name="UserIcon" className="text-foreground" size={24} />
        </div>
        <div>
          <p className="font-bold text-foreground">{user.name || 'N/A'}</p>
          <p className="text-sm text-text-secondary">{user.email || 'N/A'}</p>
          <p className="text-xs text-text-secondary/70">
            Applied on: {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          className="px-4 py-2 bg-success text-success-foreground rounded-lg font-semibold hover:bg-success/90 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          className="px-4 py-2 bg-error text-error-foreground rounded-lg font-semibold hover:bg-error/90 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default HostApprovalCard;
