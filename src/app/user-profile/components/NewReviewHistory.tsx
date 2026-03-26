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
  const [showAll, setShowAll] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
      className="bg-zinc-900/60 p-8 rounded-[2rem] shadow-xl border border-zinc-800 relative overflow-hidden backdrop-blur-sm hover:bg-zinc-900/80 transition-colors duration-500" // Zinc Glass
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-wide">Review History</h2>
        {reviews.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            {showAll ? 'Show Less' : `Show All (${reviews.length})`}
            <div className={`transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`}>
              <Icon name="ChevronDownIcon" size={14} />
            </div>
          </button>
        )}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {reviews && reviews.length > 0 ? (
          (showAll ? reviews : reviews.slice(0, 4)).map((review) => (
            <motion.div
              key={review.id}
              variants={itemVariants}
              whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(14, 165, 233, 0.1)' }} // Sky glow on hover
              className="p-6 border border-zinc-800/50 rounded-2xl bg-zinc-900/40 cursor-pointer relative overflow-hidden hover:border-sky-500/30 transition-colors" // Darker item background and border
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
                      className={i < review.rating ? 'text-sky-400' : 'text-zinc-600'}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-gray-200 italic">"{review.comment}"</p> {/* Light gray text */}
              <p className="text-sm text-gray-400 text-right mt-2">- {review.guestName || 'Host'}</p>{' '}
              {/* Subtle gray text */}
            </motion.div>
          ))
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center bg-zinc-900/20">
            <p className="text-zinc-500 font-light italic">No reviews yet.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReviewHistory;
