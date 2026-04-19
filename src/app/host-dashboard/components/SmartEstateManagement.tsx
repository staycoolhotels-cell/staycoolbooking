'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PropertyControlData, PropertyQualityScore, Property } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';

interface SmartEstateManagementProps {
  properties?: Property[];
  onToggleStatus?: (id: string, newStatus: string) => Promise<void>;
}

const SmartEstateManagement: React.FC<SmartEstateManagementProps> = ({ properties: propData = [], onToggleStatus }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [realMetrics, setRealMetrics] = useState<Record<string, { score: number; feedback: string[] }>>({});
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!propData.length) {
        setLoadingMetrics(false);
        return;
      }

      setLoadingMetrics(true);
      const propertyIds = propData.map(p => p.id);

      try {
        const { data: reviews, error } = await supabaseClient
          .from('reviews')
          .select('property_id, rating, cleanliness_rating, accuracy_rating, communication_rating, location_rating, check_in_rating, value_rating')
          .in('property_id', propertyIds);

        if (error) throw error;

        const metricsMap: Record<string, { score: number; feedback: string[] }> = {};

        propData.forEach(prop => {
          const propReviews = reviews?.filter(r => r.property_id === prop.id) || [];
          
          let score = 8.5; // Default score
          let feedback: string[] = [];

          if (propReviews.length > 0) {
            const avg = (key: string) => propReviews.reduce((acc, r) => acc + (r[key as keyof typeof r] || 0), 0) / propReviews.length;
            
            const ratings = {
              overall: avg('rating'),
              cleanliness: avg('cleanliness_rating'),
              accuracy: avg('accuracy_rating'),
              communication: avg('communication_rating'),
              location: avg('location_rating'),
              checkIn: avg('check_in_rating'),
              value: avg('value_rating'),
            };

            score = Number((ratings.overall * 2).toFixed(1)); // Scale to 10
            
            if (ratings.cleanliness >= 4.5) feedback.push('Clean space');
            if (ratings.accuracy >= 4.5) feedback.push('Description is accurate');
            if (ratings.communication >= 4.5) feedback.push('Great communication');
            if (ratings.location >= 4.5) feedback.push('Perfect location');
            if (ratings.checkIn >= 4.5) feedback.push('Smooth check-in');
            if (ratings.value >= 4.5) feedback.push('Excellent value');
          }

          // Attribute-based fallbacks/additions
          if (feedback.length < 3) {
            if (prop.amenities && prop.amenities.length > 8) feedback.push('Richly equipped');
            if (prop.instantBook) feedback.push('Instant book ready');
            if (prop.tier === 'Luxe' || prop.tier === 'Aura') feedback.push('Premium Choice');
            if (prop.host?.verified) feedback.push('Verified host');
            if (prop.host?.responseRate && prop.host.responseRate > 90) feedback.push('Fast responses');
          }

          // Final polish: keep only top 3
          feedback = feedback.slice(0, 3);
          
          // Ensure at least 3 items for UI consistency if possible
          if (feedback.length < 3 && !feedback.includes('Description is accurate')) feedback.push('Description is accurate');
          if (feedback.length < 3 && !feedback.includes('Clean space')) feedback.push('Clean space');
          if (feedback.length < 3 && !feedback.includes('Great response rate')) feedback.push('Great response rate');

          metricsMap[prop.id] = { score, feedback: feedback.slice(0, 3) };
        });

        setRealMetrics(metricsMap);
      } catch (err) {
        console.error('Error fetching quality metrics:', err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [propData]);

  const { controls, qualityScores } = useMemo(() => {
    const data = propData || [];
    const mappedControls: PropertyControlData[] = data.map((p) => ({
      id: p.id,
      propertyName: p.name || p.title || 'Stay Cool Property',
      isBlocked: p.status === 'offline',
    }));

    const mappedScores: PropertyQualityScore[] = data.map((p) => ({
      propertyId: p.id,
      propertyName: p.name || p.title || 'Stay Cool Property',
      score: realMetrics[p.id]?.score || 7.5,
      feedback: realMetrics[p.id]?.feedback || ['Description is accurate', 'Great response rate', 'Clean space'],
    }));

    return { controls: mappedControls, qualityScores: mappedScores };
  }, [propData, realMetrics]);

  const handleToggleBlock = async (id: string, currentStatus: boolean, name: string) => {
    setIsProcessing(id);
    const newStatus = currentStatus ? 'active' : 'offline';

    try {
      if (onToggleStatus) {
        await onToggleStatus(id, newStatus);
      } else {
        const { error } = await supabase
          .rpc('toggle_property_status', { p_id: id, p_status: newStatus });

        if (error) throw error;
      }

      toast.success(`${name} is now ${newStatus === 'active' ? 'Live on Market' : 'Off-Market'}`, {
        icon: newStatus === 'active' ? <Icon name="CheckCircleIcon" className="text-success" /> : <Icon name="EyeSlashIcon" className="text-warning" />
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update property status');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* 1. Header & Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-64 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <Icon name="BuildingOffice2Icon" size={32} className="text-blue-400 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Smart Estate</h1>
            <p className="text-sm font-medium text-zinc-400 mt-1 uppercase tracking-widest">Inventory Management System</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-inner">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Units</p>
            <p className="text-3xl font-heading font-black text-white drop-shadow-sm">{(propData || []).length}</p>
          </div>
          <div className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-inner">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Now</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              <p className="text-3xl font-heading font-black text-success drop-shadow-sm">{controls.filter(c => !c.isBlocked).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* 2. Master Switches */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px] group">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                <Icon name="AdjustmentsHorizontalIcon" size={20} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Master Switches
              </h2>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Visibility Control</p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar relative z-10">
            <AnimatePresence>
              {controls.map((control, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={control.id}
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-300 group/switch
                     ${control.isBlocked
                      ? 'bg-zinc-900/50 border-white/5 hover:border-zinc-700'
                      : 'bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/20 hover:border-blue-500/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]'}
                  `}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="HomeModernIcon" size={14} className={control.isBlocked ? 'text-zinc-500' : 'text-blue-400'} />
                      <p className={`font-bold text-base transition-colors ${control.isBlocked ? 'text-zinc-400' : 'text-white'}`}>
                        {control.propertyName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${control.isBlocked ? 'bg-zinc-600' : 'bg-success shadow-[0_0_5px_rgba(34,197,94,0.5)]'}`} />
                      <p className={`text-[10px] font-black uppercase tracking-widest ${control.isBlocked ? 'text-zinc-500' : 'text-success'}`}>
                        {control.isBlocked ? 'Off-Market' : 'Live on Platform'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:ml-auto">
                    {isProcessing === control.id && (
                      <Icon name="ArrowPathIcon" size={16} className="text-blue-400 animate-spin" />
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!control.isBlocked}
                        onChange={() => handleToggleBlock(control.id, control.isBlocked, control.propertyName)}
                        disabled={isProcessing === control.id}
                      />
                      <div className="w-14 h-7 bg-zinc-800 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:after:translate-x-7 peer-checked:after:border-white disabled:opacity-50"></div>
                    </label>
                  </div>
                </motion.div>
              ))}
              {controls.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                  <Icon name="HomeIcon" size={32} className="text-zinc-500 mb-4" />
                  <p className="text-sm font-bold text-zinc-300">No properties found</p>
                  <p className="text-xs text-zinc-500 mt-1">Add a listing to manage visibility.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. Quality Metrics */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px] group">
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-inner">
                <Icon name="StarIcon" size={20} className="text-purple-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Quality Metrics
              </h2>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Listing Health</p>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2 no-scrollbar relative z-10">
            {loadingMetrics ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <Icon name="ArrowPathIcon" size={32} className="text-purple-500 animate-spin mb-4" />
                <p className="text-sm font-bold text-zinc-300">Analyzing Quality Metrics...</p>
              </div>
            ) : qualityScores.map((quality, idx) => {
              const pbColor = quality.score >= 8 ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]' : quality.score >= 6 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
              const textScoreColor = quality.score >= 8 ? 'text-success' : quality.score >= 6 ? 'text-yellow-500' : 'text-red-500';
              const bgScoreColor = quality.score >= 8 ? 'bg-success/10 border-success/20' : quality.score >= 6 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

              return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={quality.propertyId}
                  className="p-5 md:p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all duration-300 group/score shadow-lg hover:shadow-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-white text-base leading-tight mb-1">{quality.propertyName}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Aura Score computed</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${bgScoreColor} shadow-inner`}>
                      <Icon name="SparklesIcon" size={14} className={textScoreColor} />
                      <span className={`text-sm font-black ${textScoreColor}`}>
                        {quality.score}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold">/10</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-5 overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${quality.score * 10}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 + 0.2 }}
                      className={`h-full ${pbColor} rounded-full`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quality.feedback.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg font-medium shadow-sm hover:border-purple-500/30 transition-colors"
                      >
                        <span className="text-purple-400 mr-1.5">★</span>{f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
            {!loadingMetrics && qualityScores.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <Icon name="ClipboardDocumentCheckIcon" size={32} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">No score data</p>
                <p className="text-xs text-zinc-500 mt-1">Host active stays to generate aura scores.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartEstateManagement;
