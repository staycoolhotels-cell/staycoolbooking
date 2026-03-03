'use client';

import React from 'react';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';

interface PropertyApprovalCardProps {
  property: Property;
  onReview: (id: string, action: 'active' | 'rejected') => void;
}

const PropertyApprovalCard = ({ property, onReview }: PropertyApprovalCardProps) => {
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  const handleReject = () => {
    // In a real app, you'd pass the reason up. For now, we just pass 'rejected' action
    // But since the new RPC supports reason, we should probably update the interface
    // For now, let's just trigger the callback
    onReview(property.id, 'rejected'); // TODO: Pass reason
    setShowRejectModal(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-all">
      <div className="relative h-48 w-full bg-zinc-800">
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Icon name="PhotoIcon" size={32} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${property.status === 'pending' ? 'bg-yellow-500/90 text-black' : 'bg-zinc-500/90 text-white'
            }`}>
            {property.status}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-bold text-lg text-white line-clamp-1">{property.title || property.name}</h3>
          <span className="text-zinc-400 text-xs font-mono">{property.tier}</span>
        </div>

        <div className="space-y-2 mb-6 flex-1">
          <div className="flex items-center text-zinc-400 text-sm">
            <Icon name="MapPinIcon" size={14} className="mr-2 text-zinc-500" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          <div className="flex items-center text-zinc-400 text-sm">
            <Icon name="CurrencyRupeeIcon" size={14} className="mr-2 text-zinc-500" />
            <span>₹{property.price_per_night} / night</span>
          </div>
          {/* Links to docs could go here */}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => onReview(property.id, 'rejected')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <Icon name="XMarkIcon" size={16} />
            Reject
          </button>
          <button
            onClick={() => onReview(property.id, 'active')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-bold hover:bg-green-500/20 transition-colors border border-green-500/20"
          >
            <Icon name="CheckIcon" size={16} />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyApprovalCard;
