'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalInfo } from '@/lib/types';

/* ───── constants ───── */
const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi',
  'Bengali', 'Gujarati', 'Punjabi', 'Urdu', 'Spanish', 'French', 'German',
  'Japanese', 'Chinese', 'Arabic', 'Portuguese', 'Russian', 'Korean',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

/* ───── Field icon map (emoji-based, no extra deps) ───── */
const FIELD_ICONS: Record<string, string> = {
  bio: '✍️',
  location: '📍',
  languages: '🌐',
  occupation: '💼',
  gender: '🪪',
};

/* ───── props ───── */
interface PersonalInformationProps {
  userInfo: PersonalInfo;
  setUserInfo: (info: PersonalInfo) => void;
  isEditing: boolean;
}

const PersonalInformation = ({ userInfo, setUserInfo, isEditing }: PersonalInformationProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  /* ── languages multi-select ── */
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLangs: string[] = Array.isArray(userInfo.languages) ? userInfo.languages : [];

  const toggleLanguage = (lang: string) => {
    const next = selectedLangs.includes(lang)
      ? selectedLangs.filter((l) => l !== lang)
      : [...selectedLangs, lang];
    setUserInfo({ ...userInfo, languages: next });
  };

  const removeLanguage = (lang: string) => {
    setUserInfo({ ...userInfo, languages: selectedLangs.filter((l) => l !== lang) });
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserInfo({ ...userInfo, gender: e.target.value });
  };

  /* ── shared input class ── */
  const inputClass =
    'w-full p-3 bg-sky-950/30 border border-sky-500/20 rounded-xl mt-1 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all duration-200 text-zinc-100 placeholder:text-zinc-600 text-sm';

  /* ── tile wrapper ── */
  const FieldTile = ({
    icon, label, children,
  }: { icon: string; label: string; children: React.ReactNode }) => (
    <div className="group relative p-5 rounded-2xl bg-zinc-900/40 border border-sky-500/10 hover:border-sky-500/25 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/60">
      {/* Icon + label header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-[0.28em] text-sky-400/80">{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Personal Information</h2>
        <div className="h-px flex-grow bg-gradient-to-r from-sky-500/20 to-transparent" />
        {isEditing && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full">
            Editing
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* ── Bio ── */}
        <div className="sm:col-span-2 xl:col-span-3">
          <FieldTile icon={FIELD_ICONS.bio} label="Bio">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.textarea
                  key="bio-edit"
                  name="bio"
                  value={userInfo.bio || ''}
                  onChange={handleChange}
                  className={inputClass}
                  rows={3}
                  placeholder="Tell guests a little about yourself…"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                />
              ) : (
                <motion.p
                  key="bio-view"
                  className={`text-sm leading-relaxed ${userInfo.bio ? 'text-zinc-300' : 'text-zinc-600 italic'}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  {userInfo.bio || 'Not set'}
                </motion.p>
              )}
            </AnimatePresence>
          </FieldTile>
        </div>

        {/* ── Location ── */}
        <FieldTile icon={FIELD_ICONS.location} label="Location">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="location-edit"
                type="text" name="location"
                value={userInfo.location || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="City, Country"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              />
            ) : (
              <motion.p key="location-view" className={`text-sm ${userInfo.location ? 'text-zinc-300' : 'text-zinc-600 italic'}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {userInfo.location || 'Not set'}
              </motion.p>
            )}
          </AnimatePresence>
        </FieldTile>

        {/* ── Occupation ── */}
        <FieldTile icon={FIELD_ICONS.occupation} label="Occupation">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="occupation-edit"
                type="text" name="occupation"
                value={userInfo.occupation || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="Your role / profession"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              />
            ) : (
              <motion.p key="occupation-view" className={`text-sm ${userInfo.occupation ? 'text-zinc-300' : 'text-zinc-600 italic'}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {userInfo.occupation || 'Not set'}
              </motion.p>
            )}
          </AnimatePresence>
        </FieldTile>

        {/* ── Gender ── */}
        <FieldTile icon={FIELD_ICONS.gender} label="Gender">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div key="gender-edit" className="relative mt-1"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                <select
                  name="gender"
                  value={userInfo.gender || ''}
                  onChange={handleGenderChange}
                  className={`${inputClass} appearance-none cursor-pointer pr-9`}
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="" disabled className="bg-zinc-900 text-zinc-500">Select gender…</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g} className="bg-zinc-900 text-zinc-100">{g}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-sky-400 text-xs mt-0.5">▾</span>
              </motion.div>
            ) : (
              <motion.p key="gender-view" className={`text-sm ${userInfo.gender ? 'text-zinc-300' : 'text-zinc-600 italic'}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {userInfo.gender || 'Not set'}
              </motion.p>
            )}
          </AnimatePresence>
        </FieldTile>

        {/* ── Languages (full width) ── */}
        <div className="sm:col-span-2 xl:col-span-3">
          <FieldTile icon={FIELD_ICONS.languages} label="Languages">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="languages-edit"
                  ref={langRef}
                  className="relative mt-1"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                >
                  {/* Trigger */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setLangOpen((o) => !o)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLangOpen((o) => !o); } }}
                    className="w-full min-h-[44px] p-3 bg-sky-950/30 border border-sky-500/20 rounded-xl text-left flex flex-wrap gap-1.5 items-center focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all duration-200 cursor-pointer hover:border-sky-400/50"
                  >
                    {selectedLangs.length === 0 ? (
                      <span className="text-zinc-600 text-sm">Select languages…</span>
                    ) : (
                      selectedLangs.map((lang) => (
                        <span key={lang} className="inline-flex items-center gap-1 bg-sky-500/20 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-sky-500/30">
                          {lang}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeLanguage(lang); }}
                            className="ml-0.5 text-sky-400 hover:text-white transition-colors leading-none"
                          >×</button>
                        </span>
                      ))
                    )}
                    <span className={`ml-auto text-sky-400 transition-transform duration-200 text-xs ${langOpen ? 'rotate-180' : ''}`}>▾</span>
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-1.5 w-full max-h-52 overflow-y-auto bg-zinc-950 border border-sky-500/20 rounded-2xl shadow-2xl shadow-black/60 backdrop-blur-2xl"
                      >
                        {LANGUAGE_OPTIONS.map((lang) => {
                          const selected = selectedLangs.includes(lang);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => toggleLanguage(lang)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between first:rounded-t-2xl last:rounded-b-2xl
                                ${selected
                                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                                  : 'text-zinc-300 hover:bg-sky-950/60'}`}
                            >
                              {lang}
                              {selected && <span className="text-sky-400 text-xs">✓</span>}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div key="languages-view" className="flex flex-wrap gap-1.5 mt-1"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {selectedLangs.length > 0 ? (
                    selectedLangs.map((lang) => (
                      <span key={lang} className="bg-sky-500/15 text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-sky-500/20 uppercase tracking-wider">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-600 italic text-sm">Not set</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </FieldTile>
        </div>

      </div>
    </motion.div>
  );
};

export default PersonalInformation;
