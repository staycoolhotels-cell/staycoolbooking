'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabaseClient';

interface ProfileHeaderProps {
  user: User;
  setUser: (user: User) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  isSaving: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileHeader = ({
  user,
  setUser,
  isEditing,
  onEditToggle,
  onSave,
  isSaving,
  onFileChange,
}: ProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <motion.div className="relative p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-gray-800">
      <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm"></div>

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
          className={`relative p-1 rounded-full border-2 transition-all ${isEditing ? 'border-blue-500 cursor-pointer animate-pulse' : 'border-transparent'}`}
        >
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9'}
            alt={user.name}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gray-800 shadow-2xl"
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
              <span className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-widest">
                Editing Name
              </span>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="bg-gray-800 border-b-2 border-blue-500 text-white text-3xl md:text-5xl font-bold px-2 py-1 outline-none w-full md:w-auto"
              />
            </div>
          ) : (
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
              {user.name}
            </h1>
          )}
        </AnimatePresence>
        <p className="text-lg mt-2 text-blue-400 font-medium tracking-wide">{user.email}</p>
      </div>

      <div className="relative z-10">
        <button
          onClick={isEditing ? onSave : onEditToggle}
          disabled={isSaving}
          className={`px-10 py-4 rounded-full font-bold transition-all ${isEditing ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
