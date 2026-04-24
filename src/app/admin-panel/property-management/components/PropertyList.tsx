'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { approveProperty, rejectProperty } from '@/lib/admin-actions';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, MapPin, Tag, Eye, Home, Clock, Ban } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface PropertyListProps {
  initialProperties: Property[];
}

type TabKey = 'all' | 'pending' | 'active' | 'rejected';

const STATUS_CONFIG: Record<string, {
  label: string;
  pill: string;
  dot: string;
  border: string;
  glow: string;
}> = {
  active: {
    label: 'Active',
    pill: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'rgba(16,185,129,0.08)',
  },
  pending: {
    label: 'Pending',
    pill: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    dot: 'bg-amber-400 animate-pulse',
    border: 'border-amber-500/20',
    glow: 'rgba(245,158,11,0.08)',
  },
  rejected: {
    label: 'Rejected',
    pill: 'bg-rose-500/15 text-rose-300 border border-rose-500/25',
    dot: 'bg-rose-400',
    border: 'border-rose-500/20',
    glow: 'rgba(239,68,68,0.08)',
  },
};

const PropertyList = ({ initialProperties }: PropertyListProps) => {
  const router = useRouter();
  const { properties, setProperties, updateProperty } = useAppStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with initial properties ONLY if store is empty or we have fresh data
  useEffect(() => {
    if (properties.length === 0 && initialProperties.length > 0) {
      setProperties(initialProperties);
    }
  }, [initialProperties, setProperties, properties.length]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Check if already in store to avoid duplicates
          const exists = properties.some(p => p.id === payload.new.id);
          if (!exists) setProperties([...properties, payload.new as Property]);
        } else if (payload.eventType === 'UPDATE') {
          updateProperty(payload.new as Property);
        } else if (payload.eventType === 'DELETE') {
          setProperties(properties.filter((p) => p.id !== (payload.old as Property).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    setLoading(propertyId);
    try {
      const result = await approveProperty(propertyId);
      if (!result) throw new Error('Failed to approve property');
      
      // Update store state instantly
      updateProperty({ id: propertyId, status: 'active' });
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Failed to approve property');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    setLoading(propertyId);
    try {
      const result = await rejectProperty(propertyId, 'Rejected by admin');
      if (!result) throw new Error('Failed to reject property');
      
      // Update store state instantly
      updateProperty({ id: propertyId, status: 'rejected' });
    } catch (error) {
      console.error('Error rejecting property:', error);
      alert('Failed to reject property');
    } finally {
      setLoading(null);
    }
  };

  const pendingProperties = properties.filter((p) => p.status === 'pending');
  const activeProperties = properties.filter((p) => p.status === 'active');
  const rejectedProperties = properties.filter((p) => p.status === 'rejected');

  const tabs: { key: TabKey; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', count: properties.length, icon: <Home size={14} /> },
    { key: 'pending', label: 'Pending', count: pendingProperties.length, icon: <Clock size={14} /> },
    { key: 'active', label: 'Active', count: activeProperties.length, icon: <CheckCircle size={14} /> },
    { key: 'rejected', label: 'Rejected', count: rejectedProperties.length, icon: <Ban size={14} /> },
  ];

  const filteredByTab =
    activeTab === 'all'
      ? properties
      : activeTab === 'pending'
        ? pendingProperties
        : activeTab === 'active'
          ? activeProperties
          : rejectedProperties;

  const filteredProperties = filteredByTab.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.title || p.name || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: properties.length, color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
          { label: 'Pending', value: pendingProperties.length, color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Active', value: activeProperties.length, color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Rejected', value: rejectedProperties.length, color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl ${stat.bg} border ${stat.border} p-4 flex flex-col gap-1`}
          >
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-3xl font-heading font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
        {/* Custom Tab Filter */}
        <div className="w-full xl:flex-1 bg-[#0a0a0f]/70 backdrop-blur-xl border border-white/10 rounded-xl p-1 flex flex-wrap items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 sm:flex-none min-w-[30%] sm:min-w-0 flex justify-center items-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-lg text-[10px] sm:text-xs font-heading font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${activeTab === tab.key
                  ? 'bg-gradient-to-br from-white to-zinc-200 text-black shadow-[0_4px_14px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === tab.key ? 'bg-black/10 text-black' : 'bg-white/5 text-zinc-400'
                }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties..."
            className="w-full px-4 py-2.5 pl-9 bg-[#0a0a0f]/70 backdrop-blur-sm border border-white/10 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/10 transition-all"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
      </div>

      {/* Property Cards */}
      <AnimatePresence mode="wait">
        {filteredProperties.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center justify-center py-20 bg-[#0a0a0f]/60 border border-dashed border-white/10 rounded-2xl"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Home size={32} className="text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-400">No properties found</p>
            <p className="text-xs text-zinc-600 mt-1">
              {searchQuery ? `No results for "${searchQuery}"` : `No ${activeTab !== 'all' ? activeTab : ''} listings yet`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab + searchQuery}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filteredProperties.map((property) => {
              const statusCfg = STATUS_CONFIG[property.status] || STATUS_CONFIG.pending;
              const isLoading = loading === property.id;

              return (
                <motion.div
                  key={property.id}
                  layout
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/admin-panel/property-management/${property.id}`)}
                  style={{ borderColor: statusCfg.border.replace('border-', '') }}
                  className={`group relative overflow-hidden cursor-pointer rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border ${statusCfg.border} hover:border-white/20 transition-all duration-400`}
                >
                  {/* Status glow background */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: `radial-gradient(circle at 20% 20%, ${statusCfg.glow}, transparent 70%)` }}
                  />

                  {/* Image area placeholder */}
                  <div className="relative h-36 bg-white/[0.03] border-b border-white/8 overflow-hidden">
                    {(property as any).images?.[0] ? (
                      <img
                        src={(property as any).images[0]}
                        alt={property.title || property.name || 'Property'}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Home size={32} className="text-zinc-700" />
                      </div>
                    )}
                    {/* Status badge overlay */}
                    <div className="absolute top-3 right-3">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${statusCfg.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-4">
                    <h3 className="font-heading font-bold text-sm text-white group-hover:text-white truncate mb-0.5">
                      {property.title || property.name || 'Untitled Property'}
                    </h3>
                    <p className="text-[10px] text-zinc-600 font-mono truncate mb-3">
                      {property.id.slice(0, 20)}...
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <MapPin size={11} />
                        <span className="text-xs truncate max-w-[120px]">{property.location || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Tag size={11} />
                        <span className="text-xs font-semibold text-zinc-300">₹{property.price_per_night?.toLocaleString()}/night</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {property.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => handleApprove(e, property.id)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 disabled:opacity-50"
                          >
                            <CheckCircle size={13} />
                            {isLoading ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={(e) => handleReject(e, property.id)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold hover:bg-rose-500/20 hover:border-rose-500/40 transition-all duration-300 disabled:opacity-50"
                          >
                            <XCircle size={13} />
                            {isLoading ? 'Processing...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {property.status === 'rejected' && (
                        <button
                          onClick={(e) => handleApprove(e, property.id)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 disabled:opacity-50"
                        >
                          <CheckCircle size={13} />
                          {isLoading ? 'Processing...' : 'Re-approve'}
                        </button>
                      )}
                      {property.status === 'active' && (
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-500/40 transition-all duration-300"
                        >
                          <Eye size={13} />
                          View Details
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to right, transparent, ${statusCfg.glow.replace('0.08', '0.6')}, transparent)` }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PropertyList;
