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
import { Switch } from '@/components/ui/switch';
import { approveHost, suspendUserAsAdmin, autoApproveGuest } from '@/lib/admin-actions';
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

interface UserListProps {
  initialUsers: User[];
}

const UserList = ({ initialUsers }: UserListProps) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPremiumSearch, setIsPremiumSearch] = useState(false);
  const [sortBy, setSortBy] = useState('created_at-desc');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUserForReject, setSelectedUserForReject] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
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
      toast.success('User suspended successfully.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      toast.error('Failed to delete user.');
      return;
    }
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
    setEditingUserId(null);
  };

  const handleAutoApproveGuest = async (userId: string) => {
    const { success, error } = await autoApproveGuest(userId);
    if (error) {
      toast.error('Failed to auto-approve guest.');
      return;
    }
    if (success) {
      toast.success('Guest auto-approved successfully.');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
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
  }, [users, roleFilter, searchTerm, isPremiumSearch, dateRange, sortBy]);

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

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
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
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
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
                                      onClick={() => handleApproveHost(user.id)}
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
                                    onClick={() => handleAutoApproveGuest(user.id)}
                                    disabled={user.status === 'active'}
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Approve
                                  </Button>
                                )}
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleSuspendUser(user.id)}
                                  disabled={user.status === 'suspended'}
                                  className="h-8 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Suspend
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
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
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
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
    </div>
  );
};

export default UserList;
