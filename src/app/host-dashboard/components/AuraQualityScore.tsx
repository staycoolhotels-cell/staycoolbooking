'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePropertyOptimization, getStoredAuraScores } from '@/lib/optimization-actions';

interface GuestReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  property_name: string;
  property_id: string;
  reviewer_avatar?: string;
}

export interface AuraQualityScoreData {
  id: string;
  property_id: string;
  property_name?: string;
  overall_score: number;
  optimization_tips: string[];
  ranking_improvement: string;
}

export interface MarketComparisonData {
  id: string;
  property_id: string;
  property_name?: string;
  your_price?: number;
  average_local_price: number;
  suggested_price: number;
  currency?: string;
}

interface AuraQualityScoreProps {
  properties?: Property[];
}

const AuraQualityScore: React.FC<AuraQualityScoreProps> = ({ properties = [] }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [auraScores, setAuraScores] = useState<AuraQualityScoreData[]>([]);
  const [marketComparisons, setMarketComparisons] = useState<MarketComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [guestReviews, setGuestReviews] = useState<GuestReview[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const propertyMap = useMemo(() => {
    return properties.reduce((acc, prop) => {
      acc[prop.id] = prop;
      return acc;
    }, {} as Record<string, Property>);
  }, [properties]);

  useEffect(() => {
    const fetchData = async () => {
      if (properties.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const propertyIds = properties.map(p => p.id);

      let fetchedReviews: GuestReview[] = [];
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, rating, cleanliness_rating, accuracy_rating, check_in_rating, communication_rating, location_rating, value_rating, comment, created_at, property_id, reviewer_id, reviewer:users!reviewer_id(name, avatar_url), property:properties!property_id(title)')
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false });

        if (!reviewsError && reviewsData && reviewsData.length > 0) {
          fetchedReviews = reviewsData.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            reviewer_name: r.reviewer?.name || 'Guest',
            reviewer_avatar: r.reviewer?.avatar_url,
            property_name: r.property?.title || 'Property',
            property_id: r.property_id,
          }));
        } else {
          const { data: simpleReviews } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, property_id, reviewer_id')
            .in('property_id', propertyIds)
            .order('created_at', { ascending: false });

          if (simpleReviews && simpleReviews.length > 0) {
            const reviewerIds = [...new Set(simpleReviews.map((r: any) => r.reviewer_id).filter(Boolean))];
            const { data: reviewers } = await supabase
              .from('users')
              .select('id, name, avatar_url')
              .in('id', reviewerIds);

            const reviewerMap = Object.fromEntries((reviewers || []).map((u: any) => [u.id, { name: u.name, avatar: u.avatar_url }]));
            const propNames = Object.fromEntries(properties.map(p => [p.id, p.title || p.name || 'Property']));

            fetchedReviews = simpleReviews.map((r: any) => {
              const reviewerInfo = reviewerMap[r.reviewer_id] || { name: 'Guest', avatar: null };
              return {
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                created_at: r.created_at,
                reviewer_name: reviewerInfo.name,
                reviewer_avatar: reviewerInfo.avatar,
                property_name: propNames[r.property_id] || 'Property',
                property_id: r.property_id,
              }
            });
          }
        }
      } catch (e) {
        console.warn('AuraQualityScore: reviews fetch error:', e);
      }
      setGuestReviews(fetchedReviews);

      try {
        // 1. Fetch Stored Scores
        const storedAura = await getStoredAuraScores(propertyIds);
        const fetchedAura = storedAura || [];
        
        // 2. Identify properties needing AI generation
        const needsGeneration = properties.filter(p => !fetchedAura.find(a => a.property_id === p.id));
        
        // Initial set of scores (those already in DB)
        const enrichedAura = properties.map((prop) => {
          const dbData = fetchedAura.find((item: any) => item.property_id === prop.id);
          const propName = prop.name || prop.title || 'Unknown Property';
          if (dbData) {
            return {
              ...dbData,
              property_name: propName
            };
          }
          return null; // Will be filled by generation
        }).filter(Boolean) as AuraQualityScoreData[];

        setAuraScores(enrichedAura);

        // 3. Trigger Generation for missing ones
        if (needsGeneration.length > 0) {
          // Add all missing properties to generating list IMMEDIATELY to prevent "Not enough data" flash
          setGeneratingIds(new Set(needsGeneration.map(p => p.id)));
          triggerOptimizationGeneration(needsGeneration);
        }

        // 4. Market Comparisons (Keep existing logic or migrate similarly)

        const { data: marketData } = await supabase
          .from('market_comparisons')
          .select('*')
          .in('property_id', propertyIds);

        const fetchedMarket = marketData || [];
        const enrichedMarket = properties.map((prop: any) => {
          const dbData = fetchedMarket.find((item: any) => item.property_id === prop.id);
          const currentPrice = prop.price_per_night || prop.price || 5000;
          const propName = prop.name || prop.title || 'Unknown Property';
          if (dbData) {
            return {
              ...dbData,
              property_name: propName,
              your_price: currentPrice,
              currency: 'INR'
            };
          }

          const charCode = propName.charCodeAt(0) || 65;
          const avgPrice = currentPrice * 0.9 + (charCode * 10);
          return {
            id: `market-mock-${prop.id}`,
            property_id: prop.id,
            property_name: propName,
            your_price: currentPrice,
            average_local_price: Math.round(avgPrice),
            suggested_price: Math.round(avgPrice * 0.95),
            currency: 'INR'
          };
        });
        setMarketComparisons(enrichedMarket);
      } catch (error) {
        console.error("Error fetching Aura/Market data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [properties, supabase, propertyMap]);

  const triggerOptimizationGeneration = useCallback(async (propsToGenerate: Property[]) => {
    for (const prop of propsToGenerate) {
      // Ensure it's in the generating set (redundant if called from fetchData but good for safety)
      setGeneratingIds(prev => new Set(prev).add(prop.id));
      
      const result = await generatePropertyOptimization(prop.id);
      
      if (result && result.success && result.data) {
        setAuraScores(prev => {
          const newData: AuraQualityScoreData = {
            id: `aura-gen-${prop.id}`,
            property_id: prop.id,
            property_name: prop.name || prop.title || 'Property',
            overall_score: result.data!.overall_score,
            optimization_tips: result.data!.optimization_tips,
            ranking_improvement: result.data!.ranking_improvement
          };
          const filtered = prev.filter(p => p.property_id !== prop.id);
          return [...filtered, newData];
        });
        setFailedIds(prev => {
          const next = new Set(prev);
          next.delete(prop.id);
          return next;
        });
      } else {
        setFailedIds(prev => new Set(prev).add(prop.id));
      }
      
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(prop.id);
        return next;
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <Icon name="ArrowPathIcon" size={40} className="text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Computing Aura Dynamics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-64 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Icon name="StarIcon" size={32} className="text-amber-400 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Property <span className="text-amber-400/70 text-2xl md:text-3xl font-semibold">Insights & Drawbacks</span></h1>
            <p className="text-sm font-medium text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2">
              Deep Property Analysis
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Signals</p>
            <p className="text-3xl font-heading font-black text-white drop-shadow-sm">{guestReviews.length}</p>
          </div>
        </div>
      </div>

      {/* 2. Reviews Section */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-1000" />

        <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
              <Icon name="ChatBubbleBottomCenterTextIcon" size={20} className="text-amber-400" />
            </div>
            <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              Authentic Guest Signals
            </h2>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Chronological Reviews</p>
        </div>

        <div className={`relative z-10 ${!showAllReviews ? 'max-h-[500px]' : ''} overflow-y-auto pr-2 no-scrollbar transition-all duration-500`}>
          {guestReviews.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(showAllReviews ? guestReviews : guestReviews.slice(0, 4)).map((review, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={review.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all duration-300 group/review flex gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center flex-none overflow-hidden shadow-inner">
                    {review.reviewer_avatar ? (
                      <img src={review.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="UserIcon" size={16} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-white text-sm truncate pr-2">{review.reviewer_name}</p>
                      <span className="text-[9px] text-zinc-500 font-bold whitespace-nowrap">
                        {new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Icon
                          key={s}
                          name="StarIcon"
                          size={12}
                          className={s <= review.rating ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-zinc-700'}
                        />
                      ))}
                      <span className="text-[10px] text-zinc-400 font-bold ml-1.5">{review.rating}.0</span>
                    </div>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1.5 truncate">
                      {review.property_name}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">"{review.comment}"</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {guestReviews.length > 4 && (
              <div className="flex justify-center mt-8 pb-2">
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="group/btn relative px-8 py-3 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-2xl transition-all duration-300 flex items-center gap-3 overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative z-10 text-xs font-black uppercase tracking-[0.2em] text-zinc-400 group-hover/btn:text-amber-400">
                    {showAllReviews ? 'Show Fewer Signals' : `Show All ${guestReviews.length} Signals`}
                  </span>
                  <div className={`relative z-10 transition-transform duration-500 ${showAllReviews ? 'rotate-180' : ''}`}>
                    <Icon name="ChevronDownIcon" size={14} className="text-amber-500/50 group-hover/btn:text-amber-400" />
                  </div>
                </button>
              </div>
            )}
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
              <Icon name="FaceSmileIcon" size={40} className="text-zinc-500 mb-4" />
              <p className="text-sm font-bold text-zinc-300">No signals detected</p>
              <p className="text-xs text-zinc-500 mt-1">Guest reviews will populate after completed stays.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Market & Optimization Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Optimization AI */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden group flex flex-col">
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-inner">
                <Icon name="SparklesIcon" size={20} className="text-purple-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Drawbacks & Fixes
              </h2>
            </div>
          </div>

          <div className="relative z-10 space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {auraScores.length > 0 || generatingIds.size > 0 ? (
              <>
                {/* 1. Show properties currently being analyzed */}
                {properties.filter(p => generatingIds.has(p.id)).map((prop) => (
                  <motion.div
                    key={`gen-${prop.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 rounded-3xl bg-white/[0.02] border border-dashed border-purple-500/30 flex flex-col items-center justify-center py-8"
                  >
                    <Icon name="ArrowPathIcon" size={24} className="text-purple-400 animate-spin mb-3" />
                    <h3 className="font-bold text-sm text-zinc-300 mb-1 line-clamp-1">{prop.name || prop.title}</h3>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] animate-pulse">AI Analysis in Progress...</p>
                  </motion.div>
                ))}

                {/* 2. Show properties that failed analysis */}
                {properties.filter(p => failedIds.has(p.id) && !generatingIds.has(p.id)).map((prop) => (
                  <motion.div
                    key={`fail-${prop.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 rounded-3xl bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center py-6"
                  >
                    <Icon name="ExclamationTriangleIcon" size={24} className="text-red-500 mb-2 opacity-60" />
                    <h3 className="font-bold text-sm text-zinc-300 mb-1 line-clamp-1">{prop.name || prop.title}</h3>
                    <p className="text-[10px] font-black text-red-500/70 uppercase tracking-[0.1em] mb-4 text-center px-4">Analysis Interrupted</p>
                    <button 
                      onClick={() => triggerOptimizationGeneration([prop])}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Retry Analysis
                    </button>
                  </motion.div>
                ))}

                {/* 2. Show completed scores */}
                {auraScores.map((aura, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={aura.id}
                    className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 shadow-lg group/item relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-base text-white">{aura.property_name}</h3>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-xl shadow-inner">
                        <Icon name="BoltIcon" size={14} className="text-purple-400" />
                        <span className="text-sm font-black text-purple-400">{aura.overall_score}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {aura.optimization_tips?.map((tip, index) => (
                        <div key={index} className="flex gap-2.5 items-start">
                          <div className="mt-0.5 p-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                            <Icon name="ChevronRightIcon" size={10} className="text-zinc-500" />
                          </div>
                          <p className="text-xs text-zinc-400 leading-snug font-medium">{tip}</p>
                        </div>
                      ))}
                    </div>

                    {aura.ranking_improvement && (
                      <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-success/10 to-transparent border border-success/20 flex items-center gap-3">
                        <Icon name="ArrowTrendingUpIcon" size={16} className="text-success" />
                        <p className="text-[10px] font-bold text-success uppercase tracking-widest">{aura.ranking_improvement}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60 py-10">
                <Icon name="DocumentMagnifyingGlassIcon" size={32} className="text-zinc-500 mb-3" />
                <p className="text-sm font-bold text-zinc-400 text-center px-6">
                  {properties.length > 0 
                    ? "Initializing deep property analysis... Drawbacks will appear shortly." 
                    : "No properties found. Add a property to generate performance insights."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Market Comparison */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden group flex flex-col">
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                <Icon name="PresentationChartLineIcon" size={20} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Market Pulse
              </h2>
            </div>
          </div>

          <div className="relative z-10 space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {marketComparisons.length > 0 ? (
              marketComparisons.map((comparison, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={comparison.id}
                  className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 shadow-lg relative overflow-hidden"
                >
                  <h3 className="font-bold text-base text-white mb-5">{comparison.property_name}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Your Price</p>
                      <p className="text-xl font-heading font-black text-white font-mono tracking-tight">₹{comparison.your_price?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Local Average</p>
                      <p className="text-xl font-heading font-black text-zinc-400 font-mono tracking-tight">₹{comparison.average_local_price?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0a0a0f]/50 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Icon name="LightBulbIcon" size={12} className="text-success" />
                        Suggested Optimal
                      </p>
                      <p className="text-2xl font-heading font-black text-success font-mono tracking-tight drop-shadow-sm">
                        ₹{comparison.suggested_price?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-success/10 hover:bg-success/20 text-success border border-success/30 hover:border-success/50 transition-colors uppercase tracking-widest text-[10px] font-black rounded-xl">
                      Apply
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <p className="text-sm font-bold text-zinc-400">Market data synchronization pending.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuraQualityScore;
