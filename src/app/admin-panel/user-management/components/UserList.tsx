'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Search, X, Star } from 'lucide-react'; // Import Search, X, and Star icons
import { DateRangePicker } from '@/components/ui/datepicker'; // Assuming you have this component
import { toast } from 'sonner';

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
      console.error('Error approving user:', error);
      toast.error('Failed to approve host.');
      return;
    }

    if (success) {
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, status: 'approved_host' } : user))
      );
      toast.success('Host approved successfully.');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const { success, error } = await suspendUserAsAdmin(userId);

    if (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user.');
      return;
    }

    if (success) {
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, status: 'suspended' } : user))
      );
      toast.success('User suspended successfully.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Note: You might want to add a confirmation dialog before this action.
    const { error } = await supabase.from('users').delete().eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user.');
      return;
    }

    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    toast.success('User deleted successfully.');
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(editingUserId === user.id ? null : user.id);
  };

  const handleAutoApproveGuest = async (userId: string) => {
    const { success, error } = await autoApproveGuest(userId);

    if (error) {
      console.error('Error auto-approving guest:', error);
      toast.error('Failed to auto-approve guest.');
      return;
    }

    if (success) {
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? { ...user, status: 'active' } : user))
      );
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
    filtered.sort((a, b) => {
      const aValue = a[field as keyof User];
      const bValue = b[field as keyof User];

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, roleFilter, searchTerm, isPremiumSearch, dateRange, sortBy]);

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex flex-col gap-4">
        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="relative w-full md:max-w-sm">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                isPremiumSearch ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <Input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-10 ${isPremiumSearch ? 'border-primary shadow-md' : ''}`}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="host">Host</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                id="premium-search"
                checked={isPremiumSearch}
                onCheckedChange={setIsPremiumSearch}
              />
              <label htmlFor="premium-search" className="flex items-center text-sm font-medium">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                Premium
              </label>
            </div>
          </div>
        </div>

        {/* Premium Features Section */}
        {isPremiumSearch && (
          <div className="p-4 border rounded-lg bg-gray-50 flex flex-col md:flex-row gap-4 items-center">
            <DateRangePicker onUpdate={setDateRange} />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* User Table */}
      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedUsers.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{highlightMatch(user.name, searchTerm)}</div>
                  <div className="text-sm text-muted-foreground">
                    {highlightMatch(user.id, searchTerm)}
                  </div>
                </TableCell>
                <TableCell>{highlightMatch(user.email, searchTerm)}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.status === 'active' || user.status === 'approved_host'
                        ? 'default'
                        : user.status === 'suspended'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(parseISO(user.created_at), 'MM/dd/yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingUserId === user.id ? (
                      <>
                        {user.role === 'host' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveHost(user.id)}
                            disabled={user.status === 'approved_host'}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                          disabled={user.status === 'suspended'}
                        >
                          Suspend
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingUserId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserList;
