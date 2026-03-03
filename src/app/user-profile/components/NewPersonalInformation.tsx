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

/* ───── props ───── */
interface PersonalInformationProps {
  userInfo: PersonalInfo;
  setUserInfo: (info: PersonalInfo) => void;
  isEditing: boolean;
}

const PersonalInformation = ({ userInfo, setUserInfo, isEditing }: PersonalInformationProps) => {
  /* ── text-field handler ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  /* ── languages multi-select state ── */
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
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

  /* ── gender select handler ── */
  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserInfo({ ...userInfo, gender: e.target.value });
  };

  /* ── animation ── */
  const inputVariants = {
    initial: { opacity: 0, y: -10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.98 },
  };

  const inputClass =
    'w-full p-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl mt-1 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition-all duration-200 text-zinc-100 placeholder:text-zinc-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
      className="bg-transparent relative overflow-hidden"
    >
      <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">Personal Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Bio ── */}
        <div>
          <label className="text-sm font-semibold text-sky-400 mb-1 block">Bio</label>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.textarea
                key="bio-edit"
                name="bio"
                value={userInfo.bio || ''}
                onChange={handleChange}
                className={inputClass}
                rows={4}
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            ) : (
              <motion.p
                key="bio-view"
                className="text-zinc-200 mt-1"
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {userInfo.bio || <span className="text-zinc-500 italic">Not set</span>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Location ── */}
        <div>
          <label className="text-sm font-semibold text-sky-400 mb-1 block">Location</label>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="location-edit"
                type="text" name="location"
                value={userInfo.location || ''}
                onChange={handleChange}
                className={inputClass}
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            ) : (
              <motion.p
                key="location-view"
                className="text-zinc-200 mt-1"
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {userInfo.location || <span className="text-zinc-500 italic">Not set</span>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Languages — multi-select dropdown ── */}
        <div>
          <label className="text-sm font-semibold text-sky-400 mb-1 block">Languages</label>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="languages-edit"
                ref={langRef}
                className="relative mt-1"
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {/* Trigger — must be a div, not a button, because it contains inner buttons */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLangOpen((o) => !o)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLangOpen((o) => !o); } }}
                  className="w-full min-h-[46px] p-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-left flex flex-wrap gap-1.5 items-center focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition-all duration-200 cursor-pointer"
                >
                  {selectedLangs.length === 0 ? (
                    <span className="text-zinc-500 text-sm">Select languages…</span>
                  ) : (
                    selectedLangs.map((lang) => (
                      <span
                        key={lang}
                        className="inline-flex items-center gap-1 bg-sky-500/20 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-sky-500/30"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeLanguage(lang); }}
                          className="ml-0.5 text-sky-400 hover:text-white transition-colors leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                  {/* chevron */}
                  <span className={`ml-auto text-zinc-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </div>

                {/* Dropdown list */}
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl"
                    >
                      {LANGUAGE_OPTIONS.map((lang) => {
                        const selected = selectedLangs.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(lang)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                              ${selected
                                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                                : 'text-zinc-300 hover:bg-zinc-800'}`}
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
              <motion.div
                key="languages-view"
                className="flex flex-wrap gap-1.5 mt-2"
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {selectedLangs.length > 0 ? (
                  selectedLangs.map((lang) => (
                    <span
                      key={lang}
                      className="bg-sky-500/15 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-sky-500/20"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-500 italic text-sm">Not set</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Occupation ── */}
        <div>
          <label className="text-sm font-semibold text-sky-400 mb-1 block">Occupation</label>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="occupation-edit"
                type="text" name="occupation"
                value={userInfo.occupation || ''}
                onChange={handleChange}
                className={inputClass}
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            ) : (
              <motion.p
                key="occupation-view"
                className="text-zinc-200 mt-1"
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {userInfo.occupation || <span className="text-zinc-500 italic">Not set</span>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Gender — single-select dropdown ── */}
        <div>
          <label className="text-sm font-semibold text-sky-400 mb-1 block">Gender</label>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="gender-edit"
                className="relative mt-1"
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <select
                  name="gender"
                  value={userInfo.gender || ''}
                  onChange={handleGenderChange}
                  className="w-full appearance-none p-3 pr-10 bg-zinc-900/50 border border-zinc-700/50 rounded-xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition-all duration-200 text-zinc-100 cursor-pointer"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="" disabled className="text-zinc-500 bg-zinc-900">
                    Select gender…
                  </option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g} className="bg-zinc-900 text-zinc-100">
                      {g}
                    </option>
                  ))}
                </select>
                {/* custom chevron */}
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  ▾
                </span>
              </motion.div>
            ) : (
              <motion.p
                key="gender-view"
                className="text-zinc-200 mt-1"
                variants={inputVariants}
                initial="initial" animate="animate" exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {userInfo.gender || <span className="text-zinc-500 italic">Not set</span>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default PersonalInformation;
