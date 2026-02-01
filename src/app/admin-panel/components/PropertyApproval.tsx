'use client';

import React from 'react';
import { Property } from '@/lib/types';
import PropertyApprovalCard from './PropertyApprovalCard';

interface PropertyApprovalProps {
  properties: Property[];
  onReview: (id: string, action: 'active' | 'rejected') => void;
}

const PropertyApproval = ({ properties, onReview }: PropertyApprovalProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-bold text-foreground">Property Approval Queue</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {properties.map((property) => (
          <PropertyApprovalCard key={property.id} property={property} onReview={onReview} />
        ))}
      </div>
    </div>
  );
};

export default PropertyApproval;
