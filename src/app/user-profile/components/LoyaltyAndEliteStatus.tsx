'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Achievement } from '@/lib/types';
import { Ticket, Star, Trophy, Crown } from 'lucide-react';

type LoyaltyAndEliteStatusProps = {
  achievements: Achievement[];
  totalBookings: number;
  rewardPoints: number;
};

const TIERS = {
  BRONZE: { name: 'Bronze', minBookings: 0, icon: 'ShieldCheckIcon' },
  SILVER: { name: 'Silver', minBookings: 5, icon: 'ShieldCheckIcon' },
  GOLD: { name: 'Gold', minBookings: 10, icon: 'ShieldCheckIcon' },
  ZENITH: { name: 'Zenith Elite', minBookings: 20, icon: 'ShieldCheckIcon' },
};

const getCurrentTier = (bookings: number) => {
  if (bookings >= TIERS.ZENITH.minBookings) return TIERS.ZENITH;
  if (bookings >= TIERS.GOLD.minBookings) return TIERS.GOLD;
  if (bookings >= TIERS.SILVER.minBookings) return TIERS.SILVER;
  return TIERS.BRONZE;
};

const LoyaltyAndEliteStatus = ({ achievements, totalBookings, rewardPoints }: LoyaltyAndEliteStatusProps) => {
  const currentTier = getCurrentTier(totalBookings);
  const nextTier =
    totalBookings < TIERS.ZENITH.minBookings
      ? Object.values(TIERS).find((t) => t.minBookings > totalBookings) || TIERS.ZENITH
      : TIERS.ZENITH;

  const progressPercentage = Math.min((totalBookings / nextTier.minBookings) * 100, 100);

  // Dynamically generate milestone achievements based on totalBookings
  const milestoneAchievements = [];
  if (totalBookings >= 1) {
    milestoneAchievements.push({
      id: 'm1', title: 'First\nTrip', description: 'Completed your first booking',
      icon: <Ticket className="w-6 h-6 text-white drop-shadow-md" />,
      bg: 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-blue-500/30'
    });
  }
  if (totalBookings >= 5) {
    milestoneAchievements.push({
      id: 'm2', title: 'Frequent\nTraveler', description: 'Completed 5 bookings',
      icon: <Star className="w-6 h-6 text-yellow-100 drop-shadow-md" fill="currentColor" />,
      bg: 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/30'
    });
  }
  if (totalBookings >= 10) {
    milestoneAchievements.push({
      id: 'm3', title: 'Globe\ntrotter', description: 'Completed 10 bookings',
      icon: <Trophy className="w-6 h-6 text-amber-100 drop-shadow-md" />,
      bg: 'bg-gradient-to-br from-red-500 to-rose-700 shadow-red-500/30'
    });
  }
  if (totalBookings >= 20) {
    milestoneAchievements.push({
      id: 'm4', title: 'Elite Voyager', description: 'Completed 20 bookings',
      icon: <Crown className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" />,
      bg: 'bg-gradient-to-br from-violet-500 to-fuchsia-700 shadow-fuchsia-500/30'
    });
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-[1.5rem] md:rounded-[2rem] shadow-xl p-4 md:p-6 shadow-sky-900/5">
      <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Loyalty & Elite Status</h2>

      {/* Zenith Tiers */}
      <div className="bg-zinc-950/40 border border-sky-500/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-center backdrop-blur-sm">
        <Icon name={currentTier.icon as any} className="w-10 h-10 md:w-16 md:h-16 mx-auto text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
        <h3 className="text-lg md:text-2xl font-bold mt-1.5 md:mt-2 text-white tracking-tight">{currentTier.name} Tier</h3>
        <p className="text-[11px] md:text-sm text-zinc-400">You have {totalBookings} total bookings.</p>

        <div className="mt-3 md:mt-4">
          <div className="flex justify-between text-[9px] md:text-xs text-sky-300/50 font-semibold uppercase tracking-wider">
            <span>{currentTier.name}</span>
            <span>{nextTier.name}</span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 md:h-2 mt-1.5 md:mt-2 border border-zinc-700/30 overflow-hidden">
            <motion.div
              className="bg-sky-500 h-1.5 md:h-2 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 mt-1.5 md:mt-2 font-medium">
            {totalBookings >= TIERS.ZENITH.minBookings
              ? 'You have reached the highest tier!'
              : `${nextTier.minBookings - totalBookings} bookings to ${nextTier.name}`
            }
          </p>
        </div>
      </div>

      <div className="mt-4 md:mt-6">
        {/* Milestone Badges */}
        <div>
          <h3 className="font-semibold text-sm md:text-base text-gray-300 mb-2 md:mb-3">Milestone Badges</h3>
          {milestoneAchievements.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 md:gap-5">
              {milestoneAchievements.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex flex-col items-center text-center"
                  title={`${badge.title} - ${badge.description}`}
                >
                  <div className={`p-2.5 md:p-3.5 rounded-full shadow-lg border border-white/20 flex items-center justify-center ${badge.bg}`}>
                    <div className="transform transition-transform group-hover:scale-110 [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-6 md:[&>svg]:h-6">
                      {badge.icon}
                    </div>
                  </div>
                  <p className="text-[9px] md:text-[10px] font-bold mt-1.5 md:mt-2 text-zinc-200 leading-tight whitespace-pre-line">{badge.title}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs md:text-sm text-zinc-500 italic">Complete bookings to earn badges.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyAndEliteStatus;
