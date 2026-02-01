'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { UserVerificationStatus } from '@/lib/types';

type VerificationAndTrustProps = {
  verifications: UserVerificationStatus;
};

const VerificationAndTrust = ({ verifications }: VerificationAndTrustProps) => {
  const verifiedItems = Object.entries(verifications)
    .filter(([key, value]) => value === true && key !== 'user_id')
    .map(([key]) => {
      const text = key
        .replace('is', '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
      return {
        name: text,
        icon: `MailIcon`, // This should be dynamic in real app
      };
    });

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to border border-border rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Verification & Trust Center</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Vault */}
        <div className="bg-gray-800/40 rounded-xl p-4">
          <h3 className="font-semibold text-gray-300 mb-3">Secure Document Vault</h3>
          <p className="text-xs text-gray-400 mb-4">
            Upload your ID for faster bookings. Documents are encrypted and only shared with hosts
            upon confirmation.
          </p>

          {verifications.isIdVerified ? (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 text-center">
              <Icon name="CheckCircle2Icon" className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="font-semibold text-white">ID Verified</p>
              <p className="text-xs text-gray-400">Passport ending in ****5678</p>
              <button className="text-xs text-red-400 mt-2 hover:underline">Remove</button>
            </div>
          ) : (
            <button className="w-full bg-blue-600/30 text-blue-300 border border-blue-500/50 rounded-lg py-3 font-semibold flex items-center justify-center gap-2 hover:bg-blue-600/40 transition">
              <Icon name="UploadCloudIcon" size={16} />
              Upload Passport/ID
            </button>
          )}
        </div>

        {/* Host Direct Link */}
        <div className="bg-gray-800/40 rounded-xl p-4">
          <h3 className="font-semibold text-gray-300 mb-3">Host Direct Link</h3>
          <p className="text-xs text-gray-400 mb-4">
            After booking, you can start a secure, encrypted chat with your host directly.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-lg">
              <img
                src="https://i.pravatar.cc/150?u=host1"
                alt="Host"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold text-white">Nikhil, Host in Manali</p>
                <p className="text-xs text-gray-500">
                  Chat for booking: <span className="font-mono">#UPC-01</span>
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="ml-auto p-2 bg-primary/20 rounded-full hover:bg-primary/30"
              >
                <Icon name="MessageSquareIcon" size={18} className="text-primary" />
              </motion.button>
            </div>
            <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-lg opacity-60">
              <img
                src="https://i.pravatar.cc/150?u=host2"
                alt="Host"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold text-white">Riya, Host in Goa</p>
                <p className="text-xs text-gray-500">Chat locked until booking.</p>
              </div>
              <div className="ml-auto p-2 bg-gray-700 rounded-full">
                <Icon name="LockIcon" size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationAndTrust;
