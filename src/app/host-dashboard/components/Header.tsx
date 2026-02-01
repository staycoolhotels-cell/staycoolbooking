'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hostName: string;
  hostPhotoUrl: string;
}

/**
 * Premium Navigation Header (Floating Dock)
 * Replaces the traditional sidebar with a center-aligned glassy navigation bar.
 */
const Header = ({ activeTab, setActiveTab, hostName, hostPhotoUrl }: HeaderProps) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
    { id: 'properties', label: 'Properties', icon: 'HomeIcon' },
    { id: 'bookings', label: 'Bookings', icon: 'CalendarDaysIcon' },
    { id: 'earnings', label: 'Earnings', icon: 'BanknotesIcon' },
    { id: 'profile', label: 'Profile', icon: 'UserCircleIcon' },
  ];

  return (
    <header className="sticky top-6 z-50 w-full px-6 flex justify-center">
      <div className="w-full max-w-7xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* 1. BRANDING SECTION */}
        <div className="flex items-center gap-3 pl-4">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.4)]">
            <Icon name="SparklesIcon" className="text-white" size={20} />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-heading font-bold tracking-tighter text-white">
              StayCool
            </span>
            <p className="text-[8px] uppercase tracking-[0.3em] text-primary font-black leading-none">
              Portal
            </p>
          </div>
        </div>

        {/* 2. CENTER NAVIGATION DOCK [The core nav logic] */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === item.id ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {/* Sliding Active Background */}
              {activeTab === item.id && (
                <motion.div
                  layoutId="navGlow"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon
                  name={item.icon}
                  size={16}
                  className={activeTab === item.id ? 'text-primary' : ''}
                />
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* 3. PROFILE & NOTIFICATION ISLAND */}
        <div className="flex items-center gap-4 pr-2">
          {/* Notification Button */}
          <button className="p-2.5 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all group relative">
            <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-[#050505] animate-pulse" />
            <Icon name="BellIcon" size={20} className="text-white/60 group-hover:text-white" />
          </button>

          {/* User Profile Container */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-none mb-1">{hostName}</p>
              <p className="text-[10px] font-black text-primary uppercase tracking-tighter">
                Verified Host
              </p>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('profile')}>
              <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
              <img
                src={hostPhotoUrl}
                className="relative w-11 h-11 rounded-full border-2 border-white/10 object-cover shadow-lg hover:border-primary transition-colors"
                alt="Host Profile"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
