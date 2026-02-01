'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
  onToggle: () => void;
  isSelected: boolean;
}

const PropertyCard = ({ property, onToggle, isSelected }: PropertyCardProps) => {
  return (
    <div
      className={`rounded-xl shadow-brand-md overflow-hidden transition-all duration-300 bg-card/50 backdrop-blur-md border border-brand-energetic/20 ${
        isSelected ? 'ring-4 ring-primary' : ''
      }`}
    >
      <div className="relative">
        <img
          src={
            property.images && property.images.length > 0
              ? property.images[0].url
              : 'https://placehold.co/600x400'
          }
          alt={
            property.images && property.images.length > 0
              ? property.images[0].alt
              : 'Placeholder image'
          }
          className="w-full h-56 object-cover"
        />
        <button
          onClick={onToggle}
          className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all ${
            isSelected
              ? 'bg-primary text-white scale-110'
              : 'bg-white/90 backdrop-blur-md text-gray-600 hover:text-primary'
          }`}
        >
          <Icon name={isSelected ? 'CheckIcon' : 'PlusIcon'} size={24} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{property.name}</h3>
            <p className="text-sm text-text-secondary">{property.location}</p>
          </div>
          <div className="flex items-center space-x-1 text-yellow-500">
            <Icon name="StarIcon" size={16} />
            <span className="font-bold">{property.rating}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-lg font-bold text-primary">
            ₹{property.price?.toLocaleString('en-IN')} / night
          </p>
          <span className="text-sm text-text-secondary">{property.reviews_count} reviews</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
