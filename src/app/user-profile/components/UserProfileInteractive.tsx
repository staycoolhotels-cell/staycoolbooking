'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import AnimatedLoader from '@/components/ui/AnimatedLoader';

// Component Imports
import TripCommandCenter from './TripCommandCenter';
import SmartItineraryBuilder from './SmartItineraryBuilder';
import FinancialTreasury from './FinancialTreasury';
import LoyaltyAndEliteStatus from './LoyaltyAndEliteStatus';
import SmartWishlist from './SmartWishlist';
import VerificationAndTrust from './VerificationAndTrust';
import ProfileHeader from './NewProfileHeader';
import ReviewHistory from './NewReviewHistory';
import BookingHistory from './BookingHistory';
import GuestInbox from './GuestInbox';

const UserProfileInteractive = ({ userData }: { userData: any }) => {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('success');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
  const [transactions, setTransactions] = useState<Transaction[]>(userData.transactions || []);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(userData.wishlist ?? []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTabState] = useState<'dashboard' | 'bookings' | 'finance' | 'inbox' | 'profile'>('dashboard');

  useEffect(() => {
    const tab = searchParams.get('tab') as any;
    if (tab && ['dashboard', 'bookings', 'finance', 'inbox', 'profile'].includes(tab)) {
      setActiveTabState(tab);
    }
  }, [searchParams]);

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabState(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', tab);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setIsSaving(true);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setUser({ ...user, avatar_url: publicUrl });
      showToast('Avatar updated! Click "Save Changes" to persist.');
    } catch (error: any) {
      showToast(`Error uploading avatar: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({ name: user.name, avatar_url: user.avatar_url })
        .eq('id', user.id);

      if (userError) throw new Error(`User Update Failed: ${userError.message}`);

      if (personalInfo) {
        const { error: infoError } = await supabase
          .from('user_personal_info')
          .upsert({
            user_id: user.id,
            bio: personalInfo.bio || '',
            languages: personalInfo.languages || [],
            location: personalInfo.location || null,
            occupation: personalInfo.occupation || null,
            dateOfBirth: personalInfo.dateOfBirth || null,
            nationality: personalInfo.nationality || null,
            gender: personalInfo.gender || null,
          }, { onConflict: 'user_id' });

        if (infoError) throw new Error(`Personal Info Update Failed: ${infoError.message || JSON.stringify(infoError)}`);
      }

      setIsEditing(false);
      showToast('Profile Securely Updated ✓');
    } catch (error: any) {
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error occurred';
      showToast(`Error saving profile: ${errorMessage}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') return <AnimatedLoader fullScreen text="Loading Profile..." />;

  const activeBooking = bookings.find((b) =>
    (b.status === 'confirmed' || b.status === 'pending_payment') &&
    new Date(b.check_out) >= new Date()
  ) || null;

  return (
    <div className="min-h-screen bg-[#070711] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-semibold
              ${toast.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-900/30'
                : 'bg-red-500/20 border-red-500/40 text-red-300 shadow-red-900/30'}`}
          >
            <span className="text-lg">{toast.type === 'success' ? '✓' : '✕'}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[70vw] h-[70vw] bg-indigo-600/8 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-32 w-[50vw] h-[50vw] bg-violet-600/6 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vw] bg-sky-500/5 rounded-full blur-[120px]" />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '200px 200px' }} />
      </div>

      {/* ── Cinematic Hero Banner ── */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden">
        {/* Layered gradient banner */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0d0e2a] to-violet-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-600/10 to-transparent" />

        {/* Bokeh orbs */}
        <div className="absolute top-8 left-[15%] w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-4 right-[20%] w-24 h-24 bg-violet-500/25 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-[40%] w-40 h-20 bg-sky-500/15 rounded-full blur-3xl" />
        <div className="absolute top-12 right-[8%] w-16 h-16 bg-indigo-400/20 rounded-full blur-xl" />

        {/* Horizontal scan-line effect */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(99,102,241,0.08) 3px, rgba(99,102,241,0.08) 4px)' }} />

        {/* Bottom fade to page bg */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#070711] to-transparent" />

        {/* Greeting + breadcrumb — top-left of hero */}
        <div className="absolute bottom-8 left-6 md:left-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-indigo-400 text-[9px] md:text-[10px] font-black tracking-[0.4em] uppercase mb-1">
              {greeting} ·&nbsp;Member Portal
            </p>
            <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white drop-shadow-xl">
              <span className="font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                {user?.name?.split(' ')[0]}
              </span>
              <span className="text-indigo-200/60">'s</span>
              <span className="text-zinc-400 font-light ml-2 text-xl md:text-3xl">Profile</span>
            </h1>
          </motion.div>
        </div>

        {/* Live badge — top-right of hero */}
        <div className="absolute top-6 right-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 bg-zinc-950/70 border border-indigo-500/20 px-4 py-2 rounded-full backdrop-blur-xl shadow-lg shadow-indigo-900/10"
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400">Secure Session</span>
          </motion.div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="relative z-10 w-full max-w-[98%] mx-auto px-4 md:px-8 -mt-4 pb-16 space-y-8">

        {/* Profile Header Card */}
        {user && (
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 140, damping: 22 }}
          >
            <ProfileHeader
              user={user}
              setUser={setUser}
              isEditing={isEditing}
              onEditToggle={() => setIsEditing(true)}
              onSave={handleSave}
              isSaving={isSaving}
              onFileChange={handleAvatarUpload}
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
            />
          </motion.div>
        )}

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
            { id: 'bookings', label: 'History', icon: '📋' },
            { id: 'finance', label: 'Finance', icon: '💳' },
            { id: 'inbox', label: 'Inbox', icon: '✉️' },
            { id: 'profile', label: 'Identity', icon: '👤' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0
                ${activeTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">

          {/* ── Main Column ── */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  {/* Trip Command Center */}
                  {activeBooking ? (
                    <motion.section className="space-y-8">
                      <TripCommandCenter activeBooking={activeBooking} />
                      <SmartItineraryBuilder activeBooking={activeBooking} />
                    </motion.section>
                  ) : (
                    <motion.div className="h-56 flex flex-col items-center justify-center border border-dashed border-indigo-900/50 rounded-[2rem] bg-indigo-950/10 backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <p className="text-zinc-500 font-light italic text-sm">No expeditions planned yet.</p>
                    </motion.div>
                  )}

                  {/* Loyalty Snippet in Dashboard */}
                  <LoyaltyAndEliteStatus
                    achievements={achievements}
                    totalBookings={bookings.length}
                    rewardPoints={user?.reward_points || 0}
                  />
                </motion.div>
              )}

              {activeTab === 'finance' && (
                <motion.section
                  key="finance"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="group"
                >
                  <SectionLabel icon="💳" label="Financial Treasury" />
                  <FinancialTreasury transactions={transactions} />
                </motion.section>
              )}

              {activeTab === 'bookings' && (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <SectionLabel icon="📋" label="Booking History" />
                  <BookingHistory bookings={bookings} guestId={user?.id} />
                </motion.div>
              )}

              {activeTab === 'inbox' && user && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <SectionLabel icon="✉️" label="Guest Inbox" />
                  <GuestInbox guestId={user.id} />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <SectionLabel icon="👤" label="Trust and Verification" />
                  {verifications && (
                    <VerificationAndTrust verifications={verifications} bookings={bookings} />
                  )}
                  <div className="pt-4">
                    <SectionLabel icon="⭐" label="Your Reviews" />
                    <ReviewHistory reviews={reviews} userRole={user?.role || 'guest'} />
                  </div>
                  <div className="pt-4">
                    <SectionLabel icon="💎" label="Wishlist" />
                    <SmartWishlist wishlist={wishlist} userId={user?.id || ''} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

/* ── Section Label Helper ── */
const SectionLabel = ({ icon, label }: { icon: string; label: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-base">{icon}</span>
    <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">{label}</h3>
    <div className="h-px flex-grow bg-gradient-to-r from-zinc-800/80 to-transparent" />
  </div>
);

export default UserProfileInteractive;
