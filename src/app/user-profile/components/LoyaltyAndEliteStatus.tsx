'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Achievement } from '@/lib/types';

type LoyaltyAndEliteStatusProps = {
  achievements: Achievement[];
  totalBookings: number;
};

const TIERS = {
  BRONZE: { name: 'Bronze', minBookings: 0, icon: 'ShieldBronze' },
  SILVER: { name: 'Silver', minBookings: 5, icon: 'ShieldSilver' },
  GOLD: { name: 'Gold', minBookings: 10, icon: 'ShieldGold' },
  ZENITH: { name: 'Zenith Elite', minBookings: 20, icon: 'ShieldZenith' },
};

const getCurrentTier = (bookings: number) => {
  if (bookings >= TIERS.ZENITH.minBookings) return TIERS.ZENITH;
  if (bookings >= TIERS.GOLD.minBookings) return TIERS.GOLD;
  if (bookings >= TIERS.SILVER.minBookings) return TIERS.SILVER;
  return TIERS.BRONZE;
};

const LoyaltyAndEliteStatus = ({ achievements, totalBookings }: LoyaltyAndEliteStatusProps) => {
  const currentTier = getCurrentTier(totalBookings);
  const nextTier =
    totalBookings < TIERS.ZENITH.minBookings
      ? Object.values(TIERS).find((t) => t.minBookings > totalBookings) || TIERS.ZENITH
      : TIERS.ZENITH;

  const progressPercentage = (totalBookings / nextTier.minBookings) * 100;
  const milestoneAchievements = achievements.filter((a) => a.type === 'Milestone');

  // Simple reward points calculation
  const rewardPoints = totalBookings * 100 + milestoneAchievements.length * 50;

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to border border-border rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Loyalty & Elite Status</h2>

      {/* Zenith Tiers */}
      <div className="bg-gray-800/40 rounded-xl p-4 text-center">
        <Icon name={currentTier.icon as any} className="w-16 h-16 mx-auto text-primary" />
        <h3 className="text-2xl font-bold mt-2 text-white">{currentTier.name} Tier</h3>
        <p className="text-sm text-gray-400">You have {totalBookings} total bookings.</p>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{currentTier.name}</span>
            <span>{nextTier.name}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {nextTier.minBookings - totalBookings} bookings to {nextTier.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Milestone Badges */}
        <div>
          <h3 className="font-semibold text-gray-300 mb-2">Milestone Badges</h3>
          <div className="grid grid-cols-4 gap-3">
            {milestoneAchievements.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex flex-col items-center text-center"
                title={`${badge.title} - ${badge.description}`}
              >
                <div className="bg-gray-700/50 p-3 rounded-full">
                  <Icon name={badge.icon as any} className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-xs mt-1 text-gray-400">{badge.title}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reward Wallet */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl flex flex-col items-center justify-center p-4">
          <Icon name="WalletIcon" size={32} className="text-primary" />
          <p className="text-4xl font-bold text-white mt-2">{rewardPoints}</p>
          <p className="text-sm text-primary font-semibold">Reward Points</p>
          <button className="text-xs mt-2 bg-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary/30">
            Use on Next Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyAndEliteStatus;
