'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ProfileProps {
  hostName: string;
  hostEmail: string;
  hostPhotoUrl: string;
  phoneNumber: string;
  address: string;
  bio: string;
  onUpdateHostName: (newName: string) => void;
  onUpdateHostEmail: (newEmail: string) => void;
  onUpdateHostPhoto: (newPhotoUrl: string) => void;
  onUpdatePhoneNumber: (newPhoneNumber: string) => void;
  onUpdateAddress: (newAddress: string) => void;
  onUpdateBio: (newBio: string) => void;
}

const Profile = ({
  hostName,
  hostEmail,
  hostPhotoUrl,
  phoneNumber,
  address,
  bio,
  onUpdateHostName,
  onUpdateHostEmail,
  onUpdateHostPhoto,
  onUpdatePhoneNumber,
  onUpdateAddress,
  onUpdateBio,
}: ProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(hostName);
  const [editedEmail, setEditedEmail] = useState(hostEmail);
  const [editedPhoneNumber, setEditedPhoneNumber] = useState(phoneNumber);
  const [editedAddress, setEditedAddress] = useState(address);
  const [editedBio, setEditedBio] = useState(bio);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(hostName);
    setEditedEmail(hostEmail);
    setEditedPhoneNumber(phoneNumber);
    setEditedAddress(address);
    setEditedBio(bio);
  }, [hostName, hostEmail, phoneNumber, address, bio]);

  const handleSave = () => {
    onUpdateHostName(editedName);
    onUpdateHostEmail(editedEmail);
    onUpdatePhoneNumber(editedPhoneNumber);
    onUpdateAddress(editedAddress);
    onUpdateBio(editedBio);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(hostName);
    setEditedEmail(hostEmail);
    setEditedPhoneNumber(phoneNumber);
    setEditedAddress(address);
    setEditedBio(bio);
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateHostPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 relative">

      {/* 1. Header Module */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5 w-full lg:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/30 to-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.3)] shrink-0">
            <Icon name="IdentificationIcon" size={32} className="text-sky-400 drop-shadow-md" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg truncate">Identity Control</h1>
            <p className="text-xs md:text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2 truncate whitespace-nowrap">
              Host Profile Management
            </p>
          </div>
        </div>
      </div>

      {/* 2. Deep Glassmorphic Content Container */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          {/* Avatar & Header Segment */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 pb-8 border-b border-white/10 mb-8">

            {/* Avatar Box */}
            <div className="relative group shrink-0">
              <div className={`w-32 h-32 rounded-[2rem] overflow-hidden bg-zinc-900 border-2 transition-all duration-300 ${isEditing ? 'border-sky-500/50 shadow-[0_0_30px_rgba(14,165,233,0.2)]' : 'border-white/10'}`}>
                {hostPhotoUrl ? (
                  <img src={hostPhotoUrl} alt="Host Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                    <Icon name="UserIcon" size={40} className="text-zinc-600 mb-2" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No Visual</span>
                  </div>
                )}
                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {isEditing && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-3 -right-3 p-3 bg-sky-500 text-white rounded-xl shadow-xl hover:bg-sky-400 transition-colors border-2 border-[#0a0a0f] z-20"
                  title="Change Photo"
                >
                  <Icon name="CameraIcon" size={20} />
                </button>
              )}
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            {/* Name Segment */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full text-3xl md:text-4xl font-heading font-black text-white bg-black/40 border border-white/10 hover:border-sky-500/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-zinc-600"
                />
              ) : (
                <div>
                  <h3 className="text-3xl md:text-4xl font-heading font-black text-white drop-shadow-md mb-2">{hostName}</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-sky-500/10 border-sky-500/20 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Verified Host</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grid Layout for Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icon name="EnvelopeIcon" size={14} /> Registered Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="w-full text-base font-bold text-white bg-black/40 border border-white/10 hover:border-sky-500/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              ) : (
                <p className="text-base font-bold text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5">{hostEmail}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icon name="DevicePhoneMobileIcon" size={14} /> Contact Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedPhoneNumber}
                  onChange={(e) => setEditedPhoneNumber(e.target.value)}
                  className="w-full text-base font-bold text-white bg-black/40 border border-white/10 hover:border-sky-500/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              ) : (
                <p className="text-base font-bold text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5">{phoneNumber || 'Not Provided'}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icon name="MapPinIcon" size={14} /> Residential Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  className="w-full text-base font-bold text-white bg-black/40 border border-white/10 hover:border-sky-500/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              ) : (
                <p className="text-base font-bold text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5">{address || 'Not Provided'}</p>
              )}
            </div>

            {/* Join Date - Static */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icon name="CalendarDaysIcon" size={14} /> System Origin
              </label>
              <div className="flex items-center gap-2 text-base font-bold text-zinc-400 bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5 cursor-not-allowed">
                <Icon name="LockClosedIcon" size={14} /> January 2024
              </div>
            </div>

            {/* Bio */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icon name="DocumentTextIcon" size={14} /> Strategic Bio
              </label>
              {isEditing ? (
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="w-full text-base font-medium text-white bg-black/40 border border-white/10 hover:border-sky-500/50 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all resize-none min-h-[120px]"
                  rows={4}
                />
              ) : (
                <div className="w-full text-base font-medium text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-4 min-h-[120px]">
                  {bio || <span className="text-zinc-600 italic">No biography provided.</span>}
                </div>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-8 pt-8 border-t border-white/10">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
                <button
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto px-8 py-3.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(14,165,233,0.15)] flex items-center justify-center gap-2"
                >
                  <Icon name="CheckCircleIcon" size={16} /> Finalize Configuration
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_25px_rgba(79,70,229,0.2)] flex items-center justify-center gap-2"
              >
                <Icon name="AdjustmentsHorizontalIcon" size={16} /> Modify Parameters
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
