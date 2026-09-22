'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerWebNotification,
  playNotificationSound,
} from '@/lib/web-notifications';
import { Bell, BellRing, BellOff, X, CheckCircle2 } from 'lucide-react';

export default function WebNotificationManager() {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 1. Service Worker & Permission Initialization
  useEffect(() => {
    setMounted(true);

    // Register Service Worker for push notification support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[WebNotificationManager] SW registration note:', err);
      });
    }

    const currentPerm = getNotificationPermission();
    setPermission(currentPerm);

    // Show prompt if permission hasn't been decided yet and not dismissed recently
    const dismissed = localStorage.getItem('staycool_notif_prompt_dismissed');
    if (currentPerm === 'default' && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3500); // polite delay after page load
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. User & Realtime Subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        let role = session.user.user_metadata?.role;
        if (session.user.email === 'staycoolhotels@gmail.com') {
          role = 'admin';
        } else if (!role) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();
            if (profile?.role) role = profile.role;
          } catch {
            // A missing profile is non-fatal; the guest role remains the fallback.
          }
        }
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          role: role || (session.user.email === 'staycoolhotels@gmail.com' ? 'admin' : 'guest'),
        });
      } else {
        setCurrentUser(null);
      }
    };
    syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUser();
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Supabase Realtime Listener (Strict Role & User Scoped)
  useEffect(() => {
    function isForCurrentClient(item: {
      userId?: string | null;
      user_id?: string | null;
      targetRole?: 'guest' | 'host' | 'admin' | null;
      type?: string;
    }): boolean {
      const targetUserId = item.userId || item.user_id || null;
      const targetRole = item.targetRole || null;

      // 1. Visitors without an account do not receive private alerts
      if (!currentUser) {
        return false;
      }

      // 2. Specific User Targeting (Strict user match)
      if (targetUserId) {
        return currentUser.id === targetUserId;
      }

      // 3. Role-Based Targeting
      if (targetRole) {
        if (targetRole === 'admin') {
          return currentUser.role === 'admin' || currentUser.email === 'staycoolhotels@gmail.com';
        }
        if (targetRole === 'host') {
          return currentUser.role === 'host';
        }
        if (targetRole === 'guest') {
          return currentUser.role === 'guest';
        }
      }

      // 4. Inferred Role from Type if targetRole was not explicitly passed
      if (item.type === 'admin' || item.type === 'dispute') {
        return currentUser.role === 'admin' || currentUser.email === 'staycoolhotels@gmail.com';
      }

      return false;
    }

    // A. Fast Broadcast Channel (WebSocket Elixir Cluster - Zero Lag)
    const broadcastChannel = supabase
      .channel('staycool-global-alerts')
      .on('broadcast', { event: 'new_notification' }, (payload: any) => {
        const item = payload?.payload || payload;
        if (!item) return;

        if (isForCurrentClient(item)) {
          triggerWebNotification({
            title: item.title || 'StayCool Alert',
            body: item.message || 'You have a new update.',
            url: item.url || determineNotificationUrl(item.type, item.targetRole),
            tag: `broadcast_${item.id || Date.now()}`,
          });
        }
      })
      .subscribe();

    // B. Postgres Changes Channel (Fallback)
    const channelName = currentUser ? `global-web-notifications-${currentUser.id}` : 'global-web-notifications-visitor';
    const dbChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const newNotif = payload?.new;
          if (!newNotif) return;

          if (isForCurrentClient(newNotif)) {
            triggerWebNotification({
              title: newNotif.title || 'StayCool Alert',
              body: newNotif.message || 'You have a new update.',
              url: determineNotificationUrl(newNotif.type, newNotif.target_role),
              tag: `notif_${newNotif.id}`,
            });
          }
        }
      )
      .subscribe();

    // C. Auto-polling Fallback (Runs every 12 seconds to catch any missed DB notifications)
    let lastCheckedTime = new Date(Date.now() - 5000).toISOString();
    const pollInterval = setInterval(async () => {
      if (!currentUser) return;
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .gt('created_at', lastCheckedTime)
          .order('created_at', { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          lastCheckedTime = new Date().toISOString();
          data.forEach((item) => {
            if (isForCurrentClient(item)) {
              triggerWebNotification({
                title: item.title || 'StayCool Alert',
                body: item.message || 'You have a new update.',
                url: determineNotificationUrl(item.type, item.target_role),
                tag: `poll_${item.id}`,
              });
            }
          });
        }
      } catch (pollErr) {
        // silent on network errors
      }
    }, 12000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [currentUser]);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setShowPrompt(false);

    if (result === 'granted') {
      playNotificationSound();
      triggerWebNotification({
        title: '🔔 Notifications Enabled!',
        body: 'You will now receive instant alerts for bookings, payments, and cancellations on StayCool.',
        url: '/',
      });
    }
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('staycool_notif_prompt_dismissed', 'true');
  };

  function determineNotificationUrl(type?: string, targetRole?: string | null): string {
    if (targetRole === 'admin') return '/admin-panel';
    if (targetRole === 'host') return '/host-dashboard';
    if (targetRole === 'guest') return '/user-profile';

    switch (type) {
      case 'booking':
        return currentUser?.role === 'host' ? '/host-dashboard' : '/user-profile';
      case 'payout':
      case 'verification':
      case 'new_property':
      case 'host_approval':
        return '/host-dashboard';
      case 'dispute':
      case 'admin':
        return '/admin-panel';
      default:
        return currentUser?.role === 'host' ? '/host-dashboard' : '/';
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. Interactive Opt-in Prompt Banner (Appears when default)
         ───────────────────────────────────────────────────────────── */}
      {showPrompt && permission === 'default' && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-[#0c0d14]/95 p-5 shadow-2xl backdrop-blur-xl">
            {/* Ambient cyan glow */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl" />

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <BellRing className="h-5 w-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Enable Notifications</h4>
                  <button
                    onClick={handleDismissPrompt}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Get real-time browser alerts for instant bookings, payouts, cancellations, and guest messages.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleEnableNotifications}
                    className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition-all duration-200"
                  >
                    Turn On Alerts
                  </button>
                  <button
                    onClick={handleDismissPrompt}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. Floating Notification Quick-Access Widget (Bottom-Right)
         ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-40">
        <div className="relative">
          <button
            onClick={() => setShowTester((prev) => !prev)}
            title={
              permission === 'granted'
                ? 'Web Notifications Active (Click for controls)'
                : 'Turn on Web Notifications'
            }
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-[#0c0d14]/90 border border-white/15 text-zinc-300 shadow-xl backdrop-blur-md transition-all duration-200 hover:border-sky-500/50 hover:text-white hover:scale-105 active:scale-95"
          >
            {permission === 'granted' ? (
              <>
                <Bell className="h-5 w-5 text-sky-400 group-hover:rotate-12 transition-transform" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0c0d14]" />
              </>
            ) : permission === 'denied' ? (
              <BellOff className="h-5 w-5 text-red-400" />
            ) : (
              <>
                <Bell className="h-5 w-5 text-zinc-400 group-hover:text-sky-400" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0c0d14]" />
              </>
            )}
          </button>

          {/* Quick Dropdown / Test Flyout */}
          {showTester && (
            <div className="absolute bottom-14 right-0 w-72 rounded-2xl border border-white/10 bg-[#0e1017]/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Web Notifications</span>
                </div>
                <button
                  onClick={() => setShowTester(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                  <span className="text-xs text-zinc-400">Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      permission === 'granted'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : permission === 'denied'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {permission === 'granted' && <CheckCircle2 className="h-3 w-3" />}
                    {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Default'}
                  </span>
                </div>

                {permission !== 'granted' ? (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 transition-colors"
                  >
                    Allow Browser Notifications
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-3 text-xs font-semibold text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Real-time Alerts Live & Active</span>
                  </div>
                )}

                <p className="text-[10px] text-zinc-500 leading-tight text-center">
                  Instant sound alerts for bookings, payments, payouts & cancellations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
