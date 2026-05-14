import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPageHeader from './AdminPageHeader';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';
import StatsCard from './StatsCard';
import DisputeCard from './DisputeCard';
import TransactionRow from './TransactionRow';
import UserManagementCard from './UserManagementCard';
import UserDetailsModal from './UserDetailsModal';
import TransactionDetailsModal from './TransactionDetailsModal';
import DisputeDetailsModal from './DisputeDetailsModal';
import RealTimeChat from '@/components/chat/RealTimeChat';
import PropertyApproval from './PropertyApproval';
import AdminFinancialTreasury from './AdminFinancialTreasury';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  BarController,
  LineController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

import {
  Property,
  User,
  Dispute,
  Transaction,
  RecentActivity,
  Stat,
  VerificationItem,
  Booking,
  MaintenanceAlert,
  AppNotification,
} from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/lib/activity-actions';
import { deleteUserAsAdmin, updateUserDetailsAsAdmin, approveHost, approveProperty, rejectProperty, updateDisputeStatusAsAdmin, fetchBookingDetailsAsAdmin, updateAllUserStats, getAdminThreads } from '@/lib/admin-actions';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  BarController,
  LineController
);

import { User as AuthUser } from '@supabase/supabase-js';

const AdminPanelInteractive = ({ adminData }: { adminData: { profiles: User[], authUsers: AuthUser[], bookings: Booking[], properties: Property[], disputes: Dispute[], transactions: Transaction[], activities: RecentActivity[], supportThreads?: unknown[] } }) => {
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [analyticsData, setAnalyticsData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'Booking Volume',
        data: [] as number[],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Platform Revenue (₹)',
        data: [] as number[],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  });

  const analyticsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#a1a1aa',
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
          padding: 15,
          font: { family: "'Inter', sans-serif", size: 10, weight: 'bold' as const },
        },
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        padding: 12,
        cornerRadius: 12,
        titleFont: { family: "'Inter', 'Arial', sans-serif", size: 12, weight: 'bold' as const },
        bodyFont: { family: "'Inter', 'Arial', sans-serif", size: 12 },
        callbacks: {
          label: function (context: { dataset: { label?: string }; parsed: { y: number | null }; datasetIndex: number }) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 1) {
                label += '₹' + context.parsed.y.toLocaleString('en-IN');
              } else {
                label += context.parsed.y + ' stays';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { family: "'Inter', 'Arial', sans-serif", size: 10 } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#71717a', font: { family: "'Inter', 'Arial', sans-serif", size: 10 }, stepSize: 1 },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#71717a',
          font: { family: "'Inter', 'Arial', sans-serif", size: 10 },
          callback: function (value: string | number) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return '₹' + (numValue >= 1000 ? (numValue / 1000) + 'k' : numValue);
          }
        },
      },
    },
  };
  const router = useRouter();
  const searchParamsFromHook = useSearchParams();

  const [activeTab, setActiveTabState] = useState<
    'overview' | 'disputes' | 'transactions' | 'users' | 'properties' | 'inbox'
  >('overview');

  useEffect(() => {
    const tab = searchParamsFromHook.get('tab');
    if (tab && ['overview', 'disputes', 'transactions', 'users', 'properties', 'inbox'].includes(tab)) {
      setActiveTabState(tab as typeof activeTab);
    } else {
      setActiveTabState('overview');
    }
  }, [searchParamsFromHook]);

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabState(tab);
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('tab', tab);
    router.push(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase.channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: { new: any }) => {
        if (payload.new) {
          setNotifications(prev => [payload.new as AppNotification, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
          toast.info(`New Notification: ${payload.new.title}`);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload: any) => {
        if (payload.new) {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? (payload.new as AppNotification) : n));
          setUnreadCount(prev => {
            const wasRead = payload.old?.is_read;
            const isRead = payload.new.is_read;
            if (!wasRead && isRead) return Math.max(0, prev - 1);
            if (wasRead && !isRead) return prev + 1;
            return prev;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_review': return 'ChatBubbleBottomCenterTextIcon';
      case 'new_property': return 'HomeModernIcon';
      case 'payout':
      case 'withdrawal': return 'BanknotesIcon';
      case 'message': return 'EnvelopeIcon';
      case 'booking': return 'CalendarDaysIcon';
      default: return 'BellIcon';
    }
  };

  const formatNotificationTime = (date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const [stats, setStats] = useState<Stat[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>(adminData.disputes || []);
  const [transactions, setTransactions] = useState<Transaction[]>(adminData.transactions || []);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>(adminData.properties || []);
                  const [_recentActivities] = useState<RecentActivity[]>(
    adminData.activities || []
  );
  const [bookings, setBookings] = useState<Booking[]>(adminData.bookings || []);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [sortByPriority, setSortByPriority] = useState(false);

  const handleCloseModal = () => {
    setSelectedUser(null);
    setSelectedTransaction(null);
    setSelectedDispute(null);
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
    const totalRevenue = bookings.reduce((sum: number, b: Booking) => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        return sum + (Number(b.total_price) || 0);
      }
      return sum;
    }, 0);

    setStats([
      {
        title: 'Total Revenue',
        value: `₹${totalRevenue.toLocaleString()}`,
        icon: 'BanknotesIcon',
        trend: { value: '+8%', isPositive: true },
        bgColor: 'bg-emerald-500',
        onClick: () => setActiveTab('transactions'),
      },
      {
        title: 'Total Bookings',
        value: bookings.length.toString(),
        icon: 'CalendarDaysIcon',
        trend: { value: '+12%', isPositive: true },
        bgColor: 'bg-indigo-500',
        onClick: () => setActiveTab('overview'),
      },
      {
        title: 'Total Users',
        value: users.length.toString(),
        icon: 'UsersIcon',
        trend: { value: `+${users.filter(u => new Date(u.created_at).getMonth() === new Date().getMonth() && new Date(u.created_at).getFullYear() === new Date().getFullYear()).length} mo`, isPositive: true },
        bgColor: 'bg-green-500',
        onClick: () => setActiveTab('users'),
      },
      {
        title: 'Active Listings',
        value: properties.filter((p: Property) => p.status === 'active').length.toString(),
        icon: 'HomeModernIcon',
        trend: { value: '+3%', isPositive: true },
        bgColor: 'bg-yellow-500',
        onClick: () => setActiveTab('properties'),
      },
    ]);

    const monthlyBookings = new Array(12).fill(0);
    const monthlyRevenue = new Array(12).fill(0);
    bookings.forEach((booking: Booking) => {
      const month = new Date(booking.created_at).getMonth();
      monthlyBookings[month]++;
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        monthlyRevenue[month] += Number(booking.total_price) || 0;
      }
    });

    setAnalyticsData((prev) => {
      const newDatasets = [...prev.datasets];
      newDatasets[0] = { ...newDatasets[0], data: monthlyBookings };
      newDatasets[1] = { ...newDatasets[1], data: monthlyRevenue };
      return { ...prev, datasets: newDatasets };
    });

    // Fetch maintenance alerts initially
    const fetchMaintenanceAlerts = async () => {
      const { data } = await supabase.from('maintenance_alerts').select('*').order('created_at', { ascending: false });
      if (data) setMaintenanceAlerts(data);
    };
    fetchMaintenanceAlerts();
  }, [bookings, properties, users]);

  useEffect(() => {
    const channel = supabase.channel('realtime-admin');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, (payload: any) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setProperties((prev) => [...prev, payload.new as Property]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setProperties((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Property) : p))
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setProperties((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async (payload: any) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          if (!payload.new.id) return;
          const booking = await fetchBookingDetailsAsAdmin(payload.new.id);
          if (booking) {
            setBookings((prev) => {
              const filtered = prev.filter((b) => b.id !== booking.id);
              return [...filtered, booking].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            });
            // Also update transactions with properly mapped data
            const amount = Number(booking.total_price);
            const serviceFee = booking.service_fee || (amount * 0.1);
            const guestEmail = booking.guest?.email;
            const guestLocation = (booking as any).guestLocation;
            const guestAddress = [guestEmail, guestLocation].filter(Boolean).join('\n') || 'Address not provided';
            const mappedTransaction = {
              id: booking.id,
              transactionId: `TXN-${booking.id.slice(0, 8).toUpperCase()}`,
              propertyName: booking.property?.title || 'Unknown Property',
              guestName: booking.guest?.name || 'Unknown Guest',
              guestAddress,
              hostName: booking.property?.host?.name || 'Unknown Host',
              amount,
              serviceFee,
              netRevenue: amount - serviceFee,
              type: (booking.status === 'confirmed' || booking.status === 'completed') ? 'payment' :
                    (booking.status === 'cancelled' || booking.status === 'refunded') ? 'refund' : 'other',
              breakdown: { accommodation: amount - serviceFee, service_fee: serviceFee, taxes: 0 },
              date: new Date(booking.created_at).toLocaleDateString(),
              status: (booking.status === 'confirmed' || booking.status === 'completed') ? 'completed' :
                      (booking.status === 'refunded' ? 'refunded' : 'pending'),
              paymentMethod: 'Razorpay',
            } as Transaction;
            setTransactions((prev) => {
              const filtered = prev.filter((t) => t.id !== mappedTransaction.id);
              return [mappedTransaction, ...filtered];
            });
          } else {
            setBookings((prev) => {
              const filtered = prev.filter((b) => b.id !== payload.new.id);
              return [...filtered, payload.new as Booking];
            });
          }
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
          setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload: any) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
          setUsers((prev) =>
            prev.map((u) => (u.id === payload.new.id ? { ...u, ...(payload.new as User) } : u))
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
        }
      })

      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, (payload: any) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setDisputes((prev) => [...prev, payload.new as Dispute]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setDisputes((prev) =>
            prev.map((d) => (d.id === payload.new.id ? (payload.new as Dispute) : d))
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setDisputes((prev) => prev.filter((d) => d.id !== payload.old.id));
        }
      })
      // Note: transactions are derived from bookings (mapped above), not from the raw transactions table.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_alerts' }, (payload: any) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setMaintenanceAlerts((prev) => [payload.new as MaintenanceAlert, ...prev]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setMaintenanceAlerts((prev) =>
            prev.map((a) => (a.id === payload.new.id ? (payload.new as MaintenanceAlert) : a))
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setMaintenanceAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const refetchUsers = async () => {
    const { data: profiles } = await supabase.from('users').select('*');
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

    if (newStatus === 'closed') {
      setDisputes((prev) => prev.filter((dispute) => dispute.id !== id));
      toast.success('Dispute closed and deleted successfully');
    } else {
      setDisputes((prev) =>
        prev.map((dispute) => (dispute.id === id ? { ...dispute, status: newStatus } : dispute))
      );
      toast.success(`Dispute status updated to ${newStatus.replace('_', ' ')}`);
    }
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
    toast.info('Generating report...');
    const csvRows = [
      ['Date', 'Total Revenue', 'Total Bookings', 'Total Users'],
      [new Date().toLocaleDateString(), stats[0]?.value || '0', stats[1]?.value || '0', users.length.toString()]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully!');
  };

  const filteredTransactions = transactions.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.id?.toLowerCase().includes(query) ||
      t.guestName?.toLowerCase().includes(query) ||
      t.hostName?.toLowerCase().includes(query) ||
      t.propertyName?.toLowerCase().includes(query)
    );
  });

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return u && (
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
    <div className="relative min-h-[calc(100vh-100px)] w-full bg-[#080808] flex text-zinc-100">


      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-y-auto bg-[#080808] w-full min-w-0">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="px-4 sm:px-6 md:px-16 py-6 md:py-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="pl-0 md:pl-0">
              <AdminPageHeader
                title="Control Center"
                subtitle="Real-time platform oversight and management"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`relative group p-3 backdrop-blur-sm border rounded-xl transition-all duration-300 ${showNotifications
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/10'
                        }`}
                    >
                      <Icon name="BellIcon" size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#050505] animate-pulse" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="fixed sm:absolute inset-x-4 sm:inset-auto sm:right-0 top-20 sm:top-auto sm:mt-3 w-auto sm:w-80 bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                        >
                          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">System Notifications</h3>
                              {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400">{unreadCount} New</span>
                              )}
                            </div>
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                            >
                              <Icon name="XMarkIcon" size={16} />
                            </button>
                          </div>
                          <div className="max-h-[320px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center bg-white/[0.01]">
                                <Icon name="BellSlashIcon" size={24} className="text-zinc-700 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No notifications</p>
                              </div>
                            ) : (
                              notifications.map((note) => (
                                <div key={note.id} className={`p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group ${!note.is_read ? 'bg-indigo-500/[0.02]' : ''}`}>
                                  <div className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${!note.is_read ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5 border border-white/10'
                                      }`}>
                                      <Icon name={getNotificationIcon(note.type as string) as any} size={14} className={!note.is_read ? 'text-indigo-400' : 'text-zinc-500'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm font-semibold truncate transition-colors ${!note.is_read ? 'text-white' : 'text-zinc-400'}`}>
                                          {note.title}
                                        </p>
                                        {!note.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                                      </div>
                                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{note.message}</p>
                                      <p className="text-[10px] text-zinc-600 mt-1">{formatNotificationTime(note.created_at)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <button
                            className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all border-t border-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                          >
                            Mark all as read
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handleExportReport}
                    className="px-4 py-3 bg-white/5 backdrop-blur-sm text-zinc-300 border border-white/10 rounded-xl hover:text-white hover:border-white/25 hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                  >
                    <Icon name="ArrowDownTrayIcon" size={18} />
                    <span className="hidden sm:inline text-sm font-semibold tracking-wide">Export</span>
                  </button>
                </div>
              </AdminPageHeader>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
              {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-4 mb-6">
              {(
                [
                  { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
                  { id: 'disputes', label: 'Disputes', icon: 'ExclamationTriangleIcon' },
                  { id: 'transactions', label: 'Finances', icon: 'BanknotesIcon' },
                  { id: 'users', label: 'Users', icon: 'UsersIcon' },
                  { id: 'properties', label: 'Listings', icon: 'HomeModernIcon' },
                  { id: 'inbox', label: 'Chat', icon: 'ChatBubbleLeftRightIcon' },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-col items-center justify-center gap-1.5 md:gap-2 px-3 py-2.5 md:px-6 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 min-w-[70px] md:min-w-[110px] shrink-0 border ${isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                      : 'text-zinc-500 border-white/5 bg-white/[0.02] hover:text-zinc-200 hover:bg-white/[0.04] hover:border-white/10'
                      }`}
                  >
                    <div className="md:hidden">
                      <Icon name={tab.icon} size={20} className={isActive ? 'stroke-[2px]' : 'stroke-[1.5px]'} />
                    </div>
                    <div className="hidden md:block">
                      <Icon name={tab.icon} size={24} className={isActive ? 'stroke-[2px]' : 'stroke-[1.5px]'} />
                    </div>
                    <span className="font-bold text-[10px] md:text-xs tracking-tight">{tab.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-[1px] left-[20%] right-[20%] h-[3px] bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    )}
                  </button>
                );
              })}
            </nav>



            {/* Content Area */}
            <div className="w-full">
              <div>
                {/* Overview Tab — Premium Layout */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 md:space-y-8">
                    <AdminFinancialTreasury transactions={transactions} />

                    {/* 2. Platform Analytics */}
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
                      <div className="relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 p-4 h-[350px] sm:h-[400px]">
                        <Chart type="bar" options={analyticsOptions} data={analyticsData} />
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
                  <div className="space-y-6">
                    <AdminFinancialTreasury transactions={transactions} />
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
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-heading font-bold text-zinc-100">
                          User Management
                        </h2>
                        <button 
                          onClick={async () => {
                            const id = toast.loading('Synchronizing user analytics...');
                            try {
                              await updateAllUserStats();
                              toast.success('Analytics synchronized successfully', { id });
                            } catch (e) {
                              toast.error('Failed to sync analytics', { id });
                            }
                          }}
                          className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                          title="Recalculate stats for all users (Total Bookings, Completion %, etc.)"
                        >
                          <Icon name="ArrowPathIcon" size={14} />
                          Sync Stats
                        </button>
                      </div>
                      <div className="flex items-center w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full sm:w-auto px-4 py-2 bg-[#050505] border border-white/10 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                      </div>
                    </div>
                    {/* Manual Host Approval Section Removed - Automated via Payment now */}
                    <div className="mb-4 mt-8">
                      <h3 className="text-lg font-heading font-bold text-zinc-100">All Users</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredUsers.filter(u => u && u.name).length > 0 ? (
                        filteredUsers.filter(u => u && u.name).map((user) => (
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
            </div>
          </div>
        </div>
      </main>
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
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

    useEffect(() => {
      const fetchAdminAndThreads = async () => {
        // Get current admin
        const { data: { user } } = await supabase.auth.getUser();
        const adminId = user?.id;
        if (user) {
          const { data: profile } = await supabase.from('users').select('id, name').eq('id', user.id).single();
          setCurrentAdmin({ id: user.id, name: profile?.name || 'Admin' });
        }

        // Always use server action to fetch threads to bypass RLS issues with joins
        const allMessages = await getAdminThreads();

        if (allMessages && allMessages.length > 0) {
          // Group by the "other" user (host/guest)
          const threadMap = new Map();
          allMessages.forEach((msg: any) => {
            const otherUser = msg.sender_id === adminId ? msg.receiver : msg.sender;

            if (!otherUser || !otherUser.id) return;
            if (otherUser.id === adminId) return;

            // Filter: Only show conversations with Hosts
            if (otherUser.role !== 'host' && otherUser.role !== 'approved_host') return;

            if (!threadMap.has(otherUser.id)) {
              threadMap.set(otherUser.id, {
                user: otherUser,
                lastMessage: msg.content,
                timestamp: msg.created_at,
              });
            }
          });
          setThreads(Array.from(threadMap.values()));
        } else {
          setThreads([]);
        }
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
      <div className="bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[700px]">
        <div className={`
          ${mobileView === 'chat' ? 'hidden' : 'flex'} md:flex
          flex-col w-full md:w-[260px] lg:w-[300px] flex-shrink-0
          border-b md:border-b-0 md:border-r border-white/10
          overflow-hidden
        `}>
          <div className="p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
            <h3 className="font-heading font-bold text-white text-sm">Support Communications</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">{threads.length} conversation{threads.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <Icon name="ChatBubbleLeftRightIcon" size={22} className="text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-600 italic text-center">No messages yet</p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.user.id}
                  onClick={() => { setSelectedThread(thread); setMobileView('chat'); }}
                  className={`w-full p-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${selectedThread?.user.id === thread.user.id ? 'bg-white/10 border-l-2 border-l-primary' : ''
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 flex-shrink-0 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                      <Icon name="UserIcon" size={14} className="text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-zinc-100 text-sm truncate">{thread.user.name}</div>
                      <div className="text-xs text-zinc-500 truncate mt-0.5">{thread.lastMessage}</div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">
                        {new Date(thread.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Icon name="ChevronRightIcon" size={14} className="text-zinc-600 flex-shrink-0 md:hidden" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className={`
          ${mobileView === 'list' ? 'hidden' : 'flex'} md:flex
          flex-col flex-1 min-w-0
        `}>
          {selectedThread && currentAdmin ? (
            <div className="flex flex-col h-full min-h-0">
              <div className="p-3 md:p-4 border-b border-white/10 bg-white/5 flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <Icon name="ChevronLeftIcon" size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="UserIcon" size={14} className="text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{selectedThread.user.name}</h3>
                  <p className="text-[10px] text-zinc-500">Platform Support</p>
                </div>
              </div>
              <div className="flex-1 min-h-0 relative">
                <RealTimeChat
                  currentUser={currentAdmin}
                  otherUser={selectedThread.user}
                  contextTitle="Platform Support"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Icon name="ChatBubbleLeftRightIcon" size={28} className="text-zinc-700" />
              </div>
              <div>
                <p className="text-zinc-500 font-medium text-sm">No conversation selected</p>
                <p className="text-zinc-700 text-xs mt-1">Choose a thread from the list to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default AdminPanelInteractive;
