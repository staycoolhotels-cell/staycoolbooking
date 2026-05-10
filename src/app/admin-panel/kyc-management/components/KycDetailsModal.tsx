'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

type KycRecord = {
  id: string;
  user_id: string;
  legal_business_name: string;
  email: string;
  phone: string;
  pan_number: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_beneficiary_name: string;
  razorpay_account_id: string | null;
  razorpay_product_id: string | null;
  kyc_status: 'pending' | 'under_review' | 'activated' | 'needs_clarification' | 'suspended';
  kyc_error_message: string | null;
  created_at: string;
  updated_at: string;
  host_name: string;
  host_email: string;
};

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
  pending: { label: 'Pending', cls: 'bg-zinc-700/60 text-zinc-300 border border-zinc-600', icon: 'ClockIcon' },
  under_review: { label: 'Under Review', cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', icon: 'DocumentMagnifyingGlassIcon' },
  activated: { label: 'Activated ✓', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', icon: 'CheckBadgeIcon' },
  needs_clarification: { label: 'Needs Clarification', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30', icon: 'ExclamationCircleIcon' },
  suspended: { label: 'Suspended', cls: 'bg-red-500/15 text-red-400 border border-red-500/30', icon: 'NoSymbolIcon' },
};

interface KycDetailsModalProps {
  record: KycRecord;
  onClose: () => void;
}

const Field = ({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) => (
  <div>
    <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{label}</span>
    <p className={`text-zinc-200 text-sm break-all ${mono ? 'font-mono' : ''}`}>
      {value || <span className="text-zinc-600 italic">Not provided</span>}
    </p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/10 pb-2">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const KycDetailsModal = ({ record, onClose }: KycDetailsModalProps) => {
  const cfg = statusConfig[record.kyc_status] || statusConfig.pending;
  // Mask bank account: show only last 4 digits
  const maskedAccount = record.bank_account_number
    ? '••••' + record.bank_account_number.slice(-4)
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0a0a0f] z-10 rounded-t-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="bg-brand-deep/20 border border-brand-default/20 rounded-full p-2">
                  <Icon name="IdentificationIcon" size={20} className="text-brand-default" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-zinc-100">{record.host_name}</h2>
                  <p className="text-xs text-zinc-500">{record.host_email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
                {cfg.label}
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">

            {/* Error Message (if any) */}
            {record.kyc_error_message && (
              <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <Icon name="ExclamationTriangleIcon" size={18} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">KYC Error / Clarification Required</p>
                  <p className="text-sm text-orange-300">{record.kyc_error_message}</p>
                </div>
              </div>
            )}

            {/* Business Info */}
            <Section title="Business Information">
              <Field label="Legal Business Name" value={record.legal_business_name} />
              <Field label="PAN Number" value={record.pan_number} mono />
              <Field label="Email" value={record.email} />
              <Field label="Phone" value={record.phone} />
            </Section>

            {/* Bank Details */}
            <Section title="Bank Account Details">
              <Field label="Account Number" value={maskedAccount} mono />
              <Field label="IFSC Code" value={record.bank_ifsc} mono />
              <Field label="Beneficiary Name" value={record.bank_beneficiary_name} />
            </Section>

            {/* Razorpay Info */}
            <Section title="Razorpay Route Details">
              <Field label="Linked Account ID" value={record.razorpay_account_id} mono />
              <Field label="Route Product ID" value={record.razorpay_product_id} mono />
            </Section>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Submitted On</span>
                <p className="text-zinc-300 text-sm">
                  {record.created_at ? new Date(record.created_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Last Updated</span>
                <p className="text-zinc-300 text-sm">
                  {record.updated_at ? new Date(record.updated_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-[#0a0a0f] rounded-b-2xl flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl font-heading font-semibold text-sm transition-all duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KycDetailsModal;
