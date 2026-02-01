'use client';

import React, { useState } from 'react';
import PropertyCard from './PropertyCard';
import { Property } from '@/lib/types';

interface PropertiesProps {
  properties: Property[];
  onAddProperty: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'pending' | 'rejected') => void;
}

const Properties = ({
  properties,
  onAddProperty,
  onEdit,
  onDelete,
  onToggleStatus,
}: PropertiesProps) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'rejected'>(
    'all'
  );

  const filteredProperties = properties.filter((property) => {
    if (filterStatus === 'all') {
      return true;
    }
    return property.status === filterStatus;
  });

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-text-primary">Your Properties</h2>
        <button
          onClick={onAddProperty}
          className="px-4 py-2 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-lg font-semibold"
        >
          Add Property
        </button>
      </div>

      <div className="flex space-x-2 mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              setFilterStatus(option.value as 'all' | 'active' | 'pending' | 'rejected')
            }
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={(id, newStatus) => onToggleStatus(id, newStatus)}
            />
          ))
        ) : (
          <p className="col-span-full text-center text-zinc-500">
            No properties found with status: {filterStatus === 'all' ? 'All' : filterStatus}.
          </p>
        )}
      </div>
    </div>
  );
};

export default Properties;