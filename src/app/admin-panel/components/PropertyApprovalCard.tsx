'use client';

import React from 'react';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';

interface PropertyApprovalCardProps {
  property: Property;
  onReview: (id: string, action: 'active' | 'rejected') => void;
}

const PropertyApprovalCard = ({ property, onReview }: PropertyApprovalCardProps) => {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-foreground">{property.name}</h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              property.status === 'pending'
                ? 'bg-yellow-500/10 text-yellow-500'
                : 'bg-gray-500/10 text-gray-500'
            }`}
          >
            {property.status}
          </span>
        </div>
        <p className="text-sm text-text-secondary mb-1">{property.location}</p>
        <p className="text-sm text-text-secondary">{property.tier}</p>
      </div>
      <div className="flex items-center justify-end space-x-2 mt-4">
        <button
          onClick={() => onReview(property.id, 'rejected')}
          className="px-3 py-1 bg-red-500/10 text-red-500 rounded-md text-sm font-semibold hover:bg-red-500/20 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => onReview(property.id, 'active')}
          className="px-3 py-1 bg-green-500/10 text-green-500 rounded-md text-sm font-semibold hover:bg-green-500/20 transition-colors"
        >
          Approve
        </button>
      </div>
    </div>
  );
};

export default PropertyApprovalCard;
