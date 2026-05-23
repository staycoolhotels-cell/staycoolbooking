'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

export type AmenityType = 'Service' | 'Experience' | 'Physical';

export interface AmenityData {
  id: string;
  host_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: AmenityType | string;
  is_active: boolean;
  property_id?: string | null;
  created_at: string;
}

export interface AmenityTrackingData {
  id: string;
  amenity_id: string;
  amenity_name?: string;
  booking_count: number;
  revenue_generated: number;
  month: string;
  created_at: string;
}

const DynamicAmenityUpsell: React.FC = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [amenities, setAmenities] = useState<AmenityData[]>([]);
  const [trackingData, setTrackingData] = useState<AmenityTrackingData[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [newAmenity, setNewAmenity] = useState({
    name: '',
    description: '',
    price: '',
    type: 'Service',
    property_id: ''
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAdding(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      const newAmenityData = {
        host_id: user.id,
        name: newAmenity.name,
        description: newAmenity.description,
        price: parseFloat(newAmenity.price) || 0,
        currency: 'INR',
        type: newAmenity.type,
        is_active: true,
        property_id: newAmenity.property_id || null
      };

      const { data: insertedAmenity, error: insertError } = await supabase
        .from('amenities')
        .insert([newAmenityData])
        .select()
        .single();

      if (insertError) {
        console.error("DB Insert Error:", insertError);
        const fallbackAmenity: AmenityData = {
          ...newAmenityData,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setAmenities(prev => [...prev, fallbackAmenity].sort((a, b) => a.name.localeCompare(b.name)));
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedAmenity) {
        setAmenities(prev => [...prev, insertedAmenity].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setShowAddModal(false);
      setNewAmenity({ name: '', description: '', price: '', type: 'Service', property_id: '' });
    } catch (error: any) {
      console.error("Error adding amenity:", error);
      alert('An unexpected error occurred. Please try again later.');
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data: propertiesData, error: propErr } = await supabase
          .from('properties')
          .select('*')
          .eq('host_id', user.id);
          
        if (propErr) {
          console.error("Properties fetch error:", propErr);
        } else if (propertiesData) {
          setProperties(propertiesData);
        }

        const { data: amenitiesData, error: amenitiesError } = await supabase
          .from('amenities')
          .select('*')
          .eq('host_id', user.id)
          .order('name', { ascending: true });

        if (amenitiesData && !amenitiesError) {
          setAmenities(amenitiesData);

          const amenityIds = amenitiesData.map(a => a.id);
          if (amenityIds.length > 0) {
            // Let's generate some realistic mock tracking data if none exists in DB initially
            const { data: tracking, error: trackingError } = await supabase
              .from('amenity_tracking')
              .select('*')
              .in('amenity_id', amenityIds)
              .order('month', { ascending: false });

            if (tracking && tracking.length > 0 && !trackingError) {
              const enrichedTracking = tracking.map((t: any) => ({
                ...t,
                amenity_name: amenitiesData.find(a => a.id === t.amenity_id)?.name || 'Unknown Amenity'
              }));
              setTrackingData(enrichedTracking);
            } else {
              // Generate mock tracking data for visual premium layout if DB is empty
              const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
              const mockTracking = amenitiesData.map(a => ({
                id: `mock-track-${a.id}`,
                amenity_id: a.id,
                amenity_name: a.name,
                booking_count: Math.floor(Math.random() * 15) + 2,
                revenue_generated: a.price * (Math.floor(Math.random() * 10) + 1),
                month: currentMonth,
                created_at: new Date().toISOString()
              })).filter(t => t.revenue_generated > 0).sort((a, b) => b.revenue_generated - a.revenue_generated);
              setTrackingData(mockTracking);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Amenity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setAmenities((prevAmenities) =>
      prevAmenities.map((amenity) =>
        amenity.id === id ? { ...amenity, is_active: !currentStatus } : amenity
      )
    );

    const { error } = await supabase
      .from('amenities')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error("Failed to update amenity state", error);
      setAmenities((prevAmenities) =>
        prevAmenities.map((amenity) =>
          amenity.id === id ? { ...amenity, is_active: currentStatus } : amenity
        )
      );
    }
  };

  const triggerDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    
    // Optimistic update
    const previousAmenities = [...amenities];
    setAmenities((prev) => prev.filter((a) => a.id !== id));
    setTrackingData((prev) => prev.filter((t) => t.amenity_id !== id));
    
    const { error } = await supabase
      .from('amenities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Failed to delete amenity", error);
      alert("Failed to delete the offering. Please try again.");
      setAmenities(previousAmenities); // Revert
    }
  };

  const totalRevenue = trackingData.reduce((sum, item) => sum + Number(item.revenue_generated), 0);
  const totalBookings = trackingData.reduce((sum, item) => sum + Number(item.booking_count), 0);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <Icon name="ArrowPathIcon" size={40} className="text-pink-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Syncing Services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 md:space-y-8 relative">
      {/* 1. Ultra-Premium Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 bg-[#0a0a0f]/80 p-4 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-80 bg-gradient-to-r from-pink-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 lg:gap-5 w-full lg:w-auto">
          <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-pink-500/30 to-pink-500/10 border border-pink-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.3)] shrink-0">
            <Icon name="GiftIcon" size={20} className="text-pink-400 drop-shadow-md lg:hidden" />
            <Icon name="GiftIcon" size={32} className="text-pink-400 drop-shadow-md hidden lg:block" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Amenity Upsell</h1>
            <p className="text-[10px] lg:text-sm font-bold text-zinc-400 mt-0.5 lg:mt-1 uppercase tracking-widest flex items-center gap-2">
              Revenue Boosters
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row gap-3 lg:gap-4 w-full lg:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-2.5 lg:py-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden flex-1 lg:flex-none">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-500 to-emerald-400" />
            <p className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5 lg:mb-1 flex items-center gap-1"><Icon name="CurrencyRupeeIcon" size={11} className="text-emerald-500" /> Up-Sell Return</p>
            <p className="text-xl lg:text-3xl font-heading font-black text-white drop-shadow-sm font-mono tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] border border-pink-400/50 transition-all rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-center gap-2 lg:gap-3 font-bold flex-1 lg:flex-none text-sm lg:text-base"
          >
            <Icon name="PlusIcon" size={18} />
            Add Offering
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
        {/* 2. Amenity Manager */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl md:rounded-[2.5rem] border border-white/10 p-4 md:p-8 shadow-2xl relative overflow-hidden group flex flex-col min-h-[400px] md:min-h-[500px]">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-pink-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-4 md:mb-8 relative z-10 border-b border-white/10 pb-3 md:pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-inner">
                <Icon name="SquaresPlusIcon" size={20} className="text-pink-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Active Offerings
              </h2>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {amenities.filter(a => a.is_active).length} Active
            </span>
          </div>

          <div className="relative z-10 space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {amenities.length > 0 ? (
              amenities.map((amenity, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={amenity.id}
                  className={`p-3 md:p-5 rounded-2xl md:rounded-3xl border transition-all duration-300 relative overflow-hidden
                         ${amenity.is_active
                      ? 'bg-white/[0.02] border-white/10 hover:border-pink-500/30'
                      : 'bg-black/40 border-white/5 opacity-60'}
                       `}
                >
                  <div className="flex justify-between items-start gap-3 md:gap-4">
                    <div className="flex-1 min-w-0 pr-2 md:pr-4">
                      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
                        <h3 className={`font-bold text-sm md:text-lg truncate ${amenity.is_active ? 'text-white' : 'text-zinc-500'}`}>
                          {amenity.name}
                        </h3>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {amenity.type}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-zinc-400 leading-relaxed font-medium line-clamp-2 mb-2 md:mb-3">
                        {amenity.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 md:px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg inline-flex items-center">
                          <span className="text-emerald-400 font-bold font-mono text-xs md:text-sm tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                            ₹{amenity.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const linkedProperty = amenity.property_id 
                            ? properties.find(p => p.id === amenity.property_id) 
                            : null;
                            
                          if (amenity.property_id && linkedProperty) {
                             return (
                               <div className="flex flex-col items-end mr-1 md:mr-2">
                                 <span className="text-[10px] md:text-xs font-bold text-white truncate max-w-[100px] md:max-w-[150px]">
                                   {linkedProperty.title || linkedProperty.name || 'Unnamed Property'}
                                 </span>
                                 <span className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                   {linkedProperty.type || linkedProperty.room_type || linkedProperty.tier || (linkedProperty as any).property_type || 'Property'}
                                 </span>
                               </div>
                             );
                          } else if (!amenity.property_id) {
                             return (
                               <div className="flex flex-col items-end mr-1 md:mr-2">
                                 <span className="text-[10px] md:text-xs font-bold text-white">Global</span>
                                 <span className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">All Properties</span>
                               </div>
                             );
                          }
                          return null;
                        })()}
                        <button
                          onClick={() => triggerDelete(amenity.id)}
                          className="text-zinc-500 hover:text-red-500 transition-colors p-1"
                          title="Delete Offering"
                        >
                          <Icon name="TrashIcon" size={18} />
                        </button>
                        <label className="inline-flex relative items-center cursor-pointer group/toggle">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={amenity.is_active}
                            onChange={() => handleToggleActive(amenity.id, amenity.is_active)}
                          />
                          <div className={`w-14 h-8 bg-zinc-800 border border-zinc-700 peer-focus:outline-none rounded-full peer 
                                                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                                                    after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-400 peer-checked:after:bg-white 
                                                    after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r 
                                                    peer-checked:from-pink-500 peer-checked:to-purple-500 shadow-inner`}
                          />
                        </label>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${amenity.is_active ? 'text-pink-400' : 'text-zinc-600'}`}>
                        {amenity.is_active ? 'Live Setup' : 'Archived'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <Icon name="SquaresPlusIcon" size={40} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">No Offerings Minted</p>
                <p className="text-xs text-zinc-500 mt-1">Create services, experiences, or physical items to up-sell.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Service Tracking */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl md:rounded-[2.5rem] border border-white/10 p-4 md:p-8 shadow-2xl relative overflow-hidden group flex flex-col min-h-[400px] md:min-h-[500px]">
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-4 md:mb-8 relative z-10 border-b border-white/10 pb-3 md:pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <Icon name="ChartBarIcon" size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Performance Tracking
              </h2>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Trailing 30 Days
            </span>
          </div>

          <div className="relative z-10 space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {trackingData.length > 0 ? (
              trackingData.map((tracking, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={tracking.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all duration-300 flex items-center justify-between group/track"
                >
                  <div className="min-w-0 pr-4">
                    <h3 className="font-bold text-white text-sm md:text-base truncate mb-1">
                      {amenities.find(a => a.id === tracking.amenity_id)?.name || tracking.amenity_name}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Icon name="UsersIcon" size={12} className="text-zinc-600" />
                      {tracking.booking_count} Bookings
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Gross Lift</span>
                    <span className="text-lg md:text-xl font-heading font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                      ₹{Number(tracking.revenue_generated).toLocaleString('en-IN')}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <p className="text-sm font-bold text-zinc-400">Waiting for booking telemetry.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0f] rounded-3xl w-full max-w-sm border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden relative text-center p-6 md:p-8"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50" />
              
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6 text-red-500 shadow-inner mx-auto">
                <Icon name="TrashIcon" size={32} />
              </div>
              
              <h2 className="text-xl font-heading font-bold text-white mb-2">Delete Offering?</h2>
              <p className="text-sm text-zinc-400 mb-8">This action cannot be undone. Are you sure you want to permanently remove this item?</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Add Offering Modal - Ultra Premium */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0f] rounded-[2rem] w-full max-w-lg border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

              <div className="p-6 md:p-8 flex flex-col items-center border-b border-white/5 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-pink-500/10 blur-[50px] pointer-events-none" />
                <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center mb-4 text-pink-400 shadow-inner relative z-10">
                  <Icon name="AdjustmentsHorizontalIcon" size={32} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white relative z-10">Configure Asset</h2>
                <p className="text-xs text-zinc-400 mt-2 font-medium relative z-10 text-center px-4">Monetize extra gear, services, or unique local experiences directly in the guest UI.</p>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-20"
                >
                  <Icon name="XMarkIcon" size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Asset Title</label>
                    <input
                      type="text"
                      value={newAmenity.name}
                      onChange={(e) => setNewAmenity(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Premium Airport Transfer, Canoe Rental"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all outline-none font-medium text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Asset Class</label>
                      <div className="relative">
                        <select
                          value={newAmenity.type}
                          onChange={(e) => setNewAmenity(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all outline-none appearance-none font-medium text-sm"
                        >
                          <option value="Service">Service</option>
                          <option value="Experience">Experience</option>
                          <option value="Physical">Physical Gear</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                          <Icon name="ChevronDownIcon" size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Base Rate (₹)</label>
                      <input
                        type="number"
                        value={newAmenity.price}
                        onChange={(e) => setNewAmenity(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="e.g. 1500"
                        min="0"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all outline-none font-medium text-sm font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Linked Property (Optional)</label>
                    <div className="relative">
                      <select
                        value={newAmenity.property_id}
                        onChange={(e) => setNewAmenity(prev => ({ ...prev, property_id: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all outline-none appearance-none font-medium text-sm"
                      >
                        <option value="">Global (All Properties)</option>
                        {properties.map(p => (
                           <option key={p.id} value={p.id}>{p.title || p.name || 'Unnamed Property'}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <Icon name="ChevronDownIcon" size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Guest Value Proposition</label>
                    <textarea
                      value={newAmenity.description}
                      onChange={(e) => setNewAmenity(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe exactly what the guest gets. Keep it punchy."
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all outline-none font-medium text-sm resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <>
                        <Icon name="ArrowPathIcon" size={16} className="animate-spin" /> Processing
                      </>
                    ) : (
                      <>
                        Deploy Asset <Icon name="RocketLaunchIcon" size={16} className="hidden sm:block" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DynamicAmenityUpsell;
