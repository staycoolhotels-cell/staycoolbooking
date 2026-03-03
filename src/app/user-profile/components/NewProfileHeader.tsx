'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, PersonalInfo } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabaseClient';
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

  return (
    <motion.div className="relative p-8 rounded-[2rem] shadow-2xl shadow-sky-900/5 flex flex-col bg-zinc-900/30 backdrop-blur-xl border border-zinc-800">
      <div className="absolute inset-0 z-0 bg-transparent"></div>

      {/* Top Row */}
      <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 w-full">
        {/* Hidden File Input for Gallery */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Avatar Display */}
        <div className="relative z-10" onClick={handleAvatarClick}>
          <div
            className={`relative p-1 rounded-full border-2 transition-all ${isEditing ? 'border-sky-500 cursor-pointer animate-pulse' : 'border-transparent'}`}
          >
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9'}
              alt={user.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-sky-500/10 shadow-2xl"
            />
            {isEditing && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Icon name="CameraIcon" size={32} className="text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <div className="flex flex-col">
                <span className="text-xs text-sky-400 font-bold mb-1 uppercase tracking-widest">
                  Editing Name
                </span>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="bg-zinc-800 border-b-2 border-sky-500 text-white text-3xl md:text-5xl font-bold px-2 py-1 outline-none w-full md:w-auto"
                />
              </div>
            ) : (
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                {user.name}
              </h1>
            )}
          </AnimatePresence>
          <p className="text-lg mt-2 text-sky-400 font-medium tracking-wide">{user.email}</p>
        </div>

        <div className="relative z-10">
          <button
            onClick={isEditing ? onSave : onEditToggle}
            disabled={isSaving}
            className={`px-10 py-4 rounded-full font-bold transition-all ${isEditing ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/40' : 'bg-sky-500/10 text-sky-200 border border-sky-500/20 hover:bg-sky-500/20 backdrop-blur-md'}`}
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Personal Info — always visible; editable only when isEditing */}
      {personalInfo && setPersonalInfo && (
        <div className="relative z-10 mt-8 pt-8 border-t border-zinc-800 w-full text-left">
          <PersonalInformation
            userInfo={personalInfo}
            setUserInfo={setPersonalInfo}
            isEditing={isEditing}
          />
        </div>
      )}
    </motion.div>
  );
};

export default ProfileHeader;
