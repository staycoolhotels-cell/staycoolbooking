'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Review,
  PersonalInfo,
  Achievement,
  UserVerificationStatus,
  Booking,
  Transaction,
  WishlistItem,
  Property,
} from '@/lib/types';

// Component Imports
import TripCommandCenter from './TripCommandCenter';
import SmartItineraryBuilder from './SmartItineraryBuilder';
import FinancialTreasury from './FinancialTreasury';
import LoyaltyAndEliteStatus from './LoyaltyAndEliteStatus';
import SmartWishlist from './SmartWishlist';
import VerificationAndTrust from './VerificationAndTrust';
import ProfileHeader from './NewProfileHeader';
import PersonalInformation from './NewPersonalInformation';
import ReviewHistory from './NewReviewHistory';

const UserProfileInteractive = ({ userData }: { userData: any }) => {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('success');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [greeting, setGreeting] = useState('');

  // Data States
  const [user, setUser] = useState<User | null>(userData);
  const [verifications, setVerifications] = useState<UserVerificationStatus | null>(
    userData.verifications
  );
  const [reviews, setReviews] = useState<Review[]>(userData.reviews);
  const [bookings, setBookings] = useState<(Booking & { properties: Partial<Property> })[]>(
    userData.bookings
  );
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(userData);
  const [achievements, setAchievements] = useState<Achievement[]>(userData.achievements);
  const [transactions, setTransactions] = useState<Transaction[]>(userData.transactions);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(userData.wishlist);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase
        .from('users')
        .update({ name: user.name, avatar_url: user.avatar_url })
        .eq('id', user.id);
      if (personalInfo)
        await supabase.from('user_personal_info').upsert({ ...personalInfo, user_id: user.id });
      setIsEditing(false);
      alert('Profile Securely Updated');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading')
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-blue-500 font-bold tracking-[0.5em] text-xs uppercase"
        >
          Stay Cool
        </motion.div>
      </div>
    );

  const activeBooking = bookings.find((b) => new Date(b.check_in) > new Date()) || null;

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-500/30">
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Luxury Navigation Header */}
        <header className="flex justify-between items-end">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <p className="text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              {greeting}
            </p>
            <h1 className="text-4xl font-light tracking-tight">
              Stay Cool, <span className="font-bold">{user?.name?.split(' ')[0]}</span>
            </h1>
          </motion.div>
          <div className="hidden md:flex items-center gap-4 bg-white/[0.03] border border-white/10 px-6 py-3 rounded-full backdrop-blur-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
              Secure Profile Active
            </span>
          </div>
        </header>

        {/* Profile Header Component */}
        {user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ProfileHeader
              user={user}
              setUser={setUser}
              isEditing={isEditing}
              onEditToggle={() => setIsEditing(true)}
              onSave={handleSave}
              isSaving={isSaving}
              onFileChange={function (event: React.ChangeEvent<HTMLInputElement>): void {
                throw new Error('Function not implemented.');
              }}
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Dashboard Column */}
          <div className="lg:col-span-2 space-y-12">
            {activeBooking ? (
              <section className="space-y-12">
                <TripCommandCenter activeBooking={activeBooking} />
                <SmartItineraryBuilder activeBooking={activeBooking} />
              </section>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                <p className="text-gray-500 font-light italic">No expeditions planned yet.</p>
                <button className="mt-4 text-xs font-bold text-blue-400 uppercase tracking-widest hover:text-white transition-colors">
                  Begin Discovery
                </button>
              </div>
            )}

            {/* Premium Financial Card */}
            <section className="group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">
                  Financial Treasury
                </h3>
                <div className="h-[1px] flex-grow mx-6 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <FinancialTreasury transactions={transactions} />
            </section>

            {/* Personal Info with Loading Skeleton Wrapper */}
            <section>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">
                Identity & Bio
              </h3>
              <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 hover:bg-white/[0.04] transition-all duration-500">
                {personalInfo ? (
                  <PersonalInformation
                    userInfo={personalInfo}
                    setUserInfo={setPersonalInfo}
                    isEditing={isEditing}
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-700 animate-pulse">
                    Syncing personal records...
                  </div>
                )}
              </div>
            </section>

            <ReviewHistory reviews={reviews} userRole={user?.role || 'guest'} />
          </div>

          {/* Sidebar Luxury Widgets */}
          <aside className="space-y-12">
            {/* Verification Circle Widget */}
            <div className="relative group p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-all" />
              <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-400 mb-8">
                Trust Ecosystem
              </h4>
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-blue-500"
                      strokeDasharray={226}
                      initial={{ strokeDashoffset: 226 }}
                      animate={{ strokeDashoffset: 226 - (226 * 85) / 100 }}
                      transition={{ duration: 1.5 }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    85%
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white mb-1">Excellent Standing</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Your account is in the top 5% of secure travelers.
                  </p>
                </div>
              </div>
            </div>

            <LoyaltyAndEliteStatus
              achievements={achievements}
              totalBookings={Number(user?.totalBookings) || 0}
            />
            <SmartWishlist wishlist={wishlist} />
            {verifications && <VerificationAndTrust verifications={verifications} />}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInteractive;
