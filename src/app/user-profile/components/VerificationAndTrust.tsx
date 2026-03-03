'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { UserVerificationStatus, Booking, Property } from '@/lib/types';

type VerificationAndTrustProps = {
  verifications: UserVerificationStatus;
  bookings?: (Booking & { properties: Partial<Property> })[];
};

const VerificationAndTrust = ({ verifications, bookings = [] }: VerificationAndTrustProps) => {
  const verifiedItems = Object.entries(verifications)
    .filter(([key, value]) => value === true && key !== 'user_id')
    .map(([key]) => {
      const text = key
        .replace('is', '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
      return {
        name: text,
        icon: `DocumentCheckIcon`, // This should be dynamic in real app
      };
    });

  // Extract unique hosts from bookings
  const uniqueHosts = bookings.reduce<Array<{ name: string; avatar: string; location?: string }>>((acc, booking) => {
    const host = booking.properties?.host;
    if (host && !acc.some((h) => h.name === host.name)) {
      acc.push({
        name: host.name,
        avatar: host.avatar,
        location: booking.properties.location
      });
    }
    return acc;
  }, []).slice(0, 3); // Limit to 3 recent hosts

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] shadow-xl p-6 shadow-sky-900/5">
      <h2 className="text-xl font-bold text-white mb-4">Verification & Trust Center</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Vault */}
        <div className="bg-zinc-800/40 rounded-xl p-4">
          <h3 className="font-semibold text-zinc-300 mb-3">Secure Document Vault</h3>
          <p className="text-xs text-zinc-400 mb-4">
            Upload your ID for faster bookings. Documents are encrypted and only shared with hosts
            upon confirmation.
          </p>

          {verifications.isIdVerified ? (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 text-center">
              <Icon name="CheckCircleIcon" className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="font-semibold text-white">ID Verified</p>
              <p className="text-xs text-gray-400">Passport ending in ****5678</p>
              <button className="text-xs text-red-400 mt-2 hover:underline">Remove</button>
            </div>
          ) : (
            <button className="w-full bg-sky-600/30 text-sky-300 border border-sky-500/50 rounded-lg py-3 font-semibold flex items-center justify-center gap-2 hover:bg-sky-600/40 transition">
              <Icon name="CloudArrowUpIcon" size={16} />
              Upload Passport/ID
            </button>
          )}
        </div>

        {/* Host Direct Link */}
        <div className="bg-zinc-800/40 rounded-xl p-4">
          <h3 className="font-semibold text-zinc-300 mb-3">Host Direct Link</h3>
          <p className="text-xs text-zinc-400 mb-4">
            After booking, you can start a secure, encrypted chat with your host directly.
          </p>
          <div className="space-y-3">
            {uniqueHosts.length > 0 ? (
              uniqueHosts.map((host, index) => (
                <div key={index} className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg">
                  <img
                    src={host.avatar || `https://ui-avatars.com/api/?name=${host.name}&background=random`}
                    alt={host.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white text-sm">{host.name}</p>
                    <p className="text-xs text-zinc-500">
                      {host.location ? `Host in ${host.location}` : 'Property Host'}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      alert(`Starting secure chat with ${host.name}... Redirecting to inbox.`);
                      // window.location.href = `/inbox?host=${encodeURIComponent(host.name)}`;
                    }}
                    className="ml-auto p-2 bg-primary/20 rounded-full hover:bg-primary/30"
                  >
                    <Icon name="MessageSquareIcon" size={16} className="text-primary" />
                  </motion.button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-xs">
                No active host chats found. Book a stay to unlock direct messaging.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationAndTrust;
