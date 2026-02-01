'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import StatsCard from './StatsCard';
import VerificationQueueCard from './VerificationQueueCard';
import DisputeCard from './DisputeCard';
import TransactionRow from './TransactionRow';
import UserManagementCard from './UserManagementCard';
import UserDetailsModal from './UserDetailsModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import RecentActivityItem from './RecentActivityItem';
import PropertyApproval from './PropertyApproval';
import HostApprovalCard from './HostApprovalCard';
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
} from '@/lib/admin-actions';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { User as AuthUser } from '@supabase/supabase-js';

const AdminPanelInteractive = ({ adminData }: { adminData: { profiles: User[], authUsers: AuthUser[], bookings: any[], properties: any[], verifications: any[], disputes: any[], transactions: any[], activities: any[] } }) => {
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
        backgroundColor: 'rgba(212, 175, 55, 0.5)',
      },
    ],
  });

  const analyticsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Bookings',
      },
    },
  };
  const [activeTab, setActiveTab] = useState<
    'overview' | 'verifications' | 'disputes' | 'transactions' | 'users' | 'properties'
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

  const handleCloseModal = () => {
    setSelectedTransaction(null);
    setSelectedUser(null);
  };

  useEffect(() => {
    if(adminData.profiles && adminData.authUsers) {
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
        title: 'New Users',
        value: users.length.toString(),
        icon: 'UserPlusIcon',
        trend: { value: '+5%', isPositive: true },
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
          backgroundColor: 'rgba(212, 175, 55, 0.5)',
        },
      ],
    });
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const refetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
    if(profiles) {
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
    const { error } = await supabase.from('properties').update({ status: action }).eq('id', id);
    if (!error) {
      setProperties((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: action } : item))
      );
      await logActivity('property_review', `Property ${id} has been ${action}`);
    }
  };

  const handleResolveDispute = async (id: string) => {
    const { error } = await supabase.from('disputes').update({ status: 'resolved' }).eq('id', id);
    if (!error) {
      setDisputes((prev) =>
        prev.map((dispute) => (dispute.id === id ? { ...dispute, status: 'resolved' } : dispute))
      );
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

  return (
    <div className="min-h-screen bg-background pt-0 pb-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
              Admin Control Center
            </h1>
            <p className="text-text-secondary">Comprehensive platform oversight and management</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors duration-200"
            >
              <Icon name="BellIcon" size={20} className="text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button className="px-6 py-3 bg-brand-deep text-brand-deep-foreground rounded-lg font-heading font-semibold hover:bg-brand-deep/90 transition-all duration-300 flex items-center space-x-2">
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
        <div className="bg-card border border-border rounded-xl p-2 mb-8 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {(
              [
                { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
                { id: 'verifications', label: 'Verifications', icon: 'DocumentCheckIcon' },
                { id: 'disputes', label: 'Disputes', icon: 'ExclamationTriangleIcon' },
                { id: 'transactions', label: 'Transactions', icon: 'BanknotesIcon' },
                { id: 'users', label: 'User Management', icon: 'UsersIcon' },
                { id: 'properties', label: 'Properties', icon: 'HomeModernIcon' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-heading font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-text-secondary hover:bg-muted hover:text-foreground'
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
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">
                    Platform Analytics
                  </h2>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <Bar options={analyticsOptions} data={analyticsData} />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors duration-200 text-left">
                      <Icon name="DocumentCheckIcon" size={24} className="text-primary mb-2" />
                      <h3 className="font-heading font-semibold text-foreground mb-1">
                        Review Verifications
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {verificationQueue.filter((v) => v.status === 'pending').length} pending
                      </p>
                    </button>
                    <button className="p-4 bg-error/5 border border-error/20 rounded-lg hover:bg-error/10 transition-colors duration-200 text-left">
                      <Icon name="ExclamationTriangleIcon" size={24} className="text-error mb-2" />
                      <h3 className="font-heading font-semibold text-foreground mb-1">
                        Resolve Disputes
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {disputes.filter((d) => d.status !== 'resolved').length} active
                      </p>
                    </button>
                    <button className="p-4 bg-success/5 border border-success/20 rounded-lg hover:bg-success/10 transition-colors duration-200 text-left">
                      <Icon name="BanknotesIcon" size={24} className="text-success mb-2" />
                      <h3 className="font-heading font-semibold text-foreground mb-1">
                        Process Payouts
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {transactions.filter((t) => t.status === 'pending').length} pending
                      </p>
                    </button>
                    <button className="p-4 bg-warning/5 border border-warning/20 rounded-lg hover:bg-warning/10 transition-colors duration-200 text-left">
                      <Icon name="UsersIcon" size={24} className="text-warning mb-2" />
                      <h3 className="font-heading font-semibold text-foreground mb-1">
                        Manage Users
                      </h3>
                      <p className="text-sm text-text-secondary">{users.length} total</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">
                    Verification Queue
                  </h2>
                  <div className="flex items-center space-x-3">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {verificationQueue.map((item) => (
                    <VerificationQueueCard
                      key={item.id}
                      item={item}
                      onReview={(idFromCard: string, actionFromCard: 'approved' | 'rejected') =>
                        handleReview(idFromCard, actionFromCard)
                      }
                    />
                  ))}
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
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-medium hover:bg-primary/90 transition-colors duration-200">
                    Filter by Priority
                  </button>
                </div>
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <DisputeCard
                      key={dispute.id}
                      dispute={dispute}
                      onResolve={() => handleResolveDispute(dispute.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-heading font-bold text-foreground">
                      Transaction History
                    </h2>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-foreground">
                          Transaction ID
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-foreground">
                          Guest
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-foreground">
                          Host
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-foreground">
                          Property
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-foreground">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-foreground">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-heading font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
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
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">
                    User Management
                  </h2>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="mb-8">
                    <h3 className="text-lg font-heading font-bold text-foreground mb-4">Pending Host Approvals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.filter(u => u.role === 'host' && u.status === 'pending').map((user) => (
                            <HostApprovalCard key={user.id} user={user} onAction={refetchUsers} />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.filter(u => u.name).map((user) => (
                    <UserManagementCard key={user.id} user={user} onManage={handleManageUser} />
                  ))}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-heading font-bold text-foreground mb-4">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <RecentActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-heading font-bold text-foreground mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Platform Health</span>
                  <span className="flex items-center space-x-1 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-heading font-medium">Operational</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Payment Gateway</span>
                  <span className="flex items-center space-x-1 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-heading font-medium">Active</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Messaging System</span>
                  <span className="flex items-center space-x-1 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-heading font-medium">Online</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Server Load</span>
                  <span className="text-sm font-heading font-medium text-foreground">42%</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-brand-deep to-primary rounded-xl p-6 text-white">
              <h3 className="text-lg font-heading font-bold mb-4">Today&apos;s Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">New Registrations</span>
                  <span className="text-xl font-heading font-bold">{users.length}</span>
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
      <TransactionDetailsModal transaction={selectedTransaction} onClose={handleCloseModal} />
      <UserDetailsModal
        user={selectedUser}
        onClose={handleCloseModal}
        onSuspend={handleSuspendUser}
        onDelete={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
        onApprove={handleApproveUser}
      />
    </div>
  );
};

export default AdminPanelInteractive;
