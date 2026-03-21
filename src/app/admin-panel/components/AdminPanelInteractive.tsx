import React, { useState, useEffect } from 'react';
import AdminPageHeader from './AdminPageHeader';
import { useRouter } from 'next/navigation';
import { useScroll } from 'framer-motion';
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
  const { scrollY } = useScroll(); // Assuming you might have scroll sync but keep it focused on tabs
  const { searchParams } = new URL(typeof window !== 'undefined' ? window.location.href : 'http://localhost'); // Simple fallback
  // Better use Next.js navigation
  const router = useRouter();
  const searchParamsNext = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const [activeTab, setActiveTabState] = useState<
    'overview' | 'verifications' | 'disputes' | 'transactions' | 'users' | 'properties' | 'inbox'
  >('overview');

  useEffect(() => {
    if (searchParamsNext) {
      const tab = searchParamsNext.get('tab') as any;
      if (tab && ['overview', 'verifications', 'disputes', 'transactions', 'users', 'properties', 'inbox'].includes(tab)) {
        setActiveTabState(tab);
      }
    }
  }, [searchParamsNext]);

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabState(tab);
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('tab', tab);
    router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
  };

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
    <div className="min-h-screen bg-[#050505] pt-0 pb-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <AdminPageHeader
          title="Control Center"
          subtitle="Real-time platform oversight and management"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative group p-3 bg-white/5 backdrop-blur-sm text-zinc-400 border border-white/10 rounded-xl hover:text-white hover:border-white/25 hover:bg-white/10 transition-all duration-300"
            >
              <Icon name="BellIcon" size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#050505] animate-pulse" />
            </button>
            <button
              onClick={handleExportReport}
              className="px-4 py-3 bg-white/5 backdrop-blur-sm text-zinc-300 border border-white/10 rounded-xl hover:text-white hover:border-white/25 hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
            >
              <Icon name="ArrowDownTrayIcon" size={18} />
              <span className="hidden sm:inline text-sm font-semibold tracking-wide">Export</span>
            </button>
          </div>
        </AdminPageHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="relative mb-8 sticky top-20 z-40">
          <div className="bg-[#0a0a0f]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
              {(
                [
                  { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
                  { id: 'verifications', label: 'Review', icon: 'DocumentCheckIcon' },
                  { id: 'disputes', label: 'Disputes', icon: 'ExclamationTriangleIcon' },
                  { id: 'transactions', label: 'Finances', icon: 'BanknotesIcon' },
                  { id: 'users', label: 'Users', icon: 'UsersIcon' },
                  { id: 'properties', label: 'Listings', icon: 'HomeModernIcon' },
                  { id: 'inbox', label: 'Chat', icon: 'ChatBubbleLeftRightIcon' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-semibold text-xs uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-gradient-to-br from-white to-zinc-200 text-black shadow-[0_4px_14px_rgba(255,255,255,0.15)]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.07]'
                    }`}
                >
                  <Icon name={tab.icon} size={15} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Overview Tab — Premium Layout */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* Analytics Panel */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 p-6 group hover:border-white/20 transition-all duration-500">
                  {/* Ambient top glow */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-heading font-bold text-white tracking-tight">Platform Analytics</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">Monthly booking volume across the year</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 p-4">
                    <Bar options={analyticsOptions} data={analyticsData} />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all duration-500">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-heading font-bold text-white tracking-tight">Quick Actions</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">Jump to critical platform tasks</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        tab: 'verifications' as const,
                        icon: 'DocumentCheckIcon',
                        label: 'Review Verifications',
                        badge: verificationQueue.filter((v) => v.status === 'pending').length,
                        badgeLabel: 'pending',
                        color: 'emerald',
                        glow: 'rgba(16,185,129,0.12)',
                        border: 'rgba(16,185,129,0.2)',
                        iconColor: 'text-emerald-400',
                        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
                      },
                      {
                        tab: 'disputes' as const,
                        icon: 'ExclamationTriangleIcon',
                        label: 'Resolve Disputes',
                        badge: disputes.filter((d) => d.status !== 'resolved').length,
                        badgeLabel: 'active',
                        color: 'rose',
                        glow: 'rgba(239,68,68,0.12)',
                        border: 'rgba(239,68,68,0.2)',
                        iconColor: 'text-rose-400',
                        iconBg: 'bg-rose-500/10 border-rose-500/20',
                      },
                      {
                        tab: 'transactions' as const,
                        icon: 'BanknotesIcon',
                        label: 'Process Payouts',
                        badge: transactions.filter((t) => t.status === 'pending').length,
                        badgeLabel: 'pending',
                        color: 'sky',
                        glow: 'rgba(14,165,233,0.12)',
                        border: 'rgba(14,165,233,0.2)',
                        iconColor: 'text-sky-400',
                        iconBg: 'bg-sky-500/10 border-sky-500/20',
                      },
                      {
                        tab: 'users' as const,
                        icon: 'UsersIcon',
                        label: 'Manage Users',
                        badge: users.length,
                        badgeLabel: 'total',
                        color: 'amber',
                        glow: 'rgba(245,158,11,0.12)',
                        border: 'rgba(245,158,11,0.2)',
                        iconColor: 'text-amber-400',
                        iconBg: 'bg-amber-500/10 border-amber-500/20',
                      },
                    ].map((action) => (
                      <button
                        key={action.tab}
                        onClick={() => setActiveTab(action.tab)}
                        style={{ '--hover-glow': action.glow, '--hover-border': action.border } as React.CSSProperties}
                        className="group relative p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[var(--hover-border)] text-left transition-all duration-300 overflow-hidden"
                      >
                        {/* hover glow overlay */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                          style={{ background: `radial-gradient(circle at 30% 30%, ${action.glow}, transparent 70%)` }}
                        />
                        <div className="relative z-10">
                          <div className={`inline-flex p-2.5 rounded-xl border mb-3 transition-all duration-300 group-hover:scale-110 ${action.iconBg}`}>
                            <Icon name={action.icon} size={20} className={action.iconColor} />
                          </div>
                          <h3 className="font-heading font-bold text-sm text-zinc-200 group-hover:text-white mb-1 transition-colors">
                            {action.label}
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            <span className="text-zinc-300 font-bold">{action.badge}</span> {action.badgeLabel}
                          </p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ background: `linear-gradient(to right, transparent, ${action.glow}, transparent)` }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Maintenance Alerts */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-rose-500/15 p-6 hover:border-rose-500/25 transition-all duration-500">
                  <div className="absolute -top-8 -right-8 w-48 h-48 bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <Icon name="WrenchScrewdriverIcon" size={18} className="text-rose-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-heading font-bold text-white">System Alerts</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Active maintenance issues</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      {maintenanceAlerts.filter(a => a.status !== 'Resolved').length > 0 && (
                        <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                      )}
                      <span className="text-xs font-bold text-rose-300">
                        {maintenanceAlerts.filter(a => a.status !== 'Resolved').length} Active
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {maintenanceAlerts.filter(a => a.status !== 'Resolved').length > 0 ? (
                      maintenanceAlerts.filter(a => a.status !== 'Resolved').map((alert) => (
                        <div
                          key={alert.id}
                          className="group relative flex items-start justify-between gap-3 p-3.5 bg-white/[0.03] border border-white/8 rounded-xl hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-300"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${alert.priority === 'Urgent' ? 'bg-red-500' :
                              alert.priority === 'High' ? 'bg-orange-500' : 'bg-yellow-500'
                              }`} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{alert.issue}</p>
                              <p className="text-[11px] text-zinc-500 mt-0.5">ID: {alert.property_id?.slice(0, 8)}… · {alert.reported_by}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold ${alert.priority === 'Urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              alert.priority === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              }`}>
                              {alert.priority}
                            </span>
                            <span className="text-[10px] text-zinc-600">{new Date(alert.reported_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                          <Icon name="CheckCircleIcon" size={28} className="text-emerald-400" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-400">All Systems Operational</p>
                        <p className="text-[11px] text-zinc-600 mt-1">No active maintenance issues found</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-heading font-bold text-zinc-100">
                    Verification Queue
                  </h2>
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20"
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
              <div className="bg-card border border-border rounded-xl p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
                <div className="p-4 md:p-6 border-b border-white/10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-heading font-bold text-zinc-100">
                      Transaction History
                    </h2>
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20"
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
          <div className="space-y-5">

            {/* Recent Activity */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 p-5 hover:border-white/15 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <Icon name="BoltIcon" size={14} className="text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-heading font-bold text-white uppercase tracking-widest">Activity Feed</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-zinc-500 font-medium">Live</span>
                </div>
              </div>
              <div className="space-y-1">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <RecentActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 italic text-center py-6">No recent activity</p>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 p-5 hover:border-white/15 transition-all duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Icon name="ServerStackIcon" size={14} className="text-emerald-400" />
                </div>
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-widest">System Status</h3>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: 'Platform Health', status: 'Operational', color: 'emerald' },
                  { label: 'Payment Gateway', status: 'Active', color: 'emerald' },
                  { label: 'Messaging System', status: 'Online', color: 'emerald' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-emerald-400">{item.status}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-500 font-medium">Server Load</span>
                    <span className="text-xs font-bold text-amber-400">42%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Summary */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f0f1a] to-[#0a0a0f] border border-indigo-500/15 p-5 hover:border-indigo-500/25 transition-all duration-500">
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Icon name="CalendarDaysIcon" size={14} className="text-indigo-400" />
                </div>
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-widest">Today's Summary</h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: 'New Registrations',
                    value: users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length,
                    color: 'text-sky-400',
                    bg: 'bg-sky-500/10',
                  },
                  {
                    label: 'Bookings',
                    value: bookings.length,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10',
                  },
                  {
                    label: 'Revenue',
                    value: `₹${(transactions.reduce((acc, t) => acc + t.amount, 0) / 1000).toFixed(1)}K`,
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/10',
                  },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-xl ${item.bg} border border-white/5`}>
                    <span className="text-xs text-zinc-400 font-medium">{item.label}</span>
                    <span className={`text-lg font-heading font-black ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div >
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
    </div >
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
