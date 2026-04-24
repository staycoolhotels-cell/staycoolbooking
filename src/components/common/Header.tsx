'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { signOutUser } from '@/lib/auth-actions';

/**
 * Obsidian Sky Ultra-Luxury Header
 * Style: Deep Obsidian Foundation, Sky Blue Accents, Liquid Motion.
 */
const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  // Dynamic transformations for cinematic scroll scaling
  const headerHeight = useTransform(scrollY, [0, 100], ['100px', '70px']);
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']);

  useEffect(() => {
    // Initial fetch to sync state
    const syncUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    syncUser();

    // Auth state synchronization
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // 1. Clear local session via client-side Supabase
      await supabase.auth.signOut();

      // 2. Clear server components via server action - this must be in transition if it throws redirect
      React.startTransition(() => {
        signOutUser();
      });

      setUser(null);
      setIsMobileMenuOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
      setUser(null);
      // Fallback redirect if server action fails
      router.push('/');
      router.refresh();
    }
  };

  // Determine role-based navigation links
  const baseLinks = [
    { name: 'Home', path: '/homepage' },
    { name: 'About Us', path: '/about' },
    { name: 'Community', path: '/community' },
    { name: 'Contact', path: '/contact' },
  ];

  const role = user?.user_metadata?.role?.toLowerCase();

  const roleSpecificLinks = [];
  if (role === 'guest') {
    roleSpecificLinks.push({ name: 'User Profile', path: '/user-profile' });
  } else if (role === 'host') {
    roleSpecificLinks.push({ name: 'Host Panel', path: '/host-dashboard' });
  } else if (role === 'admin') {
    roleSpecificLinks.push({ name: 'Admin Panel', path: '/admin-panel' });
  }

  const navLinks = [...baseLinks, ...roleSpecificLinks];

  // Hide global header on admin panel pages - admin has its own dedicated header
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
              { }
              <div className="rounded-full border-2 border-sky-500/70 p-[4px] shadow-[0_0_10px_rgba(14,165,233,0.4)] flex items-center justify-center">
                <img
                  src="/assets/images/logo.png"
                  alt="StayCool Logo"
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </div>
              { }
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
                    className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${active ? 'text-[#0ea5e9]' : 'text-white/40 group-hover:text-white'
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

          {/* 3. ACTIONS: Desktop */}
          <div className="hidden xl:flex items-center gap-8">
            <AnimatePresence mode="wait">
              {!user?.id ? (
                <Link href="/auth">
                  <button className="relative group px-10 py-3 overflow-hidden border border-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-colors">
                    <span className="relative z-10 text-[9px] font-black uppercase tracking-widest text-[#0ea5e9] group-hover:text-black transition-colors duration-500">
                      Sign In
                    </span>
                    <motion.div className="absolute inset-0 bg-[#0ea5e9] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="relative group px-10 py-3 overflow-hidden border border-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-colors"
                >
                  <span className="relative z-10 text-[9px] font-black uppercase tracking-widest text-[#0ea5e9] group-hover:text-black transition-colors duration-500">
                    Sign Out
                  </span>
                  <motion.div className="absolute inset-0 bg-[#0ea5e9] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              )}
            </AnimatePresence>
          </div>

          {/* 4. MOBILE MENU TOGGLE */}
          <div className="xl:hidden flex items-center z-[101]">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:text-[#0ea5e9] transition-colors"
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

            <nav className="flex flex-col items-center gap-4 sm:gap-6 z-10 w-full px-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (i * 0.07), type: "spring", stiffness: 100 }}
                  className="w-full text-center"
                >
                  <Link
                    href={link.path}
                    className="block text-xl sm:text-2xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white hover:text-sky-400 transition-all duration-300 w-full py-2 sm:py-3"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                className="mt-8 sm:mt-12 w-full max-w-[240px] sm:max-w-[280px]"
              >
                {!user?.id ? (
                  <Link href="/auth">
                    <button className="w-full relative px-8 sm:px-12 py-3.5 sm:py-5 border border-sky-500/30 bg-sky-500/10 text-sky-400 font-black text-sm sm:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-sky-500 hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(14,165,233,0.15)] rounded-xl">
                      Sign In
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="w-full relative px-8 sm:px-12 py-3.5 sm:py-5 border border-sky-500/30 bg-sky-500/10 text-sky-400 font-black text-sm sm:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-sky-500 hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(14,165,233,0.15)] rounded-xl"
                  >
                    Sign Out
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
