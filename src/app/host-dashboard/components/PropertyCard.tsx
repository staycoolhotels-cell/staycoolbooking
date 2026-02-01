'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'pending' | 'rejected') => void;
}

/**
 * Premium Property Card for Host Dashboard
 * Features: Glassmorphism, Shimmer Animation, and 3D Hover Effects
 */
const PropertyCard = ({ property, onEdit, onDelete, onToggleStatus }: PropertyCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-white/30 transition-all duration-500 shadow-2xl"
    >
      {/* 1. ANIMATED SHIMMER EFFECT [New Feature] */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg] pointer-events-none z-20"
      />

      {/* 2. IMAGE SECTION WITH VIGNETTE */}
      <div className="relative h-56 w-full overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0].url}
            alt={property.name || ''}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-text-secondary text-sm">
            No Image
          </div>
        )}
        {/* Deep Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20" />

        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(property.id, property.status === 'active' ? 'pending' : 'active');
            }}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border transition-all ${
              property.status === 'active'
                ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)]'
                : property.status === 'pending'
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
                  : 'bg-red-500/20 border-red-500/50 text-red-500'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${property.status === 'active' ? 'bg-primary animate-pulse' : property.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}
              />
              {property.status === 'active'
                ? 'Live'
                : property.status === 'pending'
                  ? 'Pending'
                  : 'Rejected'}
            </div>
          </button>
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="p-7 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {property.type}
            </span>
            <h3 className="text-xl font-heading font-bold text-white group-hover:text-primary transition-colors">
              {property.name}
            </h3>
            <div className="flex items-center text-white/40">
              <Icon name="MapPinIcon" size={14} className="mr-1" />
              <span className="text-xs font-medium truncate max-w-[180px]">
                {property.location}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold text-white/30 uppercase tracking-tighter">Earnings</p>
            <p className="text-xl font-heading font-bold text-white">₹0</p>
          </div>
        </div>

        {/* 4. ACTIONS AREA */}
        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
          <div className="flex -space-x-2">
            {/* Simple indicator for photos/amenities */}
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon name="PhotoIcon" size={14} className="text-white/40" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon name="SparklesIcon" size={14} className="text-white/40" />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onEdit(property.id)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-white/60 hover:text-white hover:scale-110 active:scale-90"
              title="Edit Property"
            >
              <Icon name="PencilSquareIcon" size={20} />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this property?')) {
                  onDelete(property.id);
                }
              }}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/20 transition-all text-red-500/60 hover:text-red-500 hover:scale-110 active:scale-90"
              title="Delete Property"
            >
              <Icon name="TrashIcon" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Glow Line */}
      <div className="absolute bottom-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </motion.div>
  );
};

export default PropertyCard;
