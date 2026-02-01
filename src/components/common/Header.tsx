'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
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
  const pathname = usePathname();
  const { scrollY } = useScroll();

  // Dynamic transformations for cinematic scroll scaling
  const headerHeight = useTransform(scrollY, [0, 100], ['100px', '70px']);
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(5, 5, 5, 0)', 'rgba(5, 5, 5, 1)']);

  useEffect(() => {
    // Auth state synchronization
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOutUser();
  };

  const navLinks = [
    { name: 'Home', path: '/homepage' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Book Now', path: '/guest-booking-flow' },
    { name: 'User Profile', path: '/user-profile' },
    { name: 'Host', path: '/host-dashboard' },
    { name: 'Admin', path: '/admin-panel' },
  ];

  return (
    <motion.header
      style={{ height: headerHeight, backgroundColor: headerBg }}
      className="fixed top-0 left-0 w-full z-[100] flex items-center px-12 transition-colors duration-500"
    >
      <div className="max-w-[1800px] w-full mx-auto flex items-center justify-between">
        {/* 1. BRANDING: Magnetic Reveal with Sky Blue Glow */}
        <Link href="/homepage" className="group flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-12 h-12 bg-gradient-to-tr from-[#0ea5e9] to-[#38bdf8] rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)]"
          >
            <Icon name="HomeIcon" className="text-black" size={20} />
          </motion.div>
          <div className="overflow-hidden">
            <motion.span
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="block text-2xl font-black uppercase tracking-tighter text-white group-hover:text-[#0ea5e9] transition-colors duration-500"
            >
              StayCool Booking
            </motion.span>
          </div>
        </Link>

        {/* 2. NAVIGATION: Liquid Sky Hover Effects */}
        <nav className="hidden lg:flex items-center gap-12">
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

        {/* 3. ACTIONS: Staggered Entrance with Neon Feedback */}
        <div className="flex items-center gap-8">
          <AnimatePresence mode="wait">
            {!user ? (
              <Link href="/auth">
                <button className="relative group px-10 py-3 overflow-hidden border border-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-colors">
                  <span className="relative z-10 text-[9px] font-black uppercase tracking-widest text-[#0ea5e9] group-hover:text-black transition-colors duration-500">
                    Sign In
                  </span>
                  {/* Sliding block animation from original styles */}
                  <motion.div className="absolute inset-0 bg-[#0ea5e9] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              </Link>
            ) : (
              <Link href="#" onClick={handleLogout}>
                <button className="relative group px-10 py-3 overflow-hidden border border-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-colors">
                  <span className="relative z-10 text-[9px] font-black uppercase tracking-widest text-[#0ea5e9] group-hover:text-black transition-colors duration-500">
                    Sign Out
                  </span>
                  {/* Sliding block animation from original styles */}
                  <motion.div className="absolute inset-0 bg-[#0ea5e9] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              </Link>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
