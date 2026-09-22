'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Property } from '@/lib/types';
import ActionConfirmModal from '@/components/ui/ActionConfirmModal';


interface PropertyCardProps {
  property: Property;
  bookings?: any[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'pending' | 'rejected' | 'offline') => void;
  onManageRooms: (property: Property) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return {
        label: 'Live',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.3)]',
        indicator: 'bg-emerald-400 animate-pulse',
        actionLabel: 'Take Offline',
        allowToggle: true,
        toggleTo: 'offline' as const
      };
    case 'offline':
      return {
        label: 'Offline',
        color: 'text-zinc-400',
        bg: 'bg-zinc-500/20',
        border: 'border-zinc-500/30',
        shadow: '',
        indicator: 'bg-zinc-400',
        actionLabel: 'Make Live',
        allowToggle: true,
        toggleTo: 'active' as const
      };
    case 'pending':
      return {
        label: 'Pending Approval',
        color: 'text-amber-400',
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30',
        shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]',
        indicator: 'bg-amber-400 animate-pulse',
        actionLabel: 'Pending Approval',
        allowToggle: false,
        toggleTo: null
      };
    case 'rejected':
      return {
        label: 'Compliance Issue',
        color: 'text-red-400',
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        shadow: 'shadow-[0_0_15px_rgba(248,113,113,0.2)]',
        indicator: 'bg-red-400',
        actionLabel: 'Requires Fix',
        allowToggle: false,
        toggleTo: null
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-zinc-400',
        bg: 'bg-zinc-500/20',
        border: 'border-zinc-500/30',
        shadow: '',
        indicator: 'bg-zinc-400',
        actionLabel: 'N/A',
        allowToggle: false,
        toggleTo: null
      };
  }
};

const PropertyCard = ({ property, bookings = [], onEdit, onDelete, onToggleStatus, onManageRooms }: PropertyCardProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const estimatedEarnings = React.useMemo(() => {
    return bookings.reduce((sum, b) => {
      if (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'completed') {
        return sum + (Number(b.total_price) || 0);
      }
      return sum;
    }, 0);
  }, [bookings]);

  const statusConfig = getStatusConfig(property.status);

  return (
    <>
      <div 
        onClick={() => onEdit(property.id)}

      className="group relative bg-[#0a0a0f] backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col h-full cursor-pointer"
    >
      {/* 1. ANIMATED SHIMMER EFFECT */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg] pointer-events-none z-20"
      />

      {/* 2. IMAGE SECTION WITH VIGNETTE */}
      <div className="relative h-28 md:h-52 w-full overflow-hidden shrink-0">
        {(property.images?.[0] || property.image_url) ? (
          <img
            src={(property.images?.[0] as any)?.url || property.images?.[0] || property.image_url}
            alt={property.name || ''}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-black flex flex-col items-center justify-center gap-2">
            <Icon name="PhotoIcon" size={32} className="text-indigo-500/30" />
            <span className="text-xs font-bold text-indigo-500/50 uppercase tracking-widest">No Visual Assets</span>
          </div>
        )}

        {/* Deep Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />

        {/* Status Badge (Interactive) */}
        <div className="absolute top-2.5 md:top-4 right-2.5 md:right-4 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (statusConfig.allowToggle && statusConfig.toggleTo) {
                onToggleStatus(property.id, statusConfig.toggleTo);
              }
            }}
            disabled={!statusConfig.allowToggle}
            title={statusConfig.actionLabel}
            className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full backdrop-blur-md border transition-all 
               ${statusConfig.bg} ${statusConfig.border} ${statusConfig.shadow}
               ${statusConfig.allowToggle ? 'cursor-pointer hover:bg-white/10 hover:border-white/30' : 'cursor-not-allowed opacity-90'}
            `}
          >
            <div className={`w-1 h-1 md:w-2 md:h-2 rounded-full ${statusConfig.indicator}`} />
            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </button>
        </div>

        {/* Property Type Badge - Relocated to prevent overlap with status */}
        <div className="absolute bottom-6 left-2.5 md:left-4 z-30">
          <div className="px-1.5 md:px-3 py-0.5 md:py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg shadow-xl">
            <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-white/90">
              {property.type || 'Property'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="p-2.5 md:p-5 relative z-10 flex flex-col flex-1 -mt-4">
        <div className="flex-1">
          <h3 className="text-base md:text-xl font-heading font-black text-white group-hover:text-indigo-400 transition-colors drop-shadow-md line-clamp-2 leading-tight">
            {property.title || property.name}
          </h3>

          <div className="flex items-center text-zinc-400 mt-1.5 group-hover:text-white/80 transition-colors">
            <div className="p-1 bg-white/5 rounded-lg mr-2 shrink-0">
              <Icon name="MapPinIcon" size={12} className="text-indigo-400" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider line-clamp-1">
              {property.location || 'Location not specified'}
            </span>
          </div>

          {/* Metrics Mini-Grid */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-2 mt-2 md:mt-3">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg md:rounded-xl p-1.5 md:p-2.5">
              <p className="text-[7px] md:text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Base Price</p>
              {(() => {
                let displayPrice = property.price_per_night || property.price || 0;
                const roomTypes = (property as any).room_types;
                const roomTypePrices = (property as any).room_type_prices;
                if (roomTypes && Array.isArray(roomTypes) && roomTypes.length > 0 && roomTypePrices) {
                  const activePrices = roomTypes
                    .map((rt: string) => parseFloat(String(roomTypePrices[rt])) || 0)
                    .filter((p: number) => p > 0);
                  if (activePrices.length > 0) {
                    displayPrice = Math.min(...activePrices);
                  }
                }
                return <p className="text-[10px] md:text-xs font-black text-white">₹{displayPrice}</p>;
              })()}
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg md:rounded-xl p-1.5 md:p-2.5">
              <p className="text-[7px] md:text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Est. Earnings</p>
              <p className="text-[10px] md:text-xs font-black text-emerald-400">₹{estimatedEarnings.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Room Type Inventory Breakdown */}
          {(() => {
            const roomTypes: string[] = (property as any).room_types || [];
            const roomCounts: Record<string, number> = (property as any).room_type_counts || {};
            if (roomTypes.length === 0) return null;
            return (
              <div className="mt-2 md:mt-3">
                <p className="text-[7px] md:text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Room Inventory</p>
                <div className="flex flex-wrap gap-1">
                  {roomTypes.map((rt) => {
                    const count = roomCounts[rt] ?? 1;
                    return (
                      <span
                        key={rt}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[8px] md:text-[9px] font-bold"
                      >
                        <span>{rt}</span>
                        <span className="bg-indigo-500/30 rounded px-1 text-white font-black">×{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* 4. ACTIONS AREA */}
        <div className="pt-1.5 md:pt-2 mt-2 md:mt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-y-2 gap-x-1.5 md:gap-2">

          <div className="flex-1 flex items-center gap-1.5 md:gap-2">
            {!['Home Stay', 'Apartment', 'Villa'].includes(property.type || property.tier || '') && (
              <button
                onClick={(e) => { e.stopPropagation(); onManageRooms(property); }}
                className="flex-1 px-2 py-1.5 md:py-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg md:rounded-xl border border-indigo-500/20 transition-all text-indigo-400 hover:text-indigo-300 text-[8px] md:text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 md:gap-2 group/btn"
              >
                <Icon name="Squares2X2Icon" size={11} className="group-hover/btn:scale-110 transition-transform" /> Sub-Units
              </button>
            )}

            <div className="px-2 py-1.5 md:py-2 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-zinc-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
              <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
              {property.type || property.tier || 'Unit'}
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(property.id); }}
              className="w-7 h-7 md:w-8 md:h-8 bg-white/5 hover:bg-white/10 rounded-lg md:rounded-xl border border-white/10 transition-all text-zinc-400 hover:text-white flex items-center justify-center group/edit"
              title="Configure Asset"
            >
              <Icon name="AdjustmentsHorizontalIcon" size={11} className="group-hover/edit:rotate-90 transition-transform" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
              className="w-7 h-7 md:w-8 md:h-8 bg-red-500/10 hover:bg-red-500/20 rounded-lg md:rounded-xl border border-red-500/20 transition-all text-red-500/70 hover:text-red-400 flex items-center justify-center group/del"
              title="Terminate Asset"
            >
              <Icon name="TrashIcon" size={11} className="group-hover/del:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500" />
    </div>

    <ActionConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={() => {
        onDelete(property.id);
        setIsDeleteModalOpen(false);
      }}
      title="Terminate Asset?"
      description="Are you certain you wish to terminate this asset? This action is irreversible and all associated data will be archived."
      confirmLabel="Terminate Asset"
      variant="danger"
    />
    </>
  );
};

export default PropertyCard;
