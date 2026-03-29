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
      <div className="flex items-baseline justify-between mb-8 px-4">
        <h2 className="font-heading text-3xl font-bold text-zinc-100">Explore by Stay Type</h2>
        <button
          onClick={() => onTypeSelect('all')}
          className="font-sans font-semibold text-sky-400 hover:text-sky-300 transition-colors duration-200"
        >
          Show All
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 px-4 md:grid-cols-4 lg:grid-cols-8 scrollbar-hide">
        {stayTypes
          .filter((type) => type.id !== 'all')
          .map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 transform md:hover:scale-105 active:scale-95 shadow-sm
              ${selectedType === type.id
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/50 shadow-lg shadow-sky-500/10'
                  : 'bg-zinc-900/40 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                }`}
            >
              <div
                className={`p-1.5 rounded-full mb-1.5 transition-colors duration-300 ${selectedType === type.id ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-400'}`}
              >
                <Icon
                  name={type.icon}
                  size={18}
                  className={selectedType === type.id ? 'text-sky-400' : 'text-zinc-400'}
                />
              </div>
              <p className="font-heading text-[10px] sm:text-xs font-bold text-center leading-tight h-8 flex items-center justify-center">{type.name}</p>
              <p
                className={`hidden sm:block font-sans text-[8px] text-center mt-0.5 transition-colors duration-300 ${selectedType === type.id ? 'text-sky-400/80' : 'text-zinc-500'}`}
              >
                {type.count} stays
              </p>
            </button>
          ))}
      </div>
    </div>
  );
};

export default StayTypeFilter;
