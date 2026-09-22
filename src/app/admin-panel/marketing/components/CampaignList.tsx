'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Campaign } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Activity, Wallet, TrendingUp, Target, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { createCampaign, updateCampaign, deleteCampaign } from '@/lib/marketing-actions';
import { toast } from 'sonner';
import ActionConfirmModal from '@/components/ui/ActionConfirmModal';
import { DatePicker } from '@/components/ui/datepicker';


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
    className="relative group overflow-hidden rounded-xl md:rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl p-3.5 md:p-6 transition-all duration-500 cursor-pointer"
    style={{ border: `1px solid ${border}` }}
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl md:rounded-2xl"
      style={{ boxShadow: `inset 0 0 40px ${glow}` }}
    />
    <div
      className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
      style={{ backgroundColor: blobColor }}
    />
    <div
      className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: `linear-gradient(to right, transparent, ${glow}, transparent)` }}
    />

    <div className="relative z-10 flex flex-col gap-2 md:gap-4">
      <div className="flex items-start justify-between">
        <div
          className="p-2 md:p-2.5 rounded-lg md:rounded-xl border backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 flex items-center justify-center"
          style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <IconComponent className={`w-4 h-4 md:w-5 md:h-5 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider md:tracking-[0.2em] mb-1 md:mb-1.5 truncate">{title}</p>
        <h3 className="text-lg md:text-3xl font-heading font-black text-white tracking-tight leading-none truncate">
          {value}
        </h3>
        {subtitle && <p className="text-[9px] md:text-[10px] text-zinc-600 mt-1 md:mt-2 font-medium truncate">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

interface CampaignListProps {
  initialCampaigns: Campaign[];
}

const CampaignList = ({ initialCampaigns }: CampaignListProps) => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    type: 'social_media',
    status: 'draft',
    budget: 0,
    spend: 0,
    conversions: 0,
    start_date: '',
    end_date: ''
  });
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);


  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCampaigns((prev) => [...prev.filter(c => c.id !== payload.new.id), payload.new as Campaign]);
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

  const openModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name || '',
        type: campaign.type || 'social_media',
        status: campaign.status || 'draft',
        budget: campaign.budget || 0,
        spend: campaign.spend || 0,
        conversions: campaign.conversions || 0,
        start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
        end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        name: '',
        type: 'social_media',
        status: 'draft',
        budget: 0,
        spend: 0,
        conversions: 0,
        start_date: '',
        end_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget),
        spend: Number(formData.spend),
        conversions: Number(formData.conversions)
      };

      if (!payload.start_date) delete payload.start_date;
      if (!payload.end_date) delete payload.end_date;

      if (editingCampaign) {
        const { success, error, data } = await updateCampaign(editingCampaign.id, payload as any);
        if (success) {
          toast.success('Campaign updated');
          setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? data : c));
          router.refresh();
        } else {
          toast.error(error || 'Failed to update');
        }
      } else {
        const { success, error, data } = await createCampaign(payload as any);
        if (success) {
          toast.success('Campaign created');
          if (data) setCampaigns(prev => [data, ...prev]);
          router.refresh();
        } else {
          toast.error(error || 'Failed to create');
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { success, error } = await deleteCampaign(id);
    if (success) {
      toast.success('Campaign deleted');
      setCampaigns(prev => prev.filter(c => c.id !== id));
      router.refresh();
    } else {
      toast.error(error || 'Failed to delete');
    }
  };


  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-5">
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
        <div className="p-5 md:p-6 border-b border-white/8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Marketing Hub</p>
            <h2 className="text-xl font-heading font-black text-white">Campaigns Overview</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-indigo-500/10 px-3 py-2 rounded-xl border border-indigo-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Live View</span>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl hover:bg-zinc-200 transition text-sm font-bold"
            >
              <Plus size={16} /> Add Campaign
            </button>
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3 p-4">
          <AnimatePresence>
            {campaigns.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 text-zinc-600">
                <Megaphone size={36} />
                <p className="text-sm font-medium">No campaigns found</p>
                <button onClick={() => openModal()} className="mt-2 text-indigo-400 hover:text-indigo-300 transition underline text-sm">Create one now</button>
              </div>
            ) : (
              campaigns.map((campaign, i) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                  className="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors rounded-xl p-4 flex flex-col gap-3 group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">{campaign.name}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 bg-white/5 w-fit px-2 py-0.5 rounded">
                        {campaign.type}
                      </div>
                    </div>
                    <Badge
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider h-fit ${
                        campaign.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}
                    >
                      <span className={`inline-block w-1 h-1 rounded-full mr-1.5 ${campaign.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
                      {campaign.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Calendar size={14} className="text-zinc-600" />
                    <span>
                      {campaign.start_date ? format(new Date(campaign.start_date), 'MMM d') : '-'}
                      {' → '}
                      {campaign.end_date ? format(new Date(campaign.end_date), 'MMM d, yy') : 'Ongoing'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                       <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Budget</div>
                       <div className="text-sm font-bold text-white">₹{campaign.budget?.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                       <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Spend</div>
                       <div className="text-sm font-bold text-zinc-300">₹{campaign.spend?.toLocaleString('en-IN')}</div>
                       {campaign.budget && campaign.spend ? (
                          <div className="mt-1 w-full h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full ${(campaign.spend / campaign.budget) > 0.9 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                              style={{ width: `${Math.min((campaign.spend / campaign.budget) * 100, 100)}%` }}
                            />
                          </div>
                        ) : null}
                    </div>
                    <div>
                       <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Conv.</div>
                       <div className="text-sm font-black text-white">{campaign.conversions?.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 mt-1 flex justify-end gap-2">
                    <button onClick={() => openModal(campaign)} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition flex items-center justify-center">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setCampaignToDelete(campaign.id)} className="p-2 text-zinc-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>

                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Campaign', 'Status', 'Duration', 'Budget', 'Spend', 'Conversions', 'Actions'].map((h) => (
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
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-600">
                        <Megaphone size={36} />
                        <p className="text-sm font-medium">No campaigns found</p>
                        <button onClick={() => openModal()} className="mt-2 text-indigo-400 hover:text-indigo-300 transition underline text-sm">Create one now</button>
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
                          <span className={`inline-block w-1 h-1 rounded-full mr-1.5 ${campaign.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
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
                            {campaign.end_date ? format(new Date(campaign.end_date), 'MMM d, yy') : 'Ongoing'}
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
                        {campaign.budget && campaign.spend ? (
                          <div className="mt-1.5 w-24 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full ${(campaign.spend / campaign.budget) > 0.9 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                              style={{ width: `${Math.min((campaign.spend / campaign.budget) * 100, 100)}%` }}
                            />
                          </div>
                        ) : null}
                      </td>

                      {/* Conversions */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-white tracking-tight">
                          {campaign.conversions?.toLocaleString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(campaign)} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition flex items-center justify-center">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setCampaignToDelete(campaign.id)} className="p-2 text-zinc-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition flex items-center justify-center">
                            <Trash2 size={14} />
                          </button>

                        </div>
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

      {/* ── Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-heading font-black text-white">
                  {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="campaign-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Campaign Name</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Summer Promo 2026"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Type</label>
                      <select
                        style={{ colorScheme: 'dark' }}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition appearance-none [&>option]:bg-[#050505] [&>option]:text-white"
                        value={formData.type || 'email'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      >
                        <option value="email" className="bg-[#050505] text-white">Email</option>
                        <option value="social_media" className="bg-[#050505] text-white">Social Media</option>
                        <option value="promo_code" className="bg-[#050505] text-white">Promo Code</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</label>
                      <select
                        style={{ colorScheme: 'dark' }}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition appearance-none [&>option]:bg-[#050505] [&>option]:text-white"
                        value={formData.status || 'draft'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option value="draft" className="bg-[#050505] text-white">Draft</option>
                        <option value="scheduled" className="bg-[#050505] text-white">Scheduled</option>
                        <option value="active" className="bg-[#050505] text-white">Active</option>
                        <option value="paused" className="bg-[#050505] text-white">Paused</option>
                        <option value="completed" className="bg-[#050505] text-white">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Start Date</label>
                      <DatePicker
                        value={formData.start_date}
                        onChange={(date) => setFormData({ ...formData, start_date: date })}
                        placeholder="Select start date"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">End Date</label>
                      <DatePicker
                        value={formData.end_date}
                        onChange={(date) => setFormData({ ...formData, end_date: date })}
                        placeholder="Select end date"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Budget (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                        value={formData.budget || ''}
                        onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Spend (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                        value={formData.spend || ''}
                        onChange={(e) => setFormData({ ...formData, spend: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Conversions</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                        value={formData.conversions || ''}
                        onChange={(e) => setFormData({ ...formData, conversions: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  form="campaign-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition font-bold text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCampaign ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ActionConfirmModal
        isOpen={!!campaignToDelete}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={() => {
          if (campaignToDelete) handleDelete(campaignToDelete);
          setCampaignToDelete(null);
        }}
        title="Delete Campaign?"
        description="Are you sure you want to delete this marketing campaign? All performance data and configuration will be permanently removed."
        confirmLabel="Delete Campaign"
        variant="danger"
      />
    </div>

  );
};

export default CampaignList;
