'use client';

import React, { useState } from 'react';
import PropertyCard from './PropertyCard';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RoomManager from './RoomManager';

interface PropertiesProps {
  properties: Property[];
  bookings: any[];
  onAddProperty: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'pending' | 'rejected' | 'offline') => void;
}

const Properties = ({
  properties,
  bookings = [],
  onAddProperty,
  onEdit,
  onDelete,
  onToggleStatus,
}: PropertiesProps) => {
  const [managingRoomsProperty, setManagingRoomsProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'offline' | 'pending' | 'rejected'>('all');

  const pendingProperties = properties.filter((p) => p.status === 'pending');
  const activeProperties = properties.filter((p) => p.status === 'active');
  const rejectedProperties = properties.filter((p) => p.status === 'rejected');
  const offlineProperties = properties.filter((p) => p.status === 'offline');

  const getFilteredProperties = () => {
    switch (activeTab) {
      case 'active': return activeProperties;
      case 'offline': return offlineProperties;
      case 'pending': return pendingProperties;
      case 'rejected': return rejectedProperties;
      default: return properties;
    }
  };

  const renderPropertyGrid = (props: Property[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
      {props.length > 0 ? (
        props.map((property, index) => (
          <div
            key={property.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PropertyCard
              property={property}
              bookings={bookings.filter((b) => b.property_id === property.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onManageRooms={setManagingRoomsProperty}
            />
          </div>
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-white/10 rounded-[2rem] text-center backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Icon name="BuildingOffice2Icon" size={32} className="text-zinc-600" />
          </div>
          <p className="text-lg font-bold text-white mb-1">No Assets Found</p>
          <p className="text-sm text-zinc-500">There are no properties matching this specific criterion.</p>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'all', label: 'Portfolio Matrix', count: properties.length, icon: 'Square3Stack3DIcon', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { id: 'active', label: 'Live Assets', count: activeProperties.length, icon: 'GlobeAltIcon', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { id: 'offline', label: 'Maintenance Mode', count: offlineProperties.length, icon: 'MoonIcon', color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
    { id: 'pending', label: 'Pending Review', count: pendingProperties.length, icon: 'ClockIcon', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { id: 'rejected', label: 'Compliance Issues', count: rejectedProperties.length, icon: 'ExclamationTriangleIcon', color: 'text-red-400', bg: 'bg-red-500/20' },
  ] as const;

  return (
    <div className="w-full space-y-3 md:space-y-8 relative">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 md:gap-6 bg-[#0a0a0f]/80 p-3 md:p-8 rounded-xl md:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 md:gap-5 w-full lg:w-auto">
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
            <Icon name="BuildingOfficeIcon" size={20} className="text-indigo-400 drop-shadow-md md:hidden" />
            <Icon name="BuildingOfficeIcon" size={32} className="text-indigo-400 drop-shadow-md hidden md:block" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Global Command Center</h1>
            <p className="text-[9px] md:text-sm font-bold text-zinc-400 mt-0.5 md:mt-1 uppercase tracking-widest flex items-center gap-2">
              Asset Intelligence & Control
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full lg:w-auto">
          <button
            onClick={onAddProperty}
            className="w-full lg:w-auto px-4 md:px-6 py-2.5 md:py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2 md:gap-3 border border-indigo-400/30"
          >
            <Icon name="PlusCircleIcon" size={16} className="md:hidden" />
            <Icon name="PlusCircleIcon" size={18} className="hidden md:block" />
            Deploy New Asset
          </button>
        </div>
      </div>

      {/* Advanced Filter Matrix */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex flex-nowrap bg-black/40 border border-white/10 rounded-xl md:rounded-2xl p-1 md:p-1.5 shadow-inner min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative px-2.5 md:px-4 py-1.5 md:py-3 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-3 transition-all duration-300
                        ${isActive
                    ? 'bg-zinc-800/80 shadow-md transform scale-[1.02]'
                    : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}
                     `}
              >
                <div className={`p-1 md:p-1.5 rounded-lg ${isActive ? tab.bg : 'bg-transparent'}`}>
                  <Icon name={tab.icon} size={13} className={`md:hidden ${isActive ? tab.color : 'text-current'}`} />
                  <Icon name={tab.icon} size={16} className={`hidden md:block ${isActive ? tab.color : 'text-current'}`} />
                </div>
                <span className={`text-[9px] md:text-[11px] font-bold uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-white' : ''}`}>
                  {tab.label}
                </span>
                <span className={`px-1.5 md:px-2 py-0.5 rounded-md text-[8px] md:text-[9px] font-black ${isActive ? 'bg-black/40 text-white border border-white/10' : 'bg-transparent text-current'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deep Glassmorphic Grid Container */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl relative p-3 md:p-8 overflow-hidden min-h-[500px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        {renderPropertyGrid(getFilteredProperties())}
      </div>

      {/* Modern Dialog Wrapper */}
      <Dialog open={!!managingRoomsProperty} onOpenChange={(open) => !open && setManagingRoomsProperty(null)}>
        <DialogContent className="sm:max-w-2xl bg-[#0a0a0f] text-white border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />
          <DialogHeader className="p-4 md:p-8 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-lg md:text-2xl font-heading font-black tracking-tight text-white flex items-center gap-2 md:gap-3 leading-tight">
              <div className="p-2 md:p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg md:rounded-xl shrink-0">
                <Icon name="Squares2X2Icon" size={18} className="text-indigo-400" />
              </div>
              <span>Configuring Sub-Units for {managingRoomsProperty?.title || managingRoomsProperty?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {managingRoomsProperty && (
              <RoomManager
                property={managingRoomsProperty}
                onUpdate={() => { }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Properties;