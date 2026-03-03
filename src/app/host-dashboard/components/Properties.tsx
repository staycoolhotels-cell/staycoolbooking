'use client';

import React, { useState } from 'react';
import PropertyCard from './PropertyCard';
import { Property } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PropertiesProps {
  properties: Property[];
  onAddProperty: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'pending' | 'rejected' | 'offline') => void;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RoomManager from './RoomManager';

const Properties = ({
  properties,
  onAddProperty,
  onEdit,
  onDelete,
  onToggleStatus,
}: PropertiesProps) => {
  const [managingRoomsProperty, setManagingRoomsProperty] = useState<Property | null>(null);

  const pendingProperties = properties.filter((p) => p.status === 'pending');
  const activeProperties = properties.filter((p) => p.status === 'active');
  const rejectedProperties = properties.filter((p) => p.status === 'rejected');
  const offlineProperties = properties.filter((p) => p.status === 'offline');

  const renderPropertyGrid = (props: Property[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {props.length > 0 ? (
        props.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onManageRooms={setManagingRoomsProperty}
          />
        ))
      ) : (
        <p className="col-span-full text-center text-zinc-500 py-8">
          No properties found in this category.
        </p>
      )}
    </div>
  );

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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-zinc-900/50 p-1 border border-zinc-800 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">All Properties ({properties.length})</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500">Active ({activeProperties.length})</TabsTrigger>
          <TabsTrigger value="offline" className="data-[state=active]:bg-zinc-500/10 data-[state=active]:text-zinc-400">Offline ({offlineProperties.length})</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-500">Pending ({pendingProperties.length})</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500">Rejected ({rejectedProperties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderPropertyGrid(properties)}
        </TabsContent>
        <TabsContent value="active">
          {renderPropertyGrid(activeProperties)}
        </TabsContent>
        <TabsContent value="offline">
          {renderPropertyGrid(offlineProperties)}
        </TabsContent>
        <TabsContent value="pending">
          {renderPropertyGrid(pendingProperties)}
        </TabsContent>
        <TabsContent value="rejected">
          {renderPropertyGrid(rejectedProperties)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!managingRoomsProperty} onOpenChange={(open) => !open && setManagingRoomsProperty(null)}>
        <DialogContent className="sm:max-w-xl bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Manage Rooms - {managingRoomsProperty?.title || managingRoomsProperty?.name}</DialogTitle>
          </DialogHeader>
          {managingRoomsProperty && (
            <RoomManager
              property={managingRoomsProperty}
              onUpdate={() => {
                // Refresh property list if needed, or just rooms
                // For now RoomManager handles its own room list fetch
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Properties;