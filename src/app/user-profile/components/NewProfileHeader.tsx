'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PersonalInfo } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import PersonalInformation from './NewPersonalInformation';

interface ProfileHeaderProps {
  user: User;
  setUser: (user: User) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  isSaving: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  personalInfo?: PersonalInfo | null;
  setPersonalInfo?: (info: PersonalInfo) => void;
}

const ProfileHeader = ({
  user,
  setUser,
  isEditing,
  onEditToggle,
  onSave,
  isSaving,
  onFileChange,
  personalInfo,
  setPersonalInfo,
}: ProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /* derive a tier from points */
  const points = (user as any).reward_points ?? 0;
  const tier =
    points >= 5000 ? { label: 'Obsidian', color: 'from-zinc-300 to-zinc-500', dot: 'bg-zinc-300' } :
      points >= 2000 ? { label: 'Platinum', color: 'from-sky-300 to-indigo-400', dot: 'bg-sky-300' } :
        points >= 800 ? { label: 'Gold', color: 'from-amber-300 to-yellow-500', dot: 'bg-amber-300' } :
          { label: 'Silver', color: 'from-zinc-400 to-zinc-300', dot: 'bg-zinc-400' };

  return (
    <motion.div
      className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-sky-950/40 border border-sky-500/10"
      layout
    >
      {/* Card gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/90 via-[#0e0e24]/95 to-sky-950/70 backdrop-blur-2xl" />

      {/* Inner subtle glow top-left */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-sky-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Border highlight line */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ── Content ── */}
      <div className="relative z-10 p-6 md:p-8 lg:p-10">

        {/* Top Row: Avatar + Name/Email + Action Button */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">

          {/* ── Avatar section ── */}
          <div className="relative flex-shrink-0" onClick={handleAvatarClick}>
            {/* Glow ring */}
            <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${tier.color} opacity-60 blur-sm transition-all duration-500 ${isEditing ? 'opacity-100 blur-md scale-105' : ''}`} />
            <div className={`relative p-[3px] rounded-full bg-gradient-to-br ${tier.color}`}>
              <div className="relative rounded-full overflow-hidden">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9'}
                  alt={user.name}
                  className={`w-28 h-28 md:w-36 md:h-36 rounded-full object-cover transition-all duration-300 ${isEditing ? 'cursor-pointer brightness-75' : ''}`}
                />
                {/* Camera overlay on edit */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icon name="CameraIcon" size={28} className="text-white" />
                      <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Change</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tier badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-950/90 border border-sky-500/20 backdrop-blur-sm shadow-lg`}>
                <div className={`w-1.5 h-1.5 rounded-full ${tier.dot} shadow-[0_0_6px_rgba(14,165,233,0.6)]`} />
                <span className={`text-[9px] font-black uppercase tracking-widest bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                  {tier.label}
                </span>
              </div>
            </div>
          </div>

          {/* ── Name / Email / Meta ── */}
          <div className="flex-1 text-center md:text-left pt-1 min-w-0">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing-name"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex flex-col mb-1"
                >
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-400 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="bg-sky-950/40 border-b-2 border-sky-500 text-white text-2xl md:text-4xl font-bold px-2 py-1 outline-none rounded-t-lg focus:ring-0 max-w-md transition-all"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="view-name"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent leading-tight">
                    {user.name}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-sm md:text-base text-sky-300/70 font-medium mt-1 tracking-wide truncate">
              {user.email}
            </p>

            {/* Meta badges row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-sky-500/10 border border-sky-500/20 text-sky-300">
                ✦ Guest Member
              </span>
              {points > 0 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  {points.toLocaleString()} pts
                </span>
              )}
              {(personalInfo as any)?.location && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-zinc-500/10 border border-zinc-700/40 text-zinc-400">
                  📍 {(personalInfo as any).location}
                </span>
              )}
            </div>
          </div>

          {/* ── Edit / Save CTA ── */}
          <div className="flex-shrink-0 self-start md:self-center">
            <motion.button
              onClick={isEditing ? onSave : onEditToggle}
              disabled={isSaving}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative overflow-hidden px-7 py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-lg ${isEditing
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sky-700/40 hover:shadow-sky-600/60'
                  : 'bg-sky-500/10 text-sky-200 border border-sky-500/25 hover:bg-sky-500/20 hover:border-sky-400/40 backdrop-blur-md'
                }`}
            >
              {/* Shine sweep on save button */}
              {isEditing && (
                <span className="absolute inset-0 -skew-x-12 translate-x-[-120%] bg-white/10 group-hover:translate-x-[120%] transition-transform duration-700 ease-in-out pointer-events-none" />
              )}
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </span>
              ) : isEditing ? (
                '✓ Save Changes'
              ) : (
                '✎ Edit Profile'
              )}
            </motion.button>
          </div>
        </div>

        {/* ── Personal Information ── */}
        {personalInfo && setPersonalInfo && (
          <div className="mt-8 pt-8 border-t border-sky-500/10 w-full">
            <PersonalInformation
              userInfo={personalInfo}
              setUserInfo={setPersonalInfo}
              isEditing={isEditing}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
