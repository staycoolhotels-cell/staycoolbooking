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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setIsSaving(true);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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
    // Reset status to ensure UI reflects current state if needed, but mainly focusing on alert debug for now.

    try {
      console.log('Attempting to save user profile...', { user_id: user.id, name: user.name });

      // 1. Update Basic User Info
      const { error: userError } = await supabase
        .from('users')
        .update({ name: user.name, avatar_url: user.avatar_url })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating users table:', userError);
        throw new Error(`User Update Failed: ${userError.message}`);
      }

      // 2. Update Personal Info
      if (personalInfo) {
        console.log('Attempting to save personal info...', personalInfo);

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

        if (infoError) {
          console.error('Error updating user_personal_info table:', JSON.stringify(infoError, null, 2));
          throw new Error(`Personal Info Update Failed: ${infoError.message || JSON.stringify(infoError)}`);
        }
      }

      setIsEditing(false);
      showToast('Profile Securely Updated ✓');
    } catch (error: any) {
      console.error('FULL ERROR OBJECT:', error);
      // Fallback for empty error objects
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error occurred';
      showToast(`Error saving profile: ${errorMessage}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading')
    return <AnimatedLoader fullScreen text="Loading Profile..." />;

  const activeBooking = bookings.find((b) =>
    (b.status === 'confirmed' || b.status === 'pending_payment') &&
    new Date(b.check_out) >= new Date()
  ) || null;

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 font-sans selection:bg-sky-500/30">
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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

      {/* Dynamic Background Blurs - Matching Host Dashboard */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-sky-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-zinc-800/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[98%] mx-auto px-6 lg:px-8 py-4 space-y-8">
        {/* Luxury Navigation Header */}
        <header className="flex justify-between items-end">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <p className="text-sky-500 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              {greeting}
            </p>
            <h1 className="text-4xl font-light tracking-tight text-zinc-100">
              <span className="font-bold">{user?.name?.split(' ')[0]}</span>
            </h1>
          </motion.div>
          <div className="hidden md:flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 px-6 py-3 rounded-full backdrop-blur-xl shadow-lg shadow-sky-900/5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
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
              onFileChange={handleAvatarUpload}
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Main Dashboard Column */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-8">
            {activeBooking ? (
              <section className="space-y-8">
                <TripCommandCenter activeBooking={activeBooking} />
                <SmartItineraryBuilder activeBooking={activeBooking} />
              </section>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-[2rem] bg-zinc-900/20">
                <p className="text-zinc-500 font-light italic">No expeditions planned yet.</p>
                <button className="mt-4 text-xs font-bold text-sky-500 uppercase tracking-widest hover:text-sky-400 transition-colors">
                  Begin Discovery
                </button>
              </div>
            )}

            {/* Premium Financial Card */}
            <section className="group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">
                  Financial Treasury
                </h3>
                <div className="h-[1px] flex-grow mx-6 bg-gradient-to-r from-zinc-800 to-transparent" />
              </div>
              <FinancialTreasury transactions={transactions} />
            </section>



            <BookingHistory bookings={bookings} guestId={user?.id} />

            {/* Messages from Hosts */}
            {user && <GuestInbox guestId={user.id} />}

            <ReviewHistory reviews={reviews} userRole={user?.role || 'guest'} />
          </div>

          {/* Sidebar Widgets */}
          <aside className="space-y-12">
            <LoyaltyAndEliteStatus
              achievements={achievements}
              totalBookings={bookings.length}
              rewardPoints={user?.reward_points || 0}
            />
            <SmartWishlist wishlist={wishlist} userId={user?.id || ''} />
            {verifications && <VerificationAndTrust verifications={verifications} bookings={bookings} />}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInteractive;
