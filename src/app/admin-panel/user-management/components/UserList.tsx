'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { approveHost, suspendUserAsAdmin, autoApproveGuest, deleteUserAsAdmin } from '@/lib/admin-actions';
import { Search, X, Star, Users, ShieldCheck, Clock, UserX } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/datepicker';
import { toast } from 'sonner';
import RejectHostDialog from './RejectHostDialog';
import { motion, AnimatePresence } from 'framer-motion';
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
  onClick?: () => void;
  active?: boolean;
}

const KpiCard = ({ title, value, icon: IconComponent, glow, border, iconColor, blobColor, subtitle, onClick, active }: KpiCardProps) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative group overflow-hidden rounded-xl md:rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl p-3.5 md:p-6 transition-all duration-500 cursor-pointer border ${
      active ? 'ring-2 ring-white/20' : ''
    }`}
    style={{ borderColor: active ? glow : border, boxShadow: active ? `0 0 20px ${glow}` : 'none' }}
  >
    {/* Glow on hover or if active */}
    <div
      className={`absolute inset-0 transition-opacity duration-700 rounded-xl md:rounded-2xl ${active ? 'opacity-40' : 'opacity-0 group-hover:opacity-100'}`}
      style={{ boxShadow: `inset 0 0 40px ${glow}` }}
    />
    {/* Blob */}
    <div
      className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
      style={{ backgroundColor: blobColor }}
    />
    {/* Bottom accent */}
    <div
      className={`absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
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

interface UserListProps {
  initialUsers: User[];
}

const UserList = ({ initialUsers }: UserListProps) => {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPremiumSearch, setIsPremiumSearch] = useState(false);
  const [sortBy, setSortBy] = useState('created_at-desc');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUserForReject, setSelectedUserForReject] = useState<{ id: string; name: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'approve_guest' | 'approve_host' | 'suspend' | 'delete';
    userId: string;
    userName: string;
  } | null>(null);

  const handleConfirmSubmit = async () => {
    if (!confirmAction) return;
    const { type, userId } = confirmAction;
    
    // Close modal first
    setConfirmAction(null);
    setEditingUserId(null);

    if (type === 'approve_host') {
      await handleApproveHost(userId);
    } else if (type === 'approve_guest') {
      await handleAutoApproveGuest(userId);
    } else if (type === 'suspend') {
      await handleSuspendUser(userId);
    } else if (type === 'delete') {
      await handleDeleteUser(userId);
    }
  };

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setMounted(true);
    const channel = supabase
      .channel('realtime-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers((prev) => [...prev, payload.new as User]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers((prev) =>
            prev.map((u) => (u.id === payload.new.id ? (payload.new as User) : u))
          );
        } else if (payload.eventType === 'DELETE') {
          setUsers((prev) => prev.filter((u) => u.id !== (payload.old as User).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApproveHost = async (userId: string) => {
    const { success, error } = await approveHost(userId);
    if (error) {
      toast.error('Failed to approve host.');
      return;
    }
    if (success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
      );
      toast.success('Host approved successfully.');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const { success, error } = await suspendUserAsAdmin(userId);
    if (error) {
      toast.error('Failed to suspend user.');
      return;
    }
    if (success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'suspended' } : u))
      );
      toast.success('User suspended successfully.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const { success, error } = await deleteUserAsAdmin(userId);
    if (error || !success) {
      toast.error(error || 'Failed to delete user.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success('User deleted successfully.');
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(editingUserId === user.id ? null : user.id);
  };

  const handleRejectClick = (user: User) => {
    setSelectedUserForReject({ id: user.id, name: user.name });
    setRejectDialogOpen(true);
  };

  const handleRejectSuccess = () => {
    if (selectedUserForReject) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserForReject.id ? { ...u, status: 'rejected' } : u))
      );
    }
    setEditingUserId(null);
  };

  const handleAutoApproveGuest = async (userId: string) => {
    const { success, error } = await autoApproveGuest(userId);
    if (error) {
      toast.error('Failed to auto-approve guest.');
      return;
    }
    if (success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
      );
      toast.success('Guest auto-approved successfully.');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((user) => user.status === 'active' || user.status === 'approved_host');
      } else {
        filtered = filtered.filter((user) => user.status === statusFilter);
      }
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (isPremiumSearch && dateRange.from && dateRange.to) {
      filtered = filtered.filter((user) => {
        const userDate = parseISO(user.created_at);
        return userDate >= dateRange.from! && userDate <= dateRange.to!;
      });
    }

    const [field, direction] = sortBy.split('-');
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[field as keyof User];
      const bValue = b[field as keyof User];
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [users, roleFilter, statusFilter, searchTerm, isPremiumSearch, dateRange, sortBy]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      activeHosts: users.filter(u => u.role === 'host' && (u.status === 'active' || u.status === 'approved_host')).length,
      pendingApprovals: users.filter(u => u.status === 'pending').length,
      suspended: users.filter(u => u.status === 'suspended').length,
    };
  }, [users]);

  const kpiCards: KpiCardProps[] = [
    {
      title: 'Total Users',
      value: String(stats.total),
      icon: Users,
      glow: 'rgba(99,102,241,0.35)',
      border: 'rgba(99,102,241,0.25)',
      iconColor: 'text-indigo-400',
      blobColor: 'rgba(99,102,241,0.5)',
      subtitle: 'Platform-wide registrations',
      active: roleFilter === 'all' && statusFilter === 'all',
      onClick: () => { setRoleFilter('all'); setStatusFilter('all'); }
    },
    {
      title: 'Active Hosts',
      value: String(stats.activeHosts),
      icon: ShieldCheck,
      glow: 'rgba(16,185,129,0.35)',
      border: 'rgba(16,185,129,0.25)',
      iconColor: 'text-emerald-400',
      blobColor: 'rgba(16,185,129,0.5)',
      subtitle: 'Verified property managers',
      active: roleFilter === 'host' && statusFilter === 'active',
      onClick: () => { setRoleFilter('host'); setStatusFilter('active'); }
    },
    {
      title: 'Pending Approvals',
      value: String(stats.pendingApprovals),
      icon: Clock,
      glow: 'rgba(234,179,8,0.35)',
      border: 'rgba(234,179,8,0.25)',
      iconColor: 'text-amber-400',
      blobColor: 'rgba(234,179,8,0.5)',
      subtitle: 'Awaiting administrator action',
      active: statusFilter === 'pending',
      onClick: () => { setRoleFilter('all'); setStatusFilter('pending'); }
    },
    {
      title: 'Suspended',
      value: String(stats.suspended),
      icon: UserX,
      glow: 'rgba(239,68,68,0.35)',
      border: 'rgba(239,68,68,0.25)',
      iconColor: 'text-rose-400',
      blobColor: 'rgba(239,68,68,0.5)',
      subtitle: 'Restricted account access',
      active: statusFilter === 'suspended',
      onClick: () => { setRoleFilter('all'); setStatusFilter('suspended'); }
    },
  ];

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-indigo-500/30 text-indigo-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!mounted) {
    return (
      <div className="w-full bg-[#08080c] border border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[400px] backdrop-blur-xl">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest animate-pulse">Loading User Management Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
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

      {/* ── Search and Filter Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/8 p-5 md:p-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isPremiumSearch ? 'text-indigo-400' : 'text-zinc-500'}`} />
            <Input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-10 bg-white/5 border-white/10 text-zinc-300 placeholder:text-zinc-600 focus:border-indigo-500/50 transition-all ${isPremiumSearch ? 'border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : ''}`}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-white/10"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {statusFilter !== 'all' && (
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 flex items-center gap-1.5 px-3 py-2 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider">{statusFilter} Filter Active</span>
                <button onClick={() => setStatusFilter('all')} className="hover:text-white">
                  <X size={14} />
                </button>
              </Badge>
            )}
            <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); if (val === 'all') setStatusFilter('all'); }}>
              <SelectTrigger className="w-full md:w-[160px] bg-white/5 border-white/10 text-zinc-300">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0d14] border-white/10">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="host">Host</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <Switch
                id="premium-search"
                checked={isPremiumSearch}
                onCheckedChange={setIsPremiumSearch}
              />
              <label htmlFor="premium-search" className="flex items-center text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer">
                <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                Filter
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Filter Features */}
        <AnimatePresence>
          {isPremiumSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-auto bg-white/5 rounded-xl border border-white/10 p-1">
                  <DateRangePicker onUpdate={setDateRange} />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[180px] bg-white/5 border-white/10 text-zinc-300">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0d14] border-white/10">
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── User Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/8"
      >
        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3 p-4">
          <AnimatePresence>
            {filteredAndSortedUsers.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 text-zinc-600">
                <Icon name="DocumentMagnifyingGlassIcon" size={36} />
                <p className="text-sm font-medium">No users found</p>
              </div>
            ) : (
              filteredAndSortedUsers.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.3 }}
                  className="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{highlightMatch(user.name, searchTerm)}</p>
                      <p className="text-xs text-zinc-400 truncate">{highlightMatch(user.email, searchTerm)}</p>
                    </div>
                    <Badge
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        user.status === 'active' || user.status === 'approved_host'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : user.status === 'suspended'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {user.status === 'approved_host' ? 'Approved' : user.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-1 rounded">
                      {user.role}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/8">
                      {user.id.slice(0, 12)}...
                    </span>
                    <span className="text-[10px] text-zinc-500 ml-auto">
                      {format(parseISO(user.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/5 mt-1">
                    {editingUserId === user.id ? (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-wrap gap-2 justify-end"
                        >
                          {user.role === 'host' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setConfirmAction({ isOpen: true, type: 'approve_host', userId: user.id, userName: user.name })}
                                disabled={user.status === 'approved_host' || user.status === 'active'}
                                className="h-7 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-bold uppercase tracking-wider"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectClick(user)}
                                disabled={user.status === 'rejected'}
                                className="h-7 text-[9px] font-bold uppercase tracking-wider"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {user.role === 'guest' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setConfirmAction({ isOpen: true, type: 'approve_guest', userId: user.id, userName: user.name })}
                              disabled={user.status === 'active'}
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-bold uppercase tracking-wider"
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmAction({ isOpen: true, type: 'suspend', userId: user.id, userName: user.name })}
                            disabled={user.status === 'suspended'}
                            className="h-7 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[9px] font-bold uppercase tracking-wider"
                          >
                            Suspend
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmAction({ isOpen: true, type: 'delete', userId: user.id, userName: user.name })}
                            className="h-7 text-[9px] font-bold uppercase tracking-wider"
                          >
                            Delete
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingUserId(null)} className="h-7 px-2 hover:bg-white/10">
                            <X className="h-3.5 w-3.5 text-zinc-500" />
                          </Button>
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          className="h-8 px-4 w-full border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Action
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Email', 'Role', 'Status', 'Join Date', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAndSortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-600">
                        <Icon name="DocumentMagnifyingGlassIcon" size={36} />
                        <p className="text-sm font-medium">No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col font-medium text-white">
                          {highlightMatch(user.name, searchTerm)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-zinc-500 bg-white/5 w-fit px-1.5 py-0.5 rounded border border-white/8">
                          {user.id.slice(0, 12)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {highlightMatch(user.email, searchTerm)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`
                            px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${user.status === 'active' || user.status === 'approved_host'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : user.status === 'suspended'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                          `}
                        >
                          {user.status === 'approved_host' ? 'Approved' : user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {format(parseISO(user.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {editingUserId === user.id ? (
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex gap-2"
                              >
                                {user.role === 'host' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => setConfirmAction({ isOpen: true, type: 'approve_host', userId: user.id, userName: user.name })}
                                      disabled={user.status === 'approved_host' || user.status === 'active'}
                                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleRejectClick(user)}
                                      disabled={user.status === 'rejected'}
                                      className="h-8 text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {user.role === 'guest' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setConfirmAction({ isOpen: true, type: 'approve_guest', userId: user.id, userName: user.name })}
                                    disabled={user.status === 'active'}
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Approve
                                  </Button>
                                )}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setConfirmAction({ isOpen: true, type: 'suspend', userId: user.id, userName: user.name })}
                                  disabled={user.status === 'suspended'}
                                  className="h-8 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Suspend
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setConfirmAction({ isOpen: true, type: 'delete', userId: user.id, userName: user.name })}
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Delete
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setEditingUserId(null)} className="h-8 px-2 hover:bg-white/10">
                                  <X className="h-3.5 w-3.5 text-zinc-500" />
                                </Button>
                              </motion.div>
                            </AnimatePresence>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(user)}
                              className="h-8 px-4 border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider"
                            >
                              Action
                            </Button>
                          )}
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
        {filteredAndSortedUsers.length > 0 && (
          <div className="px-4 md:px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-zinc-600">
              Showing <span className="text-zinc-400 font-semibold">{filteredAndSortedUsers.length}</span> of{' '}
              <span className="text-zinc-400 font-semibold">{users.length}</span> platform users
            </p>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Live System</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Reject Host Dialog */}
      {selectedUserForReject && (
        <RejectHostDialog
          userId={selectedUserForReject.id}
          userName={selectedUserForReject.name}
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          onSuccess={handleRejectSuccess}
        />
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[480px] bg-[#0c0c12]/95 border border-white/10 text-white backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-heading font-black tracking-tight flex items-center gap-2">
              {confirmAction?.type === 'approve_host' || confirmAction?.type === 'approve_guest' ? (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : confirmAction?.type === 'suspend' ? (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <UserX className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <X className="w-5 h-5" />
                </div>
              )}
              <span>
                {confirmAction?.type === 'approve_host' && 'Approve Host Account'}
                {confirmAction?.type === 'approve_guest' && 'Approve Guest Account'}
                {confirmAction?.type === 'suspend' && 'Suspend User Account'}
                {confirmAction?.type === 'delete' && 'Delete User Permanently'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 leading-relaxed text-sm pt-2">
              {confirmAction?.type === 'approve_host' && (
                <>
                  Are you sure you want to approve <strong className="text-zinc-200">{confirmAction?.userName}</strong> as a verified Host on StayCoolBooking? They will be granted full hosting access and privileges.
                </>
              )}
              {confirmAction?.type === 'approve_guest' && (
                <>
                  Are you sure you want to approve <strong className="text-zinc-200">{confirmAction?.userName}</strong>'s guest account? This will activate their status on the platform.
                </>
              )}
              {confirmAction?.type === 'suspend' && (
                <>
                  Are you sure you want to suspend <strong className="text-zinc-200">{confirmAction?.userName}</strong>? They will be blocked from logging into the platform and all active reservations will be frozen.
                </>
              )}
              {confirmAction?.type === 'delete' && (
                <>
                  Are you sure you want to permanently delete <strong className="text-zinc-200">{confirmAction?.userName}</strong>? This action <strong className="text-rose-400 font-bold uppercase">cannot be undone</strong> and will erase all profile information, transactions, and settings from the database.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="bg-transparent border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-mono text-xs uppercase tracking-wider rounded-xl py-5"
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirmSubmit}
              className={`font-mono text-xs uppercase tracking-wider rounded-xl py-5 px-6 font-bold shadow-lg ${
                confirmAction?.type === 'approve_host' || confirmAction?.type === 'approve_guest'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20'
                  : confirmAction?.type === 'suspend'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-950/20'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-950/20'
              }`}
            >
              {confirmAction?.type === 'approve_host' && 'Confirm Approval'}
              {confirmAction?.type === 'approve_guest' && 'Confirm Approval'}
              {confirmAction?.type === 'suspend' && 'Confirm Suspension'}
              {confirmAction?.type === 'delete' && 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserList;
