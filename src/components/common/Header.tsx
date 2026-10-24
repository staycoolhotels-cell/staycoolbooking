'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { signOutUser } from '@/lib/auth-actions';
import { useAppStore } from '@/lib/store';

/**
 * Obsidian Sky Ultra-Luxury Header
 * Style: Deep Obsidian Foundation, Sky Blue Accents, Liquid Motion.
 */
const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  // Dynamic transformations for cinematic scroll scaling
  const headerHeight = useTransform(scrollY, [0, 100], ['100px', '70px']);
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']);

  const storeUser = useAppStore((state) => state.currentUser);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, name, email, role, avatar_url, referral_code')
          .eq('id', userId)
          .maybeSingle();

        if (isMounted && dbUser) {
          setUserProfile(dbUser);
          if (dbUser.referral_code) setReferralCode(dbUser.referral_code);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    // Initial fetch to sync state from local session cache or getUser fallback
    const syncUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let currentUser = session?.user ?? null;
        if (!currentUser) {
          const { data: userData } = await supabase.auth.getUser();
          currentUser = userData?.user ?? null;
        }

        if (isMounted) {
          setUser(currentUser);
        }

        const targetId = currentUser?.id || storeUser?.id;
        if (targetId) {
          await fetchProfile(targetId);
        }
      } catch (err) {
        console.error('Header syncUser error:', err);
      }
    };
    syncUser();

    // Auth state synchronization (fires automatically on sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (isMounted) {
        setUser(currentUser);
      }
      if (currentUser?.id) {
        await fetchProfile(currentUser.id);
      } else if (!storeUser?.id) {
        if (isMounted) setUserProfile(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        if (typeof window !== 'undefined' && window.location.pathname !== '/reset-password') {
          router.push('/reset-password');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [storeUser?.id]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // 1. Clear local session via client-side Supabase
      await supabase.auth.signOut();

      // 2. Clear store user
      useAppStore.getState().clearCache();

      // 3. Clear server components via server action - this must be in transition if it throws redirect
      React.startTransition(() => {
        signOutUser();
      });

      setUser(null);
      setUserProfile(null);
      setIsMobileMenuOpen(false);
      setIsDropdownOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
      setUser(null);
      setUserProfile(null);
      // Fallback redirect if server action fails
      router.push('/');
      router.refresh();
    }
  };

  // Determine role-based navigation links
  const baseLinks = [
    { name: 'Home', path: '/homepage', icon: 'HomeIcon' },
    { name: 'About Us', path: '/about', icon: 'InformationCircleIcon' },
    { name: 'Community', path: '/community', icon: 'UserGroupIcon' },
    { name: 'Contact', path: '/contact', icon: 'PhoneIcon' },
  ];

  const isHostDashboard = pathname.startsWith('/host-dashboard');
  const isAdminPanel = pathname.startsWith('/admin-panel');
  const isUserProfile = pathname.startsWith('/user-profile');

  const effectiveRole = (
    userProfile?.role ||
    storeUser?.role ||
    user?.user_metadata?.role ||
    (isHostDashboard ? 'host' : isAdminPanel ? 'admin' : '')
  )?.toLowerCase();

  const isAuthenticated = !!user?.id || !!storeUser?.id || isHostDashboard || isUserProfile;
  const role = effectiveRole;

  const displayName =
    userProfile?.name ||
    storeUser?.name ||
    user?.user_metadata?.fullName ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    (isHostDashboard ? 'Host' : 'User');

  const displayAvatar =
    userProfile?.avatar_url ||
    storeUser?.avatar_url ||
    user?.user_metadata?.avatar_url;

  const roleSpecificLinks = [];
  if (role === 'guest') {
    roleSpecificLinks.push({ name: 'User Profile', path: '/user-profile', icon: 'UserCircleIcon' });
  } else if (role === 'host') {
    roleSpecificLinks.push({ name: 'Host Panel', path: '/host-dashboard', icon: 'HomeModernIcon' });
  } else if (role === 'admin') {
    roleSpecificLinks.push({ name: 'Admin Panel', path: '/admin-panel', icon: 'ShieldCheckIcon' });
  }

  const navLinks = [...baseLinks, ...roleSpecificLinks];
  const mobileNavLinks = navLinks;

  // Hide global header on admin panel pages
  if (pathname.startsWith('/admin-panel')) return null;

  return (
    <>
      <motion.header
        style={{ height: headerHeight, backgroundColor: headerBg }}
        className="fixed top-0 left-0 w-full z-[100] flex items-center px-6 sm:px-12"
      >
        <div className="w-full flex items-center justify-between">
          {/* 1. BRANDING: Magnetic Reveal with Sky Blue Glow */}
          <Link href="/homepage" className="group flex items-center gap-2 z-[101]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-4"
            >
              <div className="rounded-full border-2 border-sky-500/70 p-[4px] shadow-[0_0_10px_rgba(14,165,233,0.4)] flex items-center justify-center">
                <img
                  src="/assets/images/logo.png"
                  alt="StayCool Logo"
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </div>
              <img
                src="/assets/Picsart_26-03-22_23-32-24-684.png"
                alt="StayCool Booking"
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* 2. NAVIGATION: Desktop */}
          <nav className="hidden xl:flex items-center gap-4 xl:gap-8">
            {navLinks.map((link, i) => {
              const active = pathname === link.path;
              return (
                <Link key={link.path} href={link.path} className="relative group py-2">
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${
                      active ? 'text-[#0ea5e9]' : 'text-white/40 group-hover:text-white'
                    }`}
                  >
                    {link.name}
                  </motion.span>

                  {/* Liquid Underline Animation */}
                  <motion.div
                    className="absolute -bottom-1 left-0 h-[2px] bg-[#0ea5e9]"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  />

                  {active && (
                    <motion.div
                      layoutId="active-sky-pill"
                      className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#0ea5e9] shadow-[0_0_15px_#0ea5e9]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. ACTIONS: Desktop (Airbnb Style) */}
          <div className="hidden xl:flex items-center gap-6 relative" ref={dropdownRef}>
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/auth?role=host" className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70 hover:text-[#0ea5e9] transition-all py-2.5 px-3 rounded-full hover:bg-white/5 cursor-pointer">Host Signup / Login</Link>
              </div>
            ) : (
              <Link
                href={role === 'host' ? "/host-dashboard" : role === 'admin' ? "/admin-panel" : "/user-profile"}
                className={`text-xs font-black uppercase tracking-[0.2em] transition-all py-2.5 px-4 rounded-full hover:bg-white/5 cursor-pointer ${
                  (role === 'host' && isHostDashboard) || (role === 'admin' && isAdminPanel)
                    ? 'text-[#0ea5e9] bg-sky-500/10 border border-sky-500/30'
                    : 'text-white/70 hover:text-[#0ea5e9]'
                }`}
              >
                {role === 'host' ? 'Host Dashboard' : role === 'admin' ? 'Admin Dashboard' : 'My Account'}
              </Link>
            )}

            {/* Globe Icon */}
            <button 
              suppressHydrationWarning
              className="p-2.5 text-white/70 hover:text-[#0ea5e9] hover:bg-white/5 rounded-full transition-all cursor-pointer"
              aria-label="Language and region"
              onClick={() => alert("StayCool Booking is currently optimized for English and Telugu.")}
            >
              <Icon name="Globe" size={18} />
            </button>

            {/* User Pill Menu Trigger */}
            <button
              suppressHydrationWarning
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 border border-white/10 hover:border-[#0ea5e9]/50 bg-zinc-950/50 hover:bg-zinc-950/80 rounded-full transition-all cursor-pointer shadow-md select-none group focus:outline-none"
            >
              <Icon name="Bars3Icon" size={16} className="text-white/60 group-hover:text-white transition-colors" />
              
              {/* User Avatar */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-[#0ea5e9]/50 transition-colors">
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon name="UserIcon" size={16} className="text-white/80" />
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-3 w-80 bg-black/90 border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] py-3.5 z-[200] overflow-hidden backdrop-blur-2xl"
                >
                  {!isAuthenticated ? (
                    <>
                      {/* Logged Out Menu */}
                      <Link 
                        href="/auth?role=guest" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-5 py-3 text-sm font-bold text-sky-400 hover:bg-white/5 transition-all text-left"
                      >
                        Guest Signup / Login
                      </Link>

                      <Link
                        href="/auth?role=admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        Admin Login
                      </Link>
                      
                      <div className="h-[1px] bg-white/10 my-2" />

                      {/* Host signup and login card */}
                      <Link 
                        href="/auth?role=host"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block"
                      >
                        <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20 border border-sky-500/20 rounded-2xl p-4 mx-3 my-2 flex items-center justify-between cursor-pointer transition-all group/card">
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-sm text-white group-hover/card:text-sky-400 transition-colors">Host Signup / Login</p>
                            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                              Sign in or sign up to start hosting and earn extra income.
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                            <Icon name="Home" size={20} className="text-sky-400" />
                          </div>
                        </div>
                      </Link>

                      <Link 
                        href="/auth?role=host"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        Refer a host
                      </Link>
                      
                      <Link 
                        href="/contact"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        Help Centre
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Logged In Menu */}
                      <div className="px-5 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Welcome, {displayName}
                      </div>

                      <div className="h-[1px] bg-white/10 my-2" />

                      {role === 'host' && (
                        <Link 
                          href="/host-dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-5 py-3 text-sm font-bold text-sky-400 hover:bg-white/5 transition-all text-left"
                        >
                          Host Dashboard
                        </Link>
                      )}

                      {role === 'admin' && (
                        <Link 
                          href="/admin-panel"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-5 py-3 text-sm font-bold text-sky-400 hover:bg-white/5 transition-all text-left"
                        >
                          Admin Dashboard
                        </Link>
                      )}

                      <Link 
                        href="/community"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        Community Discussions
                      </Link>

                      {role === 'guest' && (
                        <>
                          <Link 
                            href="/user-profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                          >
                            My Trips & Bookings
                          </Link>
                          
                          <Link 
                            href="/wishlist"
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                          >
                            Wishlists
                          </Link>
                        </>
                      )}

                      <Link 
                        href="/user-profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        Account Settings
                      </Link>

                      <div className="h-[1px] bg-white/10 my-2" />

                      {role === 'host' && (
                        <div className="px-3 py-1.5">
                          <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 text-xs">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Your Referral Code</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const codeToCopy = referralCode || user.user_metadata?.referral_code || (user?.id ? `SC-${user.id.slice(0, 6).toUpperCase()}` : 'SC-HOST');
                                  navigator.clipboard.writeText(codeToCopy);
                                  setCopiedReferral(true);
                                  setTimeout(() => setCopiedReferral(false), 2000);
                                }}
                                className="text-[10px] text-sky-400 hover:text-sky-300 font-bold transition-colors"
                              >
                                {copiedReferral ? 'COPIED!' : 'COPY'}
                              </button>
                            </div>
                            <p className="font-mono text-sm text-sky-400 font-bold mt-1.5 select-all">
                              {referralCode || user.user_metadata?.referral_code || (user?.id ? `SC-${user.id.slice(0, 6).toUpperCase()}` : 'SC-HOST')}
                            </p>
                          </div>
                        </div>
                      )}

                      <Link 
                        href="/contact"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-5 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        Help Centre
                      </Link>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full block px-5 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-white/5 transition-all text-left border-t border-white/5"
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. MOBILE MENU TOGGLE */}
          <div className="xl:hidden flex items-center z-[101]">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:text-[#0ea5e9] transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <Icon name={isMobileMenuOpen ? "XMarkIcon" : "Bars3Icon"} size={32} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-2xl xl:hidden flex flex-col items-center justify-start pt-32 pb-20 overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 sm:top-8 sm:right-12 p-3 text-white bg-white/5 hover:bg-white/10 hover:text-sky-400 rounded-full transition-all duration-300 z-[110] border border-white/10"
              aria-label="Close menu"
            >
              <Icon name="XMarkIcon" size={28} />
            </button>

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px]" />
            </div>
            <nav className="flex flex-col items-center gap-3 sm:gap-4 z-10 w-full px-6 max-w-sm mx-auto">
              {mobileNavLinks.map((link, i) => {
                const active = pathname === link.path;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + (i * 0.05), type: "spring", stiffness: 100 }}
                    className="w-full flex justify-center"
                  >
                    <Link
                      href={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center justify-center gap-3 px-6 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 w-full max-w-[280px] sm:max-w-[320px] border ${
                        active 
                          ? 'text-sky-400 bg-sky-500/15 border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.2)]' 
                          : 'text-zinc-200 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                        active 
                          ? 'text-sky-400 bg-sky-500/20' 
                          : 'text-zinc-400 group-hover:text-sky-400 group-hover:bg-sky-500/10'
                      }`}>
                        <Icon name={link.icon} size={22} />
                      </div>
                      <span className="text-lg sm:text-xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                        {link.name}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="mt-6 sm:mt-8 w-full max-w-[240px] sm:max-w-[280px]"
              >
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <Link 
                      href="/auth?role=guest" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2.5 w-full rounded-xl border border-sky-500/30 bg-sky-500/10 px-6 py-3.5 text-center text-sm font-black uppercase tracking-[0.15em] text-sky-400 transition-all hover:bg-sky-500 hover:text-white"
                    >
                      <Icon name="UserIcon" size={18} />
                      <span>Guest Login</span>
                    </Link>
                    <Link 
                      href="/auth?role=host" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2.5 w-full rounded-xl border border-sky-500/30 bg-sky-500/10 px-6 py-3.5 text-center text-sm font-black uppercase tracking-[0.15em] text-sky-400 transition-all hover:bg-sky-500 hover:text-white"
                    >
                      <Icon name="HomeModernIcon" size={18} />
                      <span>Host Login</span>
                    </Link>
                    <Link 
                      href="/auth?role=admin" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2.5 w-full rounded-xl border border-sky-500/30 bg-sky-500/10 px-6 py-3.5 text-center text-sm font-black uppercase tracking-[0.15em] text-sky-400 transition-all hover:bg-sky-500 hover:text-white"
                    >
                      <Icon name="ShieldCheckIcon" size={18} />
                      <span>Admin Login</span>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2.5 px-8 sm:px-12 py-3.5 sm:py-5 border border-sky-500/30 bg-sky-500/10 text-sky-400 font-black text-sm sm:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-sky-500 hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(14,165,233,0.15)] rounded-xl group"
                  >
                    <Icon name="ArrowRightOnRectangleIcon" size={20} className="transition-transform group-hover:translate-x-1" />
                    <span>Sign Out</span>
                  </button>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
