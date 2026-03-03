import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertPriority,
} from '../types';
import { Wrench, CheckSquare, ListTodo, AlertTriangle, CheckCircle2, Plus, X, Trash2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Property } from '@/lib/types';

// Extended types for Database structure
export interface MaintenanceAlertData {
  id: string;
  property_id: string;
  property_name?: string;
  issue: string;
  reported_by: string;
  reported_date: string;
  status: 'New' | 'In Progress' | 'Resolved' | string;
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

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-500';
    case 'High':
      return 'bg-orange-500';
    case 'Medium':
      return 'bg-yellow-500';
    case 'Low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusColor = (
  status: string
): string => {
  switch (status) {
    case 'New':
      return 'bg-blue-500';
    case 'In Progress':
      return 'bg-yellow-500';
    case 'Resolved':
    case 'Completed':
      return 'bg-green-500';
    case 'Pending':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
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

  // Default tasks for a new checklist
  const DEFAULT_TASKS = ['Clean bathrooms', 'Change bedsheets', 'Vacuum floors', 'Empty trash'];

  const [newChecklist, setNewChecklist] = useState({
    property_id: '',
    date: new Date().toISOString().split('T')[0],
    assigned_to: '',
    tasks: [...DEFAULT_TASKS]
  });

  // Memoize property map for quick lookups
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

      // 1. Fetch Maintenance Alerts
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

      // 2. Fetch Cleaning Checklists
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

    // Set up Realtime Subscriptions
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
        .update({ status: 'Completed' })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Issue marked as completed!');
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
      // 1. Create the checklist
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

      // 2. Create the checklist items
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
      console.error('Error creating checklist:', JSON.stringify(error, null, 2));
      console.error('Full Error Object:', error);
      toast.error('Failed to create checklist: ' + (error.message || 'Unknown error. Check console for details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskStatus = async (checklistId: string, itemId: string, currentCompleted: boolean, checklistItems: CleaningChecklistItemData[]) => {
    const newCompletedStatus = !currentCompleted;

    // Compute new status optimistically
    const updatedItems = checklistItems.map(i => i.id === itemId ? { ...i, completed: newCompletedStatus } : i);
    const allCompleted = updatedItems.length > 0 && updatedItems.every(i => i.completed);
    const anyCompleted = updatedItems.some(i => i.completed);

    let newStatus = 'Pending';
    if (allCompleted) newStatus = 'Completed';
    else if (anyCompleted) newStatus = 'In Progress';

    // Optimistic UI update
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

      // Only update the checklist status if it has changed from what we knew
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
      // Realtime will resync the UI shortly if it fails
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

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Cleaning & Maintenance Log</h1>

      {loading ? (
        <div className="text-white/50 animate-pulse">Loading Logs...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Maintenance Alerts</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{alert.issue}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${getPriorityColor(alert.priority)}`}
                      >
                        <AlertTriangle size={12} className="inline-block mr-1" /> {alert.priority}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">Property: {alert.property_name}</p>
                    <p suppressHydrationWarning className="text-xs text-zinc-500">
                      Reported by: {alert.reported_by} on {new Date(alert.reported_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${getStatusColor(alert.status)}`}
                      >
                        {alert.status}
                      </span>
                      {alert.status !== 'Completed' && alert.status !== 'Resolved' && (
                        <button
                          onClick={() => markAlertCompleted(alert.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20"
                        >
                          <CheckCircle2 size={14} />
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-sm italic">No maintenance alerts reported recently.</p>
              )}
            </div>
          </div>

          {/* Cleaning Checklists */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Cleaning Checklists</h2>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20"
              >
                <Plus size={14} />
                Create Checklist
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 flex-grow">
              {checklists.length > 0 ? (
                checklists.map((checklist) => (
                  <div key={checklist.id} className="p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative group overflow-hidden">
                    {checklist.status === 'Completed' && (
                      <div className="absolute inset-0 bg-green-500/5 rounded-xl pointer-events-none" />
                    )}
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <h3 className="font-semibold text-white">{checklist.property_name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${getStatusColor(checklist.status)}`}
                      >
                        {checklist.status}
                      </span>
                    </div>
                    <p suppressHydrationWarning className="text-xs text-zinc-500 mb-4 border-b border-white/5 pb-2 relative z-10">
                      Assigned to: <span className="text-sky-400">{checklist.assigned_to}</span> | Date: {new Date(checklist.date).toLocaleDateString()}
                    </p>
                    <div className="space-y-2 relative z-10">
                      {checklist.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleTaskStatus(checklist.id, item.id, item.completed, checklist.items)}
                          className={`w-full flex items-start text-left text-sm p-2 rounded-lg transition-colors hover:bg-white/5 ${item.completed ? 'text-zinc-500' : 'text-zinc-200'}`}
                        >
                          <CheckSquare size={16} className={`mr-3 mt-0.5 flex-shrink-0 transition-colors ${item.completed ? 'text-green-500' : 'text-zinc-600'}`} />
                          <span className={`${item.completed ? 'line-through' : ''} transition-all`}>{item.task}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ListTodo className="text-white/20 w-12 h-12 mb-3" />
                  <p className="text-white/50 text-sm">No cleaning checklists scheduled.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Checklist Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Create Cleaning Checklist</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form id="createChecklistForm" onSubmit={handleCreateChecklist} className="p-5 overflow-y-auto flex-grow">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Property</label>
                  <select
                    required
                    value={newChecklist.property_id}
                    onChange={(e) => setNewChecklist({ ...newChecklist, property_id: e.target.value })}
                    className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                    style={{ backgroundColor: '#18181b', color: '#ffffff' }}
                  >
                    <option value="" disabled style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Select a property...</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id} style={{ backgroundColor: '#18181b', color: '#ffffff' }}>
                        {p.title || p.name || 'Unnamed Property'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newChecklist.date}
                      onChange={(e) => setNewChecklist({ ...newChecklist, date: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Assigned To</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Cleaner"
                      value={newChecklist.assigned_to}
                      onChange={(e) => setNewChecklist({ ...newChecklist, assigned_to: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-white/70">Tasks</label>
                    <button
                      type="button"
                      onClick={addNewTask}
                      className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Task
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newChecklist.tasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Task description"
                          value={task}
                          onChange={(e) => updateNewTask(index, e.target.value)}
                          className="flex-grow bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewTask(index)}
                          className="text-white/30 hover:text-red-400 p-2 transition-colors disabled:opacity-50"
                          disabled={newChecklist.tasks.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-white/10 flex justify-end gap-3 mt-auto bg-black/20">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="createChecklistForm"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-400 text-black rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Checklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningMaintenanceLog;
