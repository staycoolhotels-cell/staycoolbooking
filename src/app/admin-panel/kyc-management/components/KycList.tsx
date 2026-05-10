'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';
import KycDetailsModal from './KycDetailsModal';

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

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-zinc-700/60 text-zinc-300 border border-zinc-600' },
  under_review: { label: 'Under Review', cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  activated: { label: 'Activated', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  needs_clarification: { label: 'Needs Clarification', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
  suspended: { label: 'Suspended', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

const FILTERS = ['all', 'pending', 'under_review', 'activated', 'needs_clarification', 'suspended'];

interface KycListProps {
  initialRecords: KycRecord[];
}

const KycList = ({ initialRecords }: KycListProps) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);

  const filtered = useMemo(() => {
    return initialRecords.filter(r => {
      const matchStatus = filter === 'all' || r.kyc_status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.host_name.toLowerCase().includes(q) ||
        r.host_email.toLowerCase().includes(q) ||
        r.legal_business_name.toLowerCase().includes(q) ||
        (r.razorpay_account_id || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [initialRecords, filter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: initialRecords.length };
    initialRecords.forEach(r => { c[r.kyc_status] = (c[r.kyc_status] || 0) + 1; });
    return c;
  }, [initialRecords]);

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
        {['pending', 'under_review', 'activated', 'needs_clarification', 'suspended'].map(s => {
          const cfg = statusConfig[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl p-3 md:p-4 border text-left transition-all duration-200 ${filter === s ? cfg.cls + ' scale-[1.02]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
            >
              <p className="text-xl md:text-2xl font-bold font-heading">{counts[s] || 0}</p>
              <p className="text-[10px] md:text-xs mt-1 uppercase tracking-wider md:tracking-widest font-semibold">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 md:w-[18px] md:h-[18px]" />
          <input
            type="text"
            placeholder="Search by host name, email, business name, Razorpay ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-default/50 text-xs md:text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 md:px-4 py-2 md:py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-300 focus:outline-none focus:border-brand-default/50 text-xs md:text-sm"
        >
          {FILTERS.map(f => (
            <option key={f} value={f} className="bg-[#0a0a0f]">
              {f === 'all' ? `All (${counts.all || 0})` : `${statusConfig[f]?.label} (${counts[f] || 0})`}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <Icon name="DocumentTextIcon" size={48} />
          <p className="mt-3 text-lg font-heading font-semibold">No KYC records found</p>
          <p className="text-sm mt-1">No hosts have submitted banking & KYC details yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {filtered.map((record, i) => {
              const cfg = statusConfig[record.kyc_status] || statusConfig.pending;
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-200 truncate">{record.host_name}</p>
                      <p className="text-xs text-zinc-500 truncate">{record.host_email}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end gap-2 mt-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Business</p>
                      <p className="text-sm text-zinc-300 truncate">{record.legal_business_name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-heading font-semibold transition-all duration-200 flex items-center gap-1.5 shrink-0"
                    >
                      <Icon name="EyeIcon" size={13} />
                      View
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Host</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Business Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">Bank IFSC</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Razorpay ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">KYC Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:table-cell">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, i) => {
                  const cfg = statusConfig[record.kyc_status] || statusConfig.pending;
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-200 truncate max-w-[140px]">{record.host_name}</p>
                        <p className="text-xs text-zinc-500 truncate max-w-[140px]">{record.host_email}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 truncate max-w-[160px]">{record.legal_business_name}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs hidden md:table-cell">{record.bank_ifsc}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs hidden lg:table-cell">
                        {record.razorpay_account_id ? (
                          <span className="truncate block max-w-[120px]">{record.razorpay_account_id}</span>
                        ) : (
                          <span className="text-zinc-600 italic">Not created</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs hidden sm:table-cell">
                        {record.created_at ? new Date(record.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-heading font-semibold transition-all duration-200 flex items-center gap-1.5"
                        >
                          <Icon name="EyeIcon" size={13} />
                          View
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedRecord && (
        <KycDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default KycList;
