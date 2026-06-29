'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';
import { BASE_URL } from '@/lib/constants';

interface ProfileProps {
  hostName: string;
  hostEmail: string;
  hostPhotoUrl: string;
  phoneNumber: string;
  address: string;
  bio: string;
  gender: string;
  onUpdateHostName: (newName: string) => void;
  onUpdateHostEmail: (newEmail: string) => void;
  onUpdateHostPhoto: (newPhotoUrl: string) => void;
  onUpdatePhoneNumber: (newPhoneNumber: string) => void;
  onUpdateAddress: (newAddress: string) => void;
  onUpdateBio: (newBio: string) => void;
  onUpdateGender: (newGender: string) => void;
  cancellationCount?: number;
  referralCode?: string;
  referralBenefitCount?: number;
  onSaveProfile?: (newData: any) => void;
  onAvatarUpload?: (file: File) => void;
  isSaving?: boolean;
}

const Profile = ({
  hostName,
  hostEmail,
  hostPhotoUrl,
  phoneNumber,
  address,
  bio,
  gender,
  onUpdateHostName,
  onUpdateHostEmail,
  onUpdateHostPhoto,
  onUpdatePhoneNumber,
  onUpdateAddress,
  onUpdateBio,
  onUpdateGender,
  onSaveProfile,
  onAvatarUpload,
  isSaving,
  cancellationCount = 0,
  referralCode = '',
  referralBenefitCount = 0,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(hostName);
  const [editedEmail, setEditedEmail] = useState(hostEmail);
  const [editedPhoneNumber, setEditedPhoneNumber] = useState(phoneNumber);
  const [editedAddress, setEditedAddress] = useState(address);
  const [editedBio, setEditedBio] = useState(bio);
  const [editedGender, setEditedGender] = useState(gender);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(hostName);
    setEditedEmail(hostEmail);
    setEditedPhoneNumber(phoneNumber);
    setEditedAddress(address);
    setEditedBio(bio);
    setEditedGender(gender);
  }, [hostName, hostEmail, phoneNumber, address, bio, gender]);

  const handleSave = () => {
    if (onSaveProfile) {
      onSaveProfile({
        name: editedName,
        email: editedEmail,
        phone: editedPhoneNumber,
        address: editedAddress,
        bio: editedBio,
        gender: editedGender,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(hostName);
    setEditedEmail(hostEmail);
    setEditedPhoneNumber(phoneNumber);
    setEditedAddress(address);
    setEditedBio(bio);
    setEditedGender(gender);
    setIsEditing(false);
  };

  const getDicebearUrl = () => {
    const isMale = (editedGender || gender)?.toLowerCase() === 'male';
    const isFemale = (editedGender || gender)?.toLowerCase() === 'female';
    let seed = hostName;
    
    if (isMale) seed = 'male-' + hostName;
    if (isFemale) seed = 'female-' + hostName;
    
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const defaultAvatar = getDicebearUrl();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 relative">

      {/* 1. Header Module */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-12 w-full">


          <div className="flex-1 w-full max-w-xl p-2 md:p-3 bg-red-500/5 border border-amber-500/20 rounded-2xl relative overflow-hidden group">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="mt-0.5 p-1 md:p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 shrink-0">
                <Icon name="ExclamationTriangleIcon" size={24} className="text-amber-500 md:hidden" />
                <Icon name="ExclamationTriangleIcon" size={30} className="text-amber-500 hidden md:block" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[9px] md:text-[11px] font-bold text-white leading-tight">
                  5 బుకింగ్స్ కంటే ఎక్కువ బుకింగ్స్ను రిజెక్ట్ చేస్తే మీ అకౌంట్ లాక్ చేయబడుతుంది. మళ్లీ అకౌంట్ ఓపెన్ చేయించుకోవాలంటే ₹299 పెనాల్టీ చెల్లించాలి.
                </p>
                <p className="text-[8px] md:text-[11px] text-amber-500/60 font-black uppercase tracking-wider leading-none mt-1">
                  If you reject more than 5 bookings, your account will be locked. To reopen your account, you need to pay a penalty of ₹299.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Deep Glassmorphic Content Container */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          {/* Avatar & Header Segment */}
          <div className="flex flex-row items-center gap-4 md:gap-8 pb-6 md:pb-8 border-b border-white/10 mb-6 md:mb-8">

            {/* Avatar Box */}
            <div className="relative group shrink-0">
              <div className={`w-20 h-20 md:w-32 md:h-32 rounded-[1.25rem] md:rounded-[2rem] overflow-hidden bg-zinc-900 border-2 transition-all duration-300 ${isEditing ? 'border-sky-500/50 shadow-[0_0_30px_rgba(14,165,233,0.2)]' : 'border-white/10'}`}>
                {hostPhotoUrl ? (
                  <img src={hostPhotoUrl} alt="Host Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <img src={defaultAvatar} alt="Host Avatar" className="w-full h-full object-cover" />
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
                  className="w-full text-2xl md:text-4xl font-heading font-black text-white bg-black/40 border border-white/10 hover:border-sky-500/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder:text-zinc-600"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black text-white drop-shadow-md">{hostName}</h3>
                    {Number(cancellationCount) >= 5 && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-red-600 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse">
                        <Icon name="NoSymbolIcon" size={12} className="text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Access Locked</span>
                      </div>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-sky-500/10 border-sky-500/20 backdrop-blur-md w-fit h-fit shrink-0">
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
                <p className="text-base font-bold text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5 break-all">{hostEmail}</p>
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
                <p className="text-base font-bold text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5 break-all">{phoneNumber || 'Not Provided'}</p>
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
                <p className="text-base font-bold text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5 break-all">{address || 'Not Provided'}</p>
              )}
            </div>

            {/* Join Date - Static */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icon name="CalendarDaysIcon" size={14} /> System Origin
              </label>
              <div className="flex items-center gap-2 text-base font-bold text-zinc-400 bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5 cursor-not-allowed">
                <Icon name="LockClosedIcon" size={14} /> June 2026
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icon name="UserIcon" size={14} /> Gender Identity
              </label>
              {isEditing ? (
                <select
                  value={editedGender}
                  onChange={(e) => setEditedGender(e.target.value)}
                  className="w-full text-base font-bold text-white bg-black/40 border border-white/10 hover:border-sky-500/50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-zinc-900">Select Gender</option>
                  <option value="Male" className="bg-zinc-900">Male</option>
                  <option value="Female" className="bg-zinc-900">Female</option>
                  <option value="Other" className="bg-zinc-900">Other</option>
                  <option value="Prefer not to say" className="bg-zinc-900">Prefer not to say</option>
                </select>
              ) : (
                <p className="text-base font-bold text-white bg-white/[0.02] border border-transparent rounded-xl px-4 py-3.5 break-all">{gender || 'Not Specified'}</p>
              )}
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
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(14,165,233,0.15)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span>Saving Parameters...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="CheckCircleIcon" size={16} />
                      <span>Finalize Configuration</span>
                    </>
                  )}
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

      {/* 3. Referral Program Module */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-5 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8 pb-5 md:pb-6 border-b border-white/10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2.5 md:p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shrink-0">
                <Icon name="GiftIcon" size={20} className="text-amber-500 md:hidden" />
                <Icon name="GiftIcon" size={24} className="text-amber-500 hidden md:block" />
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-black text-white italic leading-tight">Host Referral Reward</h3>
                <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Invite others & Save on Commission</p>
              </div>
            </div>

            {referralBenefitCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none">
                  {referralBenefitCount} x 5% Commission Available
                </span>
              </div>
            )}
          </div>

          <div className="max-w-3xl space-y-4">
            {/* Referral Instruction */}
            <p className="text-xs md:text-sm text-zinc-400 font-medium leading-relaxed">
              Refer a new host to <span className="text-sky-400 font-bold">StayCool</span>. When they register their host account, you'll receive a <span className="text-emerald-400 font-bold">50% discount</span> on the platform commission (reducing it to 5%) for your next 5 bookings.
            </p>

            <div className="flex flex-col gap-4 max-w-xl">
              {/* Referral Link Box */}
              <div className="flex items-center gap-3 md:gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Your Referral Link</span>
                  <p className="text-xs md:text-sm font-bold text-sky-400 truncate">
                    {`${BASE_URL}/signup?ref=${referralCode}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const link = `${BASE_URL}/signup?ref=${referralCode}`;
                    navigator.clipboard.writeText(link);
                    alert('Referral link copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                >
                  Copy Link
                </button>
              </div>

              {/* Referral Code Card */}
              <div className="bg-gradient-to-br from-zinc-900 to-black p-4 px-5 rounded-2xl border border-white/5 relative group overflow-hidden flex flex-col justify-center">
                <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Direct Code</span>
                <div className="flex items-center justify-between gap-4 relative z-10">
                  <div className="text-xl font-black text-white tracking-tighter selection:bg-sky-500/30 whitespace-nowrap overflow-hidden">
                    {referralCode || 'NOT-SET'}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      alert('Referral code copied!');
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
