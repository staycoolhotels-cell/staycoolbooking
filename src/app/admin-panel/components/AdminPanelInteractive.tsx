'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import StatsCard from './StatsCard';
import VerificationQueueCard from './VerificationQueueCard';
import DisputeCard from './DisputeCard';
import TransactionRow from './TransactionRow';
import UserManagementCard from './UserManagementCard';
import UserDetailsModal from './UserDetailsModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import DisputeDetailsModal from './DisputeDetailsModal';
import RealTimeChat from '@/components/chat/RealTimeChat';
import RecentActivityItem from './RecentActivityItem';
import PropertyApproval from './PropertyApproval';
import HostApprovalCard from './HostApprovalCard';
import VerificationDetailsModal from './VerificationDetailsModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Property,
  User,
  Dispute,
  Transaction,
  Review,
  Campaign,
  RecentActivity,
  Stat,
  VerificationItem,
} from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/lib/activity-actions';
import {
  updateUserStatusAndRoleAsAdmin,
  deleteUserAsAdmin,
  updateUserDetailsAsAdmin,
  approveHost,
  rejectHost,
  approveProperty,
  rejectProperty,
  updateDisputeStatusAsAdmin,
} from '@/lib/admin-actions';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { User as AuthUser } from '@supabase/supabase-js';

const AdminPanelInteractive = ({ adminData }: { adminData: { profiles: User[], authUsers: AuthUser[], bookings: any[], properties: any[], verifications: any[], disputes: any[], transactions: any[], activities: any[] } }) => {
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState({
    labels: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    datasets: [
      {
        label: 'Bookings',
        data: [] as number[],
        backgroundColor: 'rgba(56, 189, 248, 0.5)',
      },
    ],
  });

  const analyticsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e4e4e7',
          font: {
            family: "'Inter', sans-serif",
          },
        },
      },
      title: {
        display: true,
        text: 'Monthly Bookings',
        color: '#e4e4e7',
        font: {
          size: 16,
          family: "'Inter', sans-serif",
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#a1a1aa', // zinc-400
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#a1a1aa', // zinc-400
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };
  const [activeTab, setActiveTab] = useState<
    'overview' | 'verifications' | 'disputes' | 'transactions' | 'users' | 'properties' | 'inbox'
  >('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);

  const [stats, setStats] = useState<Stat[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationItem[]>(
    adminData.verifications || []
  );
  const [disputes, setDisputes] = useState<Dispute[]>(adminData.disputes || []);
  const [transactions, setTransactions] = useState<Transaction[]>(adminData.transactions || []);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>(adminData.properties || []);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    adminData.activities || []
  );
  const [bookings, setBookings] = useState<any[]>(adminData.bookings || []);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null); // New state
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [sortByPriority, setSortByPriority] = useState(false);

  const handleCloseModal = () => {
    setSelectedTransaction(null);
    setSelectedUser(null);
    setSelectedVerification(null); // Close new modal
    setSelectedDispute(null);
  };

  const handleViewVerification = (item: VerificationItem) => {
    setSelectedVerification(item);
  };

  useEffect(() => {
    if (adminData.profiles && adminData.authUsers) {
      const authUsersMap = new Map<string, AuthUser>(adminData.authUsers.map((u: AuthUser) => [u.id, u]));
      const mergedUsers = adminData.profiles.map((p: User) => {
        const authUser = authUsersMap.get(p.id);
        return {
          ...p,
          name: authUser?.user_metadata?.name || 'N/A',
          email: authUser?.email || 'N/A',
        }
      });
      setUsers(mergedUsers);
    }
  }, [adminData]);


  useEffect(() => {
    setStats([
      {
        title: 'Total Bookings',
        value: adminData.bookings.length.toString(),
        icon: 'CalendarDaysIcon',
        trend: { value: '+12%', isPositive: true },
        bgColor: 'bg-indigo-500',
      },
      {
        title: 'Total Users',
        value: users.length.toString(),
        icon: 'UsersIcon',
        trend: { value: `+${users.filter(u => new Date(u.created_at).getMonth() === new Date().getMonth() && new Date(u.created_at).getFullYear() === new Date().getFullYear()).length} mo`, isPositive: true },
        bgColor: 'bg-green-500',
      },
      {
        title: 'Active Listings',
        value: adminData.properties.filter((p: any) => p.status === 'active').length.toString(),
        icon: 'HomeModernIcon',
        trend: { value: '+3%', isPositive: true },
        bgColor: 'bg-yellow-500',
      },
      {
        title: 'Pending Verifications',
        value: adminData.verifications.filter((v: any) => v.status === 'pending').length.toString(),
        icon: 'DocumentCheckIcon',
        trend: { value: '-2%', isPositive: false },
        bgColor: 'bg-red-500',
      },
    ]);

    const monthlyBookings = new Array(12).fill(0);
    adminData.bookings.forEach((booking: any) => {
      const month = new Date(booking.created_at).getMonth();
      monthlyBookings[month]++;
    });

    setAnalyticsData({
      labels: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      datasets: [
        {
          label: 'Bookings',
          data: monthlyBookings,
          backgroundColor: 'rgba(56, 189, 248, 0.5)',
        },
      ],
    });

    // Fetch maintenance alerts initially
    const fetchMaintenanceAlerts = async () => {
      const { data } = await supabase.from('maintenance_alerts').select('*').order('created_at', { ascending: false });
      if (data) setMaintenanceAlerts(data);
    };
    fetchMaintenanceAlerts();
  }, [adminData, users]);

  useEffect(() => {
    const channel = supabase.channel('realtime-admin');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProperties((prev) => [...prev, payload.new as Property]);
        } else if (payload.eventType === 'UPDATE') {
          setProperties((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Property) : p))
          );
        } else if (payload.eventType === 'DELETE') {
          setProperties((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookings((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setBookings((prev) => prev.map((b) => (b.id === payload.new.id ? payload.new : b)));
        } else if (payload.eventType === 'DELETE') {
          setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // You might want to refetch users here to get the merged data
        } else if (payload.eventType === 'UPDATE') {
          setUsers((prev) =>
            prev.map((u) => (u.id === payload.new.id ? { ...u, ...payload.new } : u))
          );
        } else if (payload.eventType === 'DELETE') {
          setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVerificationQueue((prev) => [...prev, payload.new as VerificationItem]);
          } else if (payload.eventType === 'UPDATE') {
            setVerificationQueue((prev) =>
              prev.map((v) => (v.id === payload.new.id ? (payload.new as VerificationItem) : v))
            );
          } else if (payload.eventType === 'DELETE') {
            setVerificationQueue((prev) => prev.filter((v) => v.id !== payload.old.id));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDisputes((prev) => [...prev, payload.new as Dispute]);
        } else if (payload.eventType === 'UPDATE') {
          setDisputes((prev) =>
            prev.map((d) => (d.id === payload.new.id ? (payload.new as Dispute) : d))
          );
        } else if (payload.eventType === 'DELETE') {
          setDisputes((prev) => prev.filter((d) => d.id !== payload.old.id));
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions((prev) => [...prev, payload.new as Transaction]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMaintenanceAlerts((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setMaintenanceAlerts((prev) =>
            prev.map((a) => (a.id === payload.new.id ? payload.new : a))
          );
        } else if (payload.eventType === 'DELETE') {
          setMaintenanceAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const refetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase.from('users').select('*');
    if (profiles) {
      const authUsersMap = new Map<string, AuthUser>(adminData.authUsers.map((u: AuthUser) => [u.id, u]));
      const mergedUsers = profiles.map((p: User) => {
        const authUser = authUsersMap.get(p.id);
        return {
          ...p,
          name: authUser?.user_metadata?.name || 'N/A',
          email: authUser?.email || 'N/A',
        }
      });
      setUsers(mergedUsers);
    }
  }

  const handleReview = async (id: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase.from('verifications').update({ status: action }).eq('id', id);
    if (!error) {
      setVerificationQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: action } : item))
      );
    }
  };

  const handlePropertyReview = async (id: string, action: 'active' | 'rejected') => {
    try {
      let result;
      if (action === 'active') {
        result = await approveProperty(id);
      } else {
        result = await rejectProperty(id, 'Rejected by admin');
      }

      if (!result) {
        throw new Error(`Failed to ${action === 'active' ? 'approve' : 'reject'} property`);
      }

      // Update local state optimistically
      setProperties((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: action } : item))
      );
      await logActivity('property_review', `Property ${id} has been ${action}`, undefined, `Property ${action === 'active' ? 'Approved' : 'Rejected'}`, action === 'active' ? 'success' : 'error');
    } catch (error) {
      console.error('Error updating property:', error);
      alert(`Failed to ${action === 'active' ? 'approve' : 'reject'} property`);
    }
  };

  const handleUpdateDisputeStatus = async (id: string, newStatus: Dispute['status']) => {
    const { success, error } = await updateDisputeStatusAsAdmin(id, newStatus);
    if (!success) {
      toast.error(`Failed to update dispute status: ${error}`);
      return;
    }

    setDisputes((prev) =>
      prev.map((dispute) => (dispute.id === id ? { ...dispute, status: newStatus } : dispute))
    );
    toast.success(`Dispute status updated to ${newStatus.replace('_', ' ')}`);
    handleCloseModal();
  };

  const handleViewDispute = (id: string) => {
    const dispute = disputes.find((d) => d.id === id);
    if (dispute) {
      setSelectedDispute(dispute);
    }
  };

  const handleViewTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      setSelectedTransaction(transaction);
    }
  };

  const handleManageUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setSelectedUser(user);
    }
  };

  const handleSuspendUser = async (id: string) => {
    // This function needs to be updated to use the new profiles table structure
    handleCloseModal();
  };

  const handleDeleteUser = async (id: string) => {
    const { success, error } = await deleteUserAsAdmin(id);
    if (error) {
      console.error('Error deleting user via admin action:', error);
      alert(`Failed to delete user: ${error}`);
    } else {
      setUsers((prev) => prev.filter((user) => user.id !== id));
    }
    handleCloseModal();
  };



  const handleUpdateUser = async (id: string, updatedUser: Partial<User>) => {

    const { success, error } = await updateUserDetailsAsAdmin(id, updatedUser);

    if (error) {

      console.error('Error updating user via admin action:', error);

      alert(`Failed to update user: ${error}`);

    } else {

      refetchUsers();

    }

    handleCloseModal();

  };



  const handleApproveUser = async (id: string) => {
    const { success, error } = await approveHost(id);
    if (error) {
      console.error('Error approving user via admin action:', error);
      alert(`Failed to approve user: ${error}`);
    } else {
      refetchUsers();
    }
    handleCloseModal();
  };

  const handleExportReport = () => {
    toast.success('Report export started. Your download will begin shortly.');
  };

  const filteredTransactions = transactions.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(query) ||
      t.guestName.toLowerCase().includes(query) ||
      t.hostName.toLowerCase().includes(query) ||
      t.propertyName.toLowerCase().includes(query)
    );
  });

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name?.toLowerCase().includes(query)) ||
      (u.email?.toLowerCase().includes(query))
    );
  });

  const sortedDisputes = [...disputes].sort((a, b) => {
    if (!sortByPriority) return 0;
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
  });

  return (
    <div className="min-h-screen bg-[#050505] pt-0 pb-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-zinc-100 mb-2">
              Admin Control Center
            </h1>
            <p className="text-zinc-400">Comprehensive platform oversight and management</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-[#0a0a0f] border border-white/10 rounded-lg hover:bg-white/5 transition-colors duration-200"
            >
              <Icon name="BellIcon" size={20} className="text-zinc-200" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button
              onClick={handleExportReport}
              className="px-6 py-3 bg-brand-deep text-brand-deep-foreground rounded-lg font-heading font-semibold hover:bg-brand-deep/90 transition-all duration-300 flex items-center space-x-2"
            >
              <Icon name="ArrowDownTrayIcon" size={20} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-2 mb-8 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {(
              [
                { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
                { id: 'verifications', label: 'Verifications', icon: 'DocumentCheckIcon' },
                { id: 'disputes', label: 'Disputes', icon: 'ExclamationTriangleIcon' },
                { id: 'transactions', label: 'Transactions', icon: 'BanknotesIcon' },
                { id: 'users', label: 'User Management', icon: 'UsersIcon' },
                { id: 'properties', label: 'Properties', icon: 'HomeModernIcon' },
                { id: 'inbox', label: 'Inbox', icon: 'ChatBubbleLeftRightIcon' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-heading font-medium transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon name={tab.icon} size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-heading font-bold text-zinc-100 mb-4">
                    Platform Analytics
                  </h2>
                  <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
                    <Bar options={analyticsOptions} data={analyticsData} />
                  </div>
                </div>

                <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6">
                  <h2 className="text-xl font-heading font-bold text-zinc-100 mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('verifications')}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left"
                    >
                      <Icon name="DocumentCheckIcon" size={24} className="text-emerald-400 mb-2" />
                      <h3 className="font-heading font-semibold text-zinc-200 mb-1">
                        Review Verifications
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {verificationQueue.filter((v) => v.status === 'pending').length} pending
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab('disputes')}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left"
                    >
                      <Icon name="ExclamationTriangleIcon" size={24} className="text-rose-400 mb-2" />
                      <h3 className="font-heading font-semibold text-zinc-200 mb-1">
                        Resolve Disputes
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {disputes.filter((d) => d.status !== 'resolved').length} active
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left"
                    >
                      <Icon name="BanknotesIcon" size={24} className="text-emerald-400 mb-2" />
                      <h3 className="font-heading font-semibold text-zinc-200 mb-1">
                        Process Payouts
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {transactions.filter((t) => t.status === 'pending').length} pending
                      </p>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left"
                    >
                      <Icon name="UsersIcon" size={24} className="text-amber-400 mb-2" />
                      <h3 className="font-heading font-semibold text-zinc-200 mb-1">
                        Manage Users
                      </h3>
                      <p className="text-sm text-zinc-500">{users.length} total</p>
                    </button>
                  </div>
                </div>

                {/* Maintenance Alerts Overview */}
                <div className="bg-[#0a0a0f] border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -z-10"></div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-heading font-bold text-zinc-100 flex items-center gap-2">
                      Active Maintenance Issues
                    </h2>
                    <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                      {maintenanceAlerts.filter(a => a.status !== 'Resolved').length} Active
                    </span>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {maintenanceAlerts.filter(a => a.status !== 'Resolved').length > 0 ? (
                      maintenanceAlerts.filter(a => a.status !== 'Resolved').map((alert) => (
                        <div key={alert.id} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{alert.issue}</p>
                            <p className="text-xs text-zinc-400 mt-1">Property ID: {alert.property_id.slice(0, 8)}... | By: {alert.reported_by}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${alert.priority === 'Urgent' ? 'bg-red-500' : alert.priority === 'High' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                              {alert.priority}
                            </span>
                            <p className="text-[10px] text-zinc-500 mt-2">{new Date(alert.reported_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 italic p-4 text-center border border-dashed border-zinc-800 rounded-lg">No active maintenance issues.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-zinc-100">
                    Verification Queue
                  </h2>
                  <div className="flex items-center space-x-3">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {verificationQueue.length > 0 ? (
                    verificationQueue.map((item) => (
                      <VerificationQueueCard
                        key={item.id}
                        item={item}
                        onReview={(idFromCard: string, actionFromCard: 'approved' | 'rejected') =>
                          handleReview(idFromCard, actionFromCard)
                        }
                        onViewDetails={() => handleViewVerification(item)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-xl">
                      <Icon name="DocumentCheckIcon" size={48} className="text-zinc-600 mb-4" />
                      <p className="text-zinc-500 font-heading">No pending verifications found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">
                    Active Disputes
                  </h2>
                  <button
                    onClick={() => setSortByPriority(!sortByPriority)}
                    className={`px-4 py-2 rounded-lg font-heading font-medium transition-colors duration-200 ${sortByPriority ? 'bg-brand-deep text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                  >
                    {sortByPriority ? 'Priority Sorted' : 'Filter by Priority'}
                  </button>
                </div>
                <div className="space-y-4">
                  {sortedDisputes.length > 0 ? (
                    sortedDisputes.map((dispute) => (
                      <DisputeCard
                        key={dispute.id}
                        dispute={dispute}
                        onViewDetails={handleViewDispute}
                      />
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-xl">
                      <Icon name="ExclamationTriangleIcon" size={48} className="text-zinc-600 mb-4" />
                      <p className="text-zinc-500 font-heading">No active disputes to display.</p>
                      <p className="text-xs text-zinc-600 mt-2">All disputes are currently resolved or closed.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-heading font-bold text-zinc-100">
                      Transaction History
                    </h2>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-zinc-200">
                          Transaction ID
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-zinc-200">
                          Guest
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-zinc-200">
                          Host
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-zinc-200">
                          Property
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-zinc-200">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-zinc-200">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-zinc-200">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          onViewDetails={handleViewTransaction}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-zinc-100">
                    User Management
                  </h2>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-heading font-bold text-zinc-100 mb-4">Pending Host Approvals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.filter(u => u.role === 'host' && u.status === 'pending').length === 0 ? (
                      <div className="col-span-full py-8 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-xl">
                        <Icon name="CheckCircleIcon" size={36} className="text-zinc-600 mb-2" />
                        <p className="text-zinc-500 font-heading text-sm">No pending host approvals.</p>
                      </div>
                    ) : (
                      users.filter(u => u.role === 'host' && u.status === 'pending').map((user) => (
                        <HostApprovalCard
                          key={user.id}
                          user={user}
                          onAction={(userId: string) => {
                            // Optimistically remove the card immediately
                            setUsers(prev => prev.filter(u => u.id !== userId));
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
                <div className="mb-4 mt-8">
                  <h3 className="text-lg font-heading font-bold text-zinc-100">All Users</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUsers.filter(u => u.name).length > 0 ? (
                    filteredUsers.filter(u => u.name).map((user) => (
                      <UserManagementCard key={user.id} user={user} onManage={handleManageUser} />
                    ))
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-xl">
                      <Icon name="UsersIcon" size={48} className="text-zinc-600 mb-4" />
                      <p className="text-zinc-500 font-heading">No users found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <PropertyApproval
                properties={properties.filter((p) => p.status === 'pending')}
                onReview={handlePropertyReview}
              />
            )}

            {/* Inbox Tab */}
            {activeTab === 'inbox' && (
              <AdminInboxSection />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-heading font-bold text-zinc-100 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <RecentActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-heading font-bold text-zinc-100 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Platform Health</span>
                  <span className="flex items-center space-x-1 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-heading font-medium">Operational</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Payment Gateway</span>
                  <span className="flex items-center space-x-1 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-heading font-medium">Active</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Messaging System</span>
                  <span className="flex items-center space-x-1 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-heading font-medium">Online</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Server Load</span>
                  <span className="text-sm font-heading font-medium text-zinc-200">42%</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-[#050505] border border-white/10 rounded-xl p-6 text-white">
              <h3 className="text-lg font-heading font-bold mb-4">Today&apos;s Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">New Registrations</span>
                  <span className="text-xl font-heading font-bold">{users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Bookings Completed</span>
                  <span className="text-xl font-heading font-bold">{bookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Revenue Generated</span>
                  <span className="text-xl font-heading font-bold">
                    ₹{transactions.reduce((acc, t) => acc + t.amount, 0) / 1000}K
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={handleCloseModal}
      />
      <UserDetailsModal
        user={selectedUser}
        onClose={handleCloseModal}
        onSuspend={handleSuspendUser}
        onDelete={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
        onApprove={handleApproveUser}
      />
      <VerificationDetailsModal
        item={selectedVerification}
        onClose={handleCloseModal}
        onReview={handleReview}
      />
      <DisputeDetailsModal
        dispute={selectedDispute}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateDisputeStatus}
      />
    </div>
  );
  function AdminInboxSection() {
    const [threads, setThreads] = useState<any[]>([]);
    const [selectedThread, setSelectedThread] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
      const fetchAdminAndThreads = async () => {
        // Get current admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('users').select('id, name').eq('id', user.id).single();
          setCurrentAdmin({ id: user.id, name: profile?.name || 'Admin' });
        }

        // Fetch all support messages (where at least one user is admin)
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*, sender:sender_id(id, name), receiver:receiver_id(id, name)')
          .order('created_at', { ascending: false });

        if (!error && messages) {
          // Group by the "other" user (host/guest)
          const threadMap = new Map();
          messages.forEach((msg: any) => {
            const otherUser = msg.sender_id === user?.id ? msg.receiver : msg.sender;
            if (!otherUser) return;
            if (otherUser.id === user?.id) return; // Should not happen if filtered correctly

            if (!threadMap.has(otherUser.id)) {
              threadMap.set(otherUser.id, {
                user: otherUser,
                lastMessage: msg.content,
                timestamp: msg.created_at,
              });
            }
          });
          setThreads(Array.from(threadMap.values()));
        }
        setLoading(true);
        setLoading(false);
      };

      fetchAdminAndThreads();

      // Real-time for new threads
      const channel = supabase.channel('admin-inbox')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          fetchAdminAndThreads();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading inbox...</div>;

    return (
      <div className="bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden flex h-[700px]">
        {/* Thread List */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-heading font-bold text-white">Support Communications</h3>
          </div>
          {threads.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 italic">No messages yet</div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.user.id}
                onClick={() => setSelectedThread(thread)}
                className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${selectedThread?.user.id === thread.user.id ? 'bg-white/10' : ''
                  }`}
              >
                <div className="font-bold text-zinc-100">{thread.user.name}</div>
                <div className="text-sm text-zinc-500 truncate">{thread.lastMessage}</div>
                <div className="text-[10px] text-zinc-600 mt-1">
                  {new Date(thread.timestamp).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedThread && currentAdmin ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white">Chatting with {selectedThread.user.name}</h3>
              </div>
              <div className="flex-1 p-4 min-h-0 overflow-y-auto">
                <RealTimeChat
                  currentUser={currentAdmin}
                  otherUser={selectedThread.user}
                  contextTitle="Platform Support"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 italic">
              Select a conversation to begin
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default AdminPanelInteractive;
