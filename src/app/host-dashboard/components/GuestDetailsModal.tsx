'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PersonalInfo, UserVerificationStatus } from '@/lib/types';
import { getGuestProfileForHost } from '@/lib/guest-actions';

interface GuestDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const GuestDetailsModal: React.FC<GuestDetailsModalProps> = ({ userId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState<User | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [verifications, setVerifications] = useState<UserVerificationStatus | null>(null);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      fetchGuestDetails();
    }
  }, [isOpen, userId]);

  const fetchGuestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getGuestProfileForHost(userId);
      
      if (result.success && result.data) {
        setGuest(result.data.guest);
        setPersonalInfo(result.data.personalInfo);
        setVerifications(result.data.verifications);
        setBookingCount(result.data.bookingCount);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching guest details:', error);
      setError(error.message || 'Failed to fetch guest details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0a0a0f]/90 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          {/* Header Background Decoration */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />

          <div className="relative z-10 p-8">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-zinc-500 font-medium animate-pulse">Fetching guest profile...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                 <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Icon name="ExclamationTriangleIcon" size={32} className="text-red-500" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-lg font-bold text-white">Guest Not Found</h2>
                    <p className="text-sm text-zinc-500 max-w-[250px] mx-auto leading-relaxed">
                      {error}
                    </p>
                 </div>
                 <button 
                  onClick={fetchGuestDetails}
                  className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                 >
                   Try Again
                 </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                      {guest?.avatar_url ? (
                        <img src={guest.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="UserIcon" size={40} className="text-zinc-600" />
                      )}
                    </div>
                    {verifications?.isIdVerified && (
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg border-2 border-[#0a0a0f] shadow-lg">
                        <Icon name="CheckBadgeIcon" size={14} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-black text-white">{guest?.name || 'Guest User'}</h2>
                    <p className="text-zinc-400 font-medium">{guest?.email}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          {guest?.role || 'Guest'}
                       </span>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                         guest?.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                       }`}>
                          {guest?.status || 'Pending'}
                       </span>
                    </div>
                  </div>
                </div>

                {/* Personal Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-sm font-medium text-zinc-300">{personalInfo?.location || 'Not provided'}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nationality</p>
                    <p className="text-sm font-medium text-zinc-300">{personalInfo?.nationality || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Bookings</p>
                    <p className="text-sm font-medium text-zinc-300">{bookingCount} Bookings</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Languages</p>
                    <p className="text-sm font-medium text-zinc-300">
                      {personalInfo?.languages && personalInfo.languages.length > 0 
                        ? personalInfo.languages.join(', ') 
                        : 'English'}
                    </p>
                  </div>
                </div>

                {/* Bio Section */}
                {personalInfo?.bio && (
                  <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Icon name="ChatBubbleBottomCenterTextIcon" size={12} />
                       About this guest
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-400 italic">
                      "{personalInfo.bio}"
                    </p>
                  </div>
                )}

                {/* Verification Status */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Trust & Verification</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Icon name="EnvelopeIcon" size={16} className="text-zinc-500" />
                        <span className="text-sm text-zinc-300 font-medium">Email Address</span>
                      </div>
                      {verifications?.isEmailVerified ? (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          Verified <Icon name="CheckCircleIcon" size={14} />
                        </span>
                      ) : (
                         <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Unverified</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Icon name="PhoneIcon" size={16} className="text-zinc-500" />
                        <span className="text-sm text-zinc-300 font-medium">Phone Number</span>
                      </div>
                      {verifications?.isPhoneVerified ? (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          Verified <Icon name="CheckCircleIcon" size={14} />
                        </span>
                      ) : (
                         <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Unverified</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Icon name="IdentificationIcon" size={16} className="text-zinc-500" />
                        <span className="text-sm text-zinc-300 font-medium">Identity Document</span>
                      </div>
                      {verifications?.isIdVerified ? (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          Verified <Icon name="CheckCircleIcon" size={14} />
                        </span>
                      ) : (
                         <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Unverified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GuestDetailsModal;
