'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface StayType {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface StayTypeFilterProps {
  stayTypes: StayType[];
  selectedType: string;
  onTypeSelect: (typeId: string) => void;
}

const StayTypeFilter = ({ stayTypes, selectedType, onTypeSelect }: StayTypeFilterProps) => {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8 px-4">
        <h2 className="font-heading text-3xl font-bold text-text-primary">Explore by Stay Type</h2>
        <button
          onClick={() => onTypeSelect('all')}
          className="font-sans font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
        >
          Show All
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4">
        {stayTypes
          .filter((type) => type.id !== 'all')
          .map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 shadow-sm
              ${
                selectedType === type.id
                  ? 'bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground border-primary shadow-lg'
                  : 'bg-gradient-to-br from-gradient-card-from to-gradient-card-to text-text-primary border-border hover:border-primary/50'
              }`}
            >
              <div
                className={`p-2 rounded-full mb-3 transition-colors duration-300 ${selectedType === type.id ? 'bg-primary/20 text-primary-foreground' : 'bg-primary/10 text-primary'}`}
              >
                <Icon
                  name={type.icon}
                  size={20}
                  className={selectedType === type.id ? 'text-primary-foreground' : 'text-primary'}
                />
              </div>
              <p className="font-heading text-md font-bold text-center">{type.name}</p>
              <p
                className={`font-sans text-sm text-center mt-1 transition-colors duration-300 ${selectedType === type.id ? 'text-primary-foreground/80' : 'text-text-secondary'}`}
              >
                {type.count.toLocaleString()} stays
              </p>
            </button>
          ))}
      </div>
    </div>
  );
};

export default StayTypeFilter;
