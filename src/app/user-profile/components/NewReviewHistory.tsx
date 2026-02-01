'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Review } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';

interface ReviewHistoryProps {
  reviews: Review[];
  userRole: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      stiffness: 100,
      damping: 20,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const starVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
};

const ReviewHistory = ({ reviews, userRole }: ReviewHistoryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
      className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 relative overflow-hidden" // Subtle border and shadow-inner for neomorphic feel
    >
      <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">Review History</h2>{' '}
      {/* White text, wider tracking */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)' }} // Blue glow on hover
            className="p-4 border border-gray-700 rounded-lg bg-gray-800 cursor-pointer relative overflow-hidden" // Darker item background and border
          >
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={starVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: 0.3,
                    delay: i * 0.05 + 0.1,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  <Icon
                    name="StarIcon"
                    size={16}
                    className={i < review.rating ? 'text-blue-400' : 'text-gray-600'}
                  />
                </motion.div>
              ))}
            </div>
            <p className="text-gray-200 italic">"{review.comment}"</p> {/* Light gray text */}
            <p className="text-sm text-gray-400 text-right mt-2">- {review.guestName}</p>{' '}
            {/* Subtle gray text */}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ReviewHistory;
