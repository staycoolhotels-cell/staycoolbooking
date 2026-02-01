'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Property } from '@/lib/types';
import SearchFilters from './SearchFilters';
import PropertyCard from './PropertyCard';

interface Step1Props {
  properties: Property[];
  loading: boolean;
  bookingCart: Property[];
  toggleCartItem: (property: Property) => void;
  onNext: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

const Step1_PropertySelection = ({
  properties,
  loading,
  bookingCart,
  toggleCartItem,
  onNext,
  filters,
  setFilters,
}: Step1Props) => {
  return (
    <div>
      <SearchFilters filters={filters} setFilters={setFilters} />
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Icon name="ArrowPathIcon" size={40} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onToggle={() => toggleCartItem(p)}
                isSelected={!!bookingCart.find((item) => item.id === p.id)}
              />
            ))}
          </div>
        )}
      </div>
      {bookingCart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8">
          <div>
            <p className="text-sm font-bold">{bookingCart.length} Properties Selected</p>
          </div>
          <button
            onClick={onNext}
            className="bg-white text-primary px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Proceed to Book
          </button>
        </div>
      )}
    </div>
  );
};

export default Step1_PropertySelection;
