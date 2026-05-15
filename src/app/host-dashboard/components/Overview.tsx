'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsCard from './StatsCard';
import EarningsChart from './EarningsChart';
import Icon from '@/components/ui/AppIcon';
import { Property, Earning, Booking, Review } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

interface OverviewProps {
  properties: Property[];
  bookings: Booking[];
  earnings: Earning[];
  reviews: Review[];
  disputes?: any[];
  onAction?: (tabId: string, data?: any) => void;
}

const Overview = ({ properties = [], bookings = [], earnings = [], reviews = [], disputes = [], onAction }: OverviewProps) => {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(2)
    : 'New';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let channel: any;

    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fetchNotifications = async () => {
        // Fetch real notifications (if any)
        const { data: notes } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        // Fetch unread messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('receiver_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        // Map messages to virtual notifications
        const virtualNotes = (msgs || []).map(m => ({
          id: `msg-${m.id}`,
          type: 'message',
          title: 'New Message Received',
          message: m.content.length > 50 ? m.content.substring(0, 50) + '...' : m.content,
          created_at: m.created_at,
          is_read: false
        }));

        const combined = [...virtualNotes, ...(notes || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        setNotifications(combined);
        setUnreadCount(combined.filter(n => !n.is_read).length);
      };

      await fetchNotifications();
      
      channel = supabase.channel(`host-notifications-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
          fetchNotifications();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
          fetchNotifications();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
          fetchNotifications();
        })
        .subscribe();
    };

    setupNotifications();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
      
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(15px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8"
    >
      {/* 1. HERO GREETING */}
      <motion.div variants={itemVariants} className="relative z-50 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight">
            Focus & Growth
          </h2>
          <p className="text-sm text-zinc-400 mt-2 font-medium">
            Your platform performance at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-xl">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-zinc-300">All Systems Operational</span>
            <span className="inline sm:hidden text-xs font-bold uppercase tracking-widest text-zinc-300">Operational</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative group p-3 backdrop-blur-sm border rounded-xl transition-all duration-300 ${
                showNotifications 
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
                  className="fixed sm:absolute inset-x-4 sm:inset-auto sm:right-0 top-32 sm:top-auto sm:mt-3 w-auto sm:w-80 bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                >
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Notifications</h3>
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
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center bg-white/[0.01]">
                        <Icon name="BellSlashIcon" size={24} className="text-zinc-700 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((note) => (
                        <div 
                          key={note.id} 
                          onClick={() => {
                            if (note.type === 'message') {
                              onAction?.('unified-inbox');
                            } else if (note.type === 'booking') {
                              onAction?.('bookings');
                            }
                            setShowNotifications(false);
                          }}
                          className={`p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group ${!note.is_read ? 'bg-indigo-500/[0.02]' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                              !note.is_read ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5 border border-white/10'
                            }`}>
                              <Icon name={getNotificationIcon(note.type) as any} size={14} className={!note.is_read ? 'text-indigo-400' : 'text-zinc-500'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-semibold truncate transition-colors ${!note.is_read ? 'text-white' : 'text-zinc-400'}`}>
                                  {note.title}
                                </p>
                                {!note.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] shrink-0" />}
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
        </div>
      </motion.div>

      {/* 2. TOP METRICS (4 Columns) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <StatsCard title="Active Listings" value={properties?.length || 0} icon="HomeIcon" onClick={() => onAction?.('properties')} />
        <StatsCard title="Pending Bookings" value={bookings?.filter(b => b.status === 'pending').length || 0} icon="CalendarDaysIcon" onClick={() => onAction?.('bookings')} />
        <StatsCard
          title="Monthly Revenue"
          value={`₹${(earnings || []).reduce((acc, curr) => acc + curr.earnings, 0).toLocaleString('en-IN')}`}
          icon="BanknotesIcon"
          onClick={() => onAction?.('revenue-velocity')}
        />
        <StatsCard title="Guest Rating" value={averageRating} icon="StarIcon" onClick={() => onAction?.('aura-quality')} />
      </motion.div>

      {/* 3. MIDDLE ROW: ANALYTICS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart (Wider) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-heading font-bold text-white">Earnings Analytics</h3>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Your revenue velocity over time
              </p>
            </div>
            <button
              onClick={() => onAction?.('revenue-velocity')}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold transition-all text-white flex items-center gap-2 shadow-lg"
            >
              Full Report <Icon name="ArrowRightIcon" size={14} />
            </button>
          </div>
          <div className="h-[280px] md:h-[340px] relative z-10">
            <EarningsChart data={earnings || []} />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-1 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col relative overflow-hidden group"
        >
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 shadow-inner">
                <Icon name="BellIcon" size={18} className="text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">Activity</h3>
            </div>
            <button
              onClick={() => onAction?.('unified-inbox')}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              Inbox
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar relative z-10 pr-2 pb-2">
            {(bookings || []).length > 0 ? (
              <>
                {(bookings || []).slice(0, showAllActivities ? undefined : 2).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => onAction?.('bookings')}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all cursor-pointer group/item shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={booking.guest?.avatar_url || 'https://via.placeholder.com/32'} 
                          className="w-10 h-10 rounded-full border border-white/20 object-cover group-hover/item:border-primary/50 transition-colors shadow-inner shrink-0" 
                          alt={booking.guest?.name || 'Guest'} 
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white group-hover/item:text-primary transition-colors truncate">
                            {booking.guest?.name?.trim() ? booking.guest.name : 'Verified Guest'}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-medium tracking-wide">New booking</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p suppressHydrationWarning className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {new Date(booking.check_in).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex items-center gap-2">
                         <Icon name="HomeIcon" size={10} className="text-zinc-500" />
                         <p className="text-[9px] text-zinc-500 font-bold truncate max-w-[120px] sm:max-w-none">
                           {booking.properties?.title || 'Property'}
                         </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Icon name="UsersIcon" size={10} className="text-zinc-500" />
                          <span className="text-[9px] font-bold">{booking.guests}</span>
                        </div>
                        <div
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            booking.booking_type === 'bulk' 
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          }`}
                        >
                          {booking.booking_type === 'bulk' ? 'Bulk' : 'Normal'}
                        </div>
                        <div
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            booking.status === 'confirmed'
                              ? 'bg-success/20 text-success border-success/30'
                              : booking.status === 'pending_payment'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : 'bg-warning/20 text-warning border-warning/30'
                          }`}
                        >
                          {booking.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {bookings.length > 2 && (
                  <button
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    className="w-full py-3 mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-300"
                  >
                    {showAllActivities ? 'Show Less' : `Show ${bookings.length - 2} More Activities`}
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
                  <Icon name="CalendarIcon" size={24} className="text-zinc-600 drop-shadow-md" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">No Activity Yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 4. BOTTOM ROW: QUICK ACTIONS & DISPUTES */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Quick Actions Toolbox */}
        <motion.div variants={itemVariants} className="xl:col-span-1 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-4">
          {[
            { label: 'Inbox', icon: 'ChatBubbleLeftRightIcon', color: 'text-primary', bg: 'bg-primary/10', border: 'hover:border-primary/40', tabId: 'unified-inbox' },
            { label: 'Reviews', icon: 'StarIcon', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/40', tabId: 'aura-quality' },
            { label: 'Pricing', icon: 'CurrencyRupeeIcon', color: 'text-success', bg: 'bg-success/10', border: 'hover:border-success/40', tabId: 'revenue-velocity' },
            { label: 'Calendar', icon: 'CalendarDaysIcon', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'hover:border-sky-400/40', tabId: 'availability' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onAction?.(action.tabId)}
              className={`flex flex-col items-center justify-center p-4 rounded-3xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 transition-all duration-300 group ${action.border} shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500 shadow-inner z-10`}>
                <Icon
                  name={action.icon}
                  className={`${action.color} opacity-80 group-hover:opacity-100 drop-shadow-sm`}
                  size={20}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors z-10">
                {action.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Disputes (Action Items) */}
        <motion.div
          variants={itemVariants}
          className="xl:col-span-3 bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-error/5 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-error/20 rounded-xl border border-error/30 shadow-inner">
                <Icon name="ScaleIcon" size={18} className="text-error drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-white">Action Required</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">Active disputes and issues</p>
              </div>
            </div>
            <button
              onClick={() => onAction?.('disputes')}
              className="text-[10px] font-bold uppercase text-zinc-300 hover:text-white transition-colors border border-white/20 px-4 py-2 rounded-xl hover:bg-white/10 bg-white/5 shadow-md"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {disputes && disputes.filter(d => d.status === 'open').length > 0 ? (
              disputes.filter(d => d.status === 'open').slice(0, 3).map((dispute) => (
                <div
                  key={dispute.id}
                  onClick={() => onAction?.('disputes')}
                  className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-error/40 hover:bg-error/10 transition-all cursor-pointer group/dispute flex flex-col h-full shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <p className="text-xs font-bold text-white group-hover/dispute:text-error transition-colors truncate">
                      {dispute.caseNumber}
                    </p>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 shadow-inner ${dispute.priority === 'critical' ? 'bg-error/20 text-error border border-error/30' : 'bg-warning/20 text-warning border border-warning/30'
                      }`}>
                      {dispute.priority}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-5 flex-1 leading-relaxed">{dispute.description}</p>

                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/10">
                    <Icon name="MapPinIcon" size={12} className="text-zinc-500" />
                    <p className="text-[10px] text-zinc-300 font-bold tracking-wide truncate">{dispute.propertyName}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-center space-y-4 py-10 bg-white/[0.02] rounded-[1.5rem] border border-white/5 border-dashed shadow-inner">
                <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center shadow-lg">
                  <Icon name="CheckBadgeIcon" size={32} className="text-success drop-shadow-md" />
                </div>
                <div>
                  <p className="text-base font-bold text-white mb-1 tracking-wide">You're all caught up!</p>
                  <p className="text-xs text-zinc-500 font-medium">No active issues or disputes requiring your attention.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Overview;
