'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalInfo } from '@/lib/types';

interface PersonalInformationProps {
  userInfo: PersonalInfo;
  setUserInfo: (info: PersonalInfo) => void;
  isEditing: boolean;
}

const PersonalInformation = ({ userInfo, setUserInfo, isEditing }: PersonalInformationProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'languages') {
      setUserInfo({ ...userInfo, [name]: value.split(',').map((lang) => lang.trim()) });
    } else {
      setUserInfo({ ...userInfo, [name]: value });
    }
  };

  const inputVariants = {
    initial: { opacity: 0, y: -10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.98 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
      className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 relative overflow-hidden" // Subtle border and shadow-inner for neometric feel
    >
      <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">Personal Information</h2>{' '}
      {/* White text, wider tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-semibold text-blue-300 mb-1 block">Bio</label>{' '}
          {/* Blue label for futuristic glow */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.textarea
                key="bio-edit"
                name="bio"
                value={userInfo.bio}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg mt-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 text-gray-200" // Dark input, blue focus, light text
                rows={4}
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            ) : (
              <motion.p
                key="bio-view"
                className="text-gray-200 mt-1" // Light gray text
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {userInfo.bio}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div>
          <label className="text-sm font-semibold text-blue-300 mb-1 block">Location</label>{' '}
          {/* Blue label for futuristic glow */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="location-edit"
                type="text"
                name="location"
                value={userInfo.location}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg mt-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 text-gray-200" // Dark input, blue focus, light text
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            ) : (
              <motion.p
                key="location-view"
                className="text-gray-200 mt-1" // Light gray text
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {userInfo.location}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div>
          <label className="text-sm font-semibold text-blue-300 mb-1 block">Languages</label>{' '}
          {/* Blue label for futuristic glow */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="languages-edit"
                type="text"
                name="languages"
                value={Array.isArray(userInfo.languages) ? userInfo.languages.join(', ') : ''}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg mt-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 text-gray-200" // Dark input, blue focus, light text
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            ) : (
              <motion.p
                key="languages-view"
                className="text-gray-200 mt-1" // Light gray text
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {Array.isArray(userInfo.languages) ? userInfo.languages.join(', ') : ''}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div>
          <label className="text-sm font-semibold text-blue-300 mb-1 block">Occupation</label>{' '}
          {/* Blue label for futuristic glow */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="occupation-edit"
                type="text"
                name="occupation"
                value={userInfo.occupation}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg mt-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 text-gray-200" // Dark input, blue focus, light text
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            ) : (
              <motion.p
                key="occupation-view"
                className="text-gray-200 mt-1" // Light gray text
                variants={inputVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {userInfo.occupation}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalInformation;
