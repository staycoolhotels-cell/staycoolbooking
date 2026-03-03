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

  return (
    <>
      <motion.header
        style={{ height: headerHeight, backgroundColor: headerBg }}
        className="fixed top-0 left-0 w-full z-[100] flex items-center px-4 sm:px-12"
      >
        <div className="w-full flex items-center justify-between">
          {/* 1. BRANDING: Magnetic Reveal with Sky Blue Glow */}
          <Link href="/homepage" className="group flex items-center gap-4 z-[101]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.2)] bg-white p-1 border border-zinc-200"
            >
              <AppImage
                src="/assets/images/logo.png"
                alt="StayCool Logo"
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="overflow-hidden">
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="block text-[14px] sm:text-xl font-black uppercase tracking-tighter text-white group-hover:text-[#0ea5e9] transition-colors duration-500"
              >
                StayCool Booking
              </motion.span>
            </div>
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
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-[#050505] xl:hidden flex flex-col items-center justify-start pt-32 pb-20 overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-12 p-2 text-white hover:text-[#0ea5e9] transition-colors z-[110]"
              aria-label="Close menu"
            >
              <Icon name="XMarkIcon" size={32} />
            </button>

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#0ea5e9]/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#0ea5e9]/5 rounded-full blur-[100px]" />
            </div>

            <nav className="flex flex-col items-center gap-8 z-10 w-full px-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (i * 0.05) }}
                  className="w-full text-center"
                >
                  <Link
                    href={link.path}
                    className="block text-2xl font-bold uppercase tracking-widest text-white hover:text-[#0ea5e9] transition-colors w-full py-2"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                {!user?.id ? (
                  <Link href="/auth">
                    <button className="relative px-12 py-4 border border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9] font-black uppercase tracking-widest hover:bg-[#0ea5e9] hover:text-white transition-all duration-300">
                      Sign In
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="relative px-12 py-4 border border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9] font-black uppercase tracking-widest hover:bg-[#0ea5e9] hover:text-white transition-all duration-300"
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
