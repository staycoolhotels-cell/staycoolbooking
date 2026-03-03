'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { createBrowserClient } from '@supabase/ssr';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
  { id: 'properties', label: 'Properties', icon: 'HomeIcon' },
  { id: 'bookings', label: 'Bookings', icon: 'CalendarDaysIcon' },
  { id: 'earnings', label: 'Earnings', icon: 'BanknotesIcon' },
  { id: 'inbox', label: 'Inbox', icon: 'EnvelopeIcon' },
  { id: 'profile', label: 'Profile', icon: 'UserCircleIcon' },
];

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let currentUserId: string | null = null;

    const fetchUnread = async (userId: string) => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUserId = user.id;
      fetchUnread(user.id);

      // Real-time subscription for new messages
      const channel = supabase
        .channel('sidebar-unread')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => fetchUnread(user.id)
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()) };
  }, []);

  // When switching to inbox tab, mark messages as read after a short delay
  useEffect(() => {
    if (activeTab === 'inbox') {
      // Let the inbox component handle marking as read
      // Just clear local count when inbox is active
      const timer = setTimeout(() => setUnreadCount(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  return (
    <aside className="relative z-30 w-72 h-full bg-white/[0.03] backdrop-blur-3xl border-r border-white/10 flex flex-col shadow-2xl">
      {/* Branding Section */}
      <div className="p-8">
        <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter">
          StayCool
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.8)]" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-black">
            Host Portal
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2 mt-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="group relative flex items-center w-full px-6 py-4 rounded-2xl transition-all duration-300 outline-none"
          >
            {/* Animated Active Glow Background */}
            {activeTab === item.id && (
              <motion.div
                layoutId="sidebarActiveGlow"
                className="absolute inset-0 rounded-2xl bg-white/[0.08] border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {/* Neon Indicator Line */}
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--color-primary-rgb),1)]" />
              </motion.div>
            )}

            <div className="relative z-10 flex items-center w-full">
              <Icon
                name={item.icon}
                size={22}
                className={`mr-4 transition-colors duration-300 ${activeTab === item.id ? 'text-primary' : 'text-white/30 group-hover:text-white/60'
                  }`}
              />
              <span
                className={`font-semibold tracking-wide transition-colors duration-300 flex-1 text-left ${activeTab === item.id ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                  }`}
              >
                {item.label}
              </span>
              {/* Unread dot — show only for Inbox when there are unread messages */}
              {item.id === 'inbox' && unreadCount > 0 && activeTab !== 'inbox' && (
                <span className="relative flex h-2.5 w-2.5 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>

      {/* Sidebar Footer / Support */}
      <div className="p-6 mt-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-white/5">
          <p className="text-xs text-white/60 mb-3 leading-relaxed">
            Need help with your listings?
          </p>
          <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
