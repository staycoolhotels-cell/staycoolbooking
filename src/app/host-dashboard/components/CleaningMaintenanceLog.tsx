'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertPriority,
} from '../types';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

export interface MaintenanceAlertData {
  id: string;
  property_id: string;
  property_name?: string;
  issue: string;
  reported_by: string;
  reported_date: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Completed' | string;
  priority: AlertPriority | string;
  created_at: string;
}

export interface CleaningChecklistItemData {
  id: string;
  checklist_id: string;
  task: string;
  completed: boolean;
}

export interface CleaningChecklistData {
  id: string;
  property_id: string;
  property_name?: string;
  date: string;
  assigned_to: string;
  status: 'Pending' | 'In Progress' | 'Completed' | string;
  items: CleaningChecklistItemData[];
}

interface CleaningMaintenanceLogProps {
  properties?: Property[];
}

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'Urgent':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]' };
    case 'High':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', glow: 'shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]' };
    case 'Medium':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', glow: '' };
    case 'Low':
    default:
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: '' };
  }
};

const CleaningMaintenanceLog: React.FC<CleaningMaintenanceLogProps> = ({ properties = [] }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [alerts, setAlerts] = useState<MaintenanceAlertData[]>([]);
  const [checklists, setChecklists] = useState<CleaningChecklistData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEFAULT_TASKS = ['Clean bathrooms', 'Change bedsheets', 'Vacuum floors', 'Empty trash'];

  const [newChecklist, setNewChecklist] = useState({
    property_id: '',
    date: new Date().toISOString().split('T')[0],
    assigned_to: '',
    tasks: [...DEFAULT_TASKS]
  });

  const propertyMap = useMemo(() => {
    return properties.reduce((acc, prop) => {
      acc[prop.id] = prop;
      return acc;
    }, {} as Record<string, Property>);
  }, [properties]);

  useEffect(() => {
    if (properties.length > 0 && !newChecklist.property_id) {
      setNewChecklist(prev => ({ ...prev, property_id: properties[0].id }));
    }
  }, [properties, newChecklist.property_id]);

  const fetchData = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      const propertyIds = properties.map(p => p.id);
      if (propertyIds.length === 0) {
        if (showLoadingState) setLoading(false);
        return;
      }

      const { data: alertsData } = await supabase
        .from('maintenance_alerts')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (alertsData) {
        const enrichedAlerts = alertsData.map((a: any) => ({
          ...a,
          property_name: propertyMap[a.property_id]?.title || propertyMap[a.property_id]?.name || 'Unknown Property'
        }));
        setAlerts(enrichedAlerts);
      }

      const { data: checklistsData } = await supabase
        .from('cleaning_checklists')
        .select('*, cleaning_checklist_items(*)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (checklistsData) {
        const enrichedChecklists = checklistsData.map((c: any) => ({
          ...c,
          property_name: propertyMap[c.property_id]?.title || propertyMap[c.property_id]?.name || 'Unknown Property',
          items: c.cleaning_checklist_items?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
        }));
        setChecklists(enrichedChecklists);
      }
    } catch (error) {
      console.error("Error fetching Maintenance data:", error);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [supabase, properties, propertyMap]);

  useEffect(() => {
    fetchData(true);

    const propertyIds = properties.map(p => p.id);
    if (propertyIds.length === 0) return;

    const channel = supabase.channel('cleaning_maintenance_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_alerts' },
        () => { fetchData(false); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cleaning_checklists' },
        () => { fetchData(false); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cleaning_checklist_items' },
        () => { fetchData(false); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [fetchData, properties, supabase]);

  const markAlertCompleted = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_alerts')
        .update({ status: 'Resolved' })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Issue marked as resolved!');
    } catch (error: any) {
      console.error('Error marking alert as completed:', error);
      toast.error('Failed to update issue status: ' + error.message);
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklist.property_id || !newChecklist.assigned_to || newChecklist.tasks.length === 0) {
      toast.error('Please fill in all fields and add at least one task.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: checklistData, error: checklistError } = await supabase
        .from('cleaning_checklists')
        .insert([{
          property_id: newChecklist.property_id,
          date: newChecklist.date,
          assigned_to: newChecklist.assigned_to,
          status: 'Pending'
        }])
        .select()
        .single();

      if (checklistError) throw checklistError;

      const itemsToInsert = newChecklist.tasks.map(task => ({
        checklist_id: checklistData.id,
        task: task,
        completed: false
      }));

      const { error: itemsError } = await supabase
        .from('cleaning_checklist_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Cleaning checklist created successfully!');
      setIsAddModalOpen(false);
      setNewChecklist(prev => ({ ...prev, assigned_to: '', tasks: [...DEFAULT_TASKS] }));
    } catch (error: any) {
      console.error('Error creating checklist:', error);
      toast.error('Failed to create checklist: ' + (error.message || 'Unknown error.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskStatus = async (checklistId: string, itemId: string, currentCompleted: boolean, checklistItems: CleaningChecklistItemData[]) => {
    const newCompletedStatus = !currentCompleted;

    const updatedItems = checklistItems.map(i => i.id === itemId ? { ...i, completed: newCompletedStatus } : i);
    const allCompleted = updatedItems.length > 0 && updatedItems.every(i => i.completed);
    const anyCompleted = updatedItems.some(i => i.completed);

    let newStatus = 'Pending';
    if (allCompleted) newStatus = 'Completed';
    else if (anyCompleted) newStatus = 'In Progress';

    setChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        return { ...c, items: updatedItems, status: newStatus };
      }
      return c;
    }));

    try {
      const { error: itemError } = await supabase
        .from('cleaning_checklist_items')
        .update({ completed: newCompletedStatus })
        .eq('id', itemId);

      if (itemError) throw itemError;

      const currentChecklist = checklists.find(c => c.id === checklistId);
      if (currentChecklist && currentChecklist.status !== newStatus) {
        await supabase
          .from('cleaning_checklists')
          .update({ status: newStatus })
          .eq('id', checklistId);
      }
    } catch (error: any) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task: ' + error.message);
    }
  };

  const removeNewTask = (indexToRemove: number) => {
    setNewChecklist(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const addNewTask = () => {
    setNewChecklist(prev => ({
      ...prev,
      tasks: [...prev.tasks, '']
    }));
  };

  const updateNewTask = (index: number, value: string) => {
    setNewChecklist(prev => {
      const updatedTasks = [...prev.tasks];
      updatedTasks[index] = value;
      return { ...prev, tasks: updatedTasks };
    });
  };

  const pendingAlertsCount = alerts.filter(a => a.status !== 'Resolved' && a.status !== 'Completed').length;
  const inProgressCleanings = checklists.filter(c => c.status === 'In Progress').length;

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <Icon name="ArrowPathIcon" size={40} className="text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Syncing Facility Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8 relative">
      {/* 1. Ultra-Premium Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5 w-full lg:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] shrink-0">
            <Icon name="WrenchScrewdriverIcon" size={32} className="text-amber-400 drop-shadow-md" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg truncate">Facility Ops</h1>
            <p className="text-xs md:text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2 truncate whitespace-nowrap">
              Cleaning & Maintenance Core
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex gap-4 flex-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex flex-col items-center justify-center shadow-inner flex-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Icon name="ExclamationTriangleIcon" size={12} className="text-amber-500" /> Action Required</p>
              <p className="text-2xl font-heading font-black text-white">{pendingAlertsCount}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex flex-col items-center justify-center shadow-inner flex-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Icon name="SparklesIcon" size={12} className="text-cyan-500" /> Ongoing Cleans</p>
              <p className="text-2xl font-heading font-black text-white">{inProgressCleanings}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] border border-amber-400/50 transition-all rounded-2xl px-6 py-4 flex items-center justify-center gap-3 font-bold"
          >
            <Icon name="ClipboardDocumentListIcon" size={20} />
            Dispatch Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* 2. Maintenance Alerts */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px] group">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-red-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 shadow-inner">
                <Icon name="ExclamationCircleIcon" size={20} className="text-red-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Maintenance Signals
              </h2>
            </div>
          </div>

          <div className="relative z-10 space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {alerts.length > 0 ? (
              alerts.map((alert, idx) => {
                const isResolved = alert.status === 'Resolved' || alert.status === 'Completed';
                const priorityStyle = getPriorityStyle(alert.priority);

                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={alert.id}
                    className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group/alert
                            ${isResolved ? 'bg-black/40 border-white/5 opacity-70' : `bg-white/[0.03] ${priorityStyle.border} ${priorityStyle.glow}`}
                          `}
                  >
                    {isResolved && <div className="absolute inset-0 bg-success/5 pointer-events-none" />}

                    <div className="flex justify-between items-start gap-4 mb-3 relative z-10">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-white text-base truncate">{alert.issue}</h3>
                          {!isResolved && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                              {alert.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                          {alert.property_name}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shrink-0 shadow-inner
                                 ${isResolved ? 'bg-success/10 border-success/20 text-success' : 'bg-white/5 border-white/10 text-zinc-400'}
                              `}>
                        {isResolved ? (
                          <><Icon name="CheckBadgeIcon" size={14} /> Resolved</>
                        ) : alert.status}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Icon name="UserIcon" size={12} className="text-zinc-500" />
                        {alert.reported_by} • {new Date(alert.reported_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      {!isResolved && (
                        <button
                          onClick={() => markAlertCompleted(alert.id)}
                          className="px-3 py-1.5 rounded-xl bg-success/20 hover:bg-success/30 border border-success/30 text-success text-[10px] font-bold uppercase tracking-widest transition-all shadow-inner flex items-center gap-1.5 group-hover/alert:border-success/50"
                        >
                          <Icon name="CheckIcon" size={12} /> Mark Fixed
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <Icon name="ShieldCheckIcon" size={40} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">All Systems Operational</p>
                <p className="text-xs text-zinc-500 mt-1">No active maintenance signals found.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Cleaning Checklists */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px] group">
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-inner">
                <Icon name="SparklesIcon" size={20} className="text-cyan-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Operating Checklists
              </h2>
            </div>
          </div>

          <div className="relative z-10 space-y-5 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {checklists.length > 0 ? (
              checklists.map((checklist, idx) => {
                const isCompleted = checklist.status === 'Completed';
                const progress = checklist.items.length > 0 ? Math.round((checklist.items.filter(i => i.completed).length / checklist.items.length) * 100) : 0;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={checklist.id}
                    className={`rounded-3xl border transition-all duration-300 overflow-hidden group/list
                             ${isCompleted ? 'bg-black/40 border-white/5 opacity-80' : 'bg-white/[0.02] border-white/10 hover:border-cyan-500/30'}
                          `}
                  >
                    <div className={`p-5 border-b transition-colors ${isCompleted ? 'border-white/5' : 'border-white/10 group-hover/list:border-cyan-500/20'}`}>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-white text-base truncate">{checklist.property_name}</h3>
                            {isCompleted && <span className="text-[10px] font-bold text-success uppercase tracking-widest"><Icon name="CheckBadgeIcon" size={14} className="inline mr-1 -mt-0.5" />Done</span>}
                          </div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <span>Team: <span className="text-cyan-500 group-hover/list:text-cyan-400">{checklist.assigned_to}</span></span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>{new Date(checklist.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </p>
                        </div>
                        {!isCompleted && (
                          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-cyan-500/30 bg-cyan-500/10 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
                            <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-tighter">{progress}%</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {!isCompleted && (
                        <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className={`p-2 space-y-1 ${isCompleted ? 'bg-transparent' : 'bg-black/20'}`}>
                      {checklist.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleTaskStatus(checklist.id, item.id, item.completed, checklist.items)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left
                                   ${item.completed ? 'opacity-50 hover:opacity-100 hover:bg-white/5' : 'hover:bg-cyan-500/10 group/item'}
                                `}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
                                   ${item.completed ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-black/20 border-white/20 group-hover/item:border-cyan-400 group-hover/item:bg-cyan-500/10'}
                                `}>
                            {item.completed && <Icon name="CheckIcon" size={12} strokeWidth={3} />}
                          </div>
                          <span className={`text-sm font-medium transition-all ${item.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                            {item.task}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <Icon name="ClipboardDocumentCheckIcon" size={40} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">No Operations Scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Create Checklist Modal - Ultra Premium */}
      <AnimatePresence>
        {isAddModalOpen && (
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
              className="bg-[#0a0a0f] rounded-[2rem] w-full max-w-lg border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative my-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

              <div className="p-6 md:p-8 flex flex-col items-center border-b border-white/5 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-[50px] pointer-events-none" />
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-4 text-amber-400 shadow-inner relative z-10">
                  <Icon name="ClipboardDocumentListIcon" size={32} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white relative z-10">Dispatch Operation</h2>
                <p className="text-xs text-zinc-400 mt-2 font-medium relative z-10 text-center px-4">Generate and assign a dynamic task payload for facility personnel.</p>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-20"
                >
                  <Icon name="XMarkIcon" size={16} />
                </button>
              </div>

              <form id="createChecklistForm" onSubmit={handleCreateChecklist} className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Target Estate</label>
                    <div className="relative">
                      <select
                        required
                        value={newChecklist.property_id}
                        onChange={(e) => setNewChecklist({ ...newChecklist, property_id: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none appearance-none font-medium text-sm"
                      >
                        <option value="" disabled className="bg-black text-zinc-500">Select target estate...</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                            {p.title || p.name || 'Unnamed Property'}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <Icon name="ChevronDownIcon" size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Execution Date</label>
                      <input
                        type="date"
                        required
                        value={newChecklist.date}
                        onChange={(e) => setNewChecklist({ ...newChecklist, date: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none font-medium text-sm [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">Assignee</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Echo Team"
                        value={newChecklist.assigned_to}
                        onChange={(e) => setNewChecklist({ ...newChecklist, assigned_to: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none font-medium text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Task Manifest</label>
                      <button
                        type="button"
                        onClick={addNewTask}
                        className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
                      >
                        <Icon name="PlusIcon" size={12} strokeWidth={3} /> Append Line
                      </button>
                    </div>

                    <div className="space-y-3">
                      <AnimatePresence>
                        {newChecklist.tasks.map((task, index) => (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            key={index}
                            className="flex items-center gap-3 relative group/input"
                          >
                            <div className="w-6 py-3.5 flex items-center justify-center shrink-0">
                              <div className="w-3 h-3 rounded-sm border-2 border-zinc-600 group-focus-within/input:border-amber-500 transition-colors" />
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Execute parameter..."
                              value={task}
                              onChange={(e) => updateNewTask(index, e.target.value)}
                              className="flex-1 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none font-medium text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewTask(index)}
                              disabled={newChecklist.tasks.length === 1}
                              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-red-500/5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-30 disabled:hover:text-red-400/50 disabled:hover:bg-red-500/5 disabled:hover:border-transparent"
                            >
                              <Icon name="TrashIcon" size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </form>

              <div className="flex gap-4 p-6 md:p-8 border-t border-white/5 bg-black/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Abort
                </button>
                <button
                  type="submit"
                  form="createChecklistForm"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="ArrowPathIcon" size={16} className="animate-spin" /> Transmitting
                    </>
                  ) : (
                    <>
                      Deploy Tasks <Icon name="PaperAirplaneIcon" size={16} className="hidden sm:block" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CleaningMaintenanceLog;
