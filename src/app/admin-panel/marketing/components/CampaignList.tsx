'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Campaign } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Activity, Wallet, TrendingUp, Target, Calendar } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  icon: any;
  glow: string;
  border: string;
  iconColor: string;
  blobColor: string;
  subtitle?: string;
}

const KpiCard = ({ title, value, icon: IconComponent, glow, border, iconColor, blobColor, subtitle }: KpiCardProps) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    className="relative group overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl p-5 md:p-6 transition-all duration-500 cursor-pointer"
    style={{ border: `1px solid ${border}` }}
  >
    {/* Glow on hover */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"
      style={{ boxShadow: `inset 0 0 40px ${glow}` }}
    />
    {/* Blob */}
    <div
      className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
      style={{ backgroundColor: blobColor }}
    />
    {/* Bottom accent */}
    <div
      className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: `linear-gradient(to right, transparent, ${glow}, transparent)` }}
    />

    <div className="relative z-10 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-xl border backdrop-blur-sm group-hover:scale-110 transition-transform duration-300"
          style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <IconComponent size={20} className={iconColor} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1.5">{title}</p>
        <h3 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight leading-none">
          {value}
        </h3>
        {subtitle && <p className="text-[10px] text-zinc-600 mt-2 font-medium">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

interface CampaignListProps {
  initialCampaigns: Campaign[];
}

const CampaignList = ({ initialCampaigns }: CampaignListProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCampaigns((prev) => [...prev, payload.new as Campaign]);
        } else if (payload.eventType === 'UPDATE') {
          setCampaigns((prev) =>
            prev.map((c) => (c.id === payload.new.id ? (payload.new as Campaign) : c))
          );
        } else if (payload.eventType === 'DELETE') {
          setCampaigns((prev) => prev.filter((c) => c.id !== (payload.old as Campaign).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === 'active').length;
    const budget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
    const spend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
    const conversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
    return { total, active, budget, spend, conversions };
  }, [campaigns]);

  const kpiCards: KpiCardProps[] = [
    {
      title: 'Total Campaigns',
      value: String(stats.total),
      icon: Megaphone,
      glow: 'rgba(99,102,241,0.35)',
      border: 'rgba(99,102,241,0.25)',
      iconColor: 'text-indigo-400',
      blobColor: 'rgba(99,102,241,0.5)',
      subtitle: 'Across all channels',
    },
    {
      title: 'Active Now',
      value: String(stats.active),
      icon: Activity,
      glow: 'rgba(16,185,129,0.35)',
      border: 'rgba(16,185,129,0.25)',
      iconColor: 'text-emerald-400',
      blobColor: 'rgba(16,185,129,0.5)',
      subtitle: 'Currently running',
    },
    {
      title: 'Total Budget',
      value: `₹${stats.budget.toLocaleString('en-IN')}`,
      icon: Wallet,
      glow: 'rgba(234,179,8,0.35)',
      border: 'rgba(234,179,8,0.25)',
      iconColor: 'text-amber-400',
      blobColor: 'rgba(234,179,8,0.5)',
      subtitle: 'Allocated resources',
    },
    {
      title: 'Total Spend',
      value: `₹${stats.spend.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      glow: 'rgba(239,68,68,0.35)',
      border: 'rgba(239,68,68,0.25)',
      iconColor: 'text-rose-400',
      blobColor: 'rgba(239,68,68,0.5)',
      subtitle: 'Resource utilization',
    },
    {
      title: 'Conversions',
      value: stats.conversions.toLocaleString(),
      icon: Target,
      glow: 'rgba(147,51,234,0.35)',
      border: 'rgba(147,51,234,0.25)',
      iconColor: 'text-purple-400',
      blobColor: 'rgba(147,51,234,0.5)',
      subtitle: 'Successful actions',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
          >
            <KpiCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* ── Campaigns Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/8"
      >
        <div className="p-5 md:p-6 border-b border-white/8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Marketing Hub</p>
            <h2 className="text-xl font-heading font-black text-white">Campaigns Overview</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Live View</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Campaign', 'Status', 'Duration', 'Budget', 'Spend', 'Conversions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-600">
                        <Megaphone size={36} />
                        <p className="text-sm font-medium">No active campaigns found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign, i) => (
                    <motion.tr
                      key={campaign.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-200 group"
                    >
                      {/* Campaign Name & Type */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{campaign.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 bg-white/5 w-fit px-2 py-0.5 rounded">
                          {campaign.type}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <Badge
                          className={`
                            px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${campaign.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}
                          `}
                        >
                          <span className={`w-1 h-1 rounded-full mr-1.5 ${campaign.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
                          {campaign.status}
                        </Badge>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Calendar size={14} className="text-zinc-600" />
                          <span>
                            {campaign.start_date ? format(new Date(campaign.start_date), 'MMM d') : '-'}
                            {' → '}
                            {campaign.end_date ? format(new Date(campaign.end_date), 'MMM d, yyyy') : 'Ongoing'}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">
                          ₹{campaign.budget?.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Spend */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-zinc-300">
                          ₹{campaign.spend?.toLocaleString('en-IN')}
                        </div>
                        {campaign.budget && campaign.spend && (
                          <div className="mt-1.5 w-24 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500"
                              style={{ width: `${Math.min((campaign.spend / campaign.budget) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Conversions */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-white tracking-tight">
                          {campaign.conversions?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-zinc-600 font-bold uppercase">Actions</div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {campaigns.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-xs text-zinc-600 font-medium">
              Showing <span className="text-zinc-400">{campaigns.length}</span> marketing campaigns
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
              Market Intelligence <Icon name="ShieldCheckIcon" size={14} className="text-emerald-500" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CampaignList;
