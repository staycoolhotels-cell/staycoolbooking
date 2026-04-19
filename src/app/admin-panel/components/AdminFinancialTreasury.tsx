'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Transaction } from '@/lib/types';
import SpendingChart from '@/components/common/SpendingChart';
import { generateInvoicePDF, exportTransactionsToCSV } from '@/lib/pdf-utils';

type AdminFinancialTreasuryProps = {
  transactions: Transaction[];
};

const AdminFinancialTreasury = ({ transactions = [] }: AdminFinancialTreasuryProps) => {
  const isPayment = (t: Transaction) => t.type === 'payment' || (!t.type && (t.amount || 0) > 0);

  const totalRevenue = transactions
    .filter(isPayment)
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const platformEarnings = transactions
    .filter(isPayment)
    .reduce((acc, t) => acc + (t.serviceFee || 0), 0);

  const pendingRefunds = transactions.filter((t) => t.type === 'refund' && t.status === 'pending');

  const downloadInvoicesBatch = () => {
    exportTransactionsToCSV(transactions);
  };

  return (
    <div className="bg-[#0a0a0f]/80 border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Platform Treasury</h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Cross-System Financial Intelligence</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={downloadInvoicesBatch}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 text-xs font-bold uppercase tracking-wider hover:bg-sky-500/20 transition-all"
        >
          <Icon name="ArrowDownTrayIcon" size={16} />
          Export Ledger
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Allocation breakdown */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/15 transition-all" />
          <h3 className="font-bold text-zinc-400 text-center mb-6 text-xs uppercase tracking-widest">Revenue Allocation Matrix</h3>
          <SpendingChart transactions={transactions} />
          <div className="mt-8 flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-4 border border-white/5 rounded-xl bg-black/20">
              <p className="text-xl sm:text-xl md:text-2xl font-black text-white font-mono">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Gross Volume</p>
            </div>
            <div className="text-center p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/5">
              <p className="text-xl sm:text-xl md:text-2xl font-black text-emerald-400 font-mono">
                ₹{platformEarnings.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mt-1">Platform Revenue</p>
            </div>
          </div>
        </div>

        {/* Global Tracker Section */}
        <div className="space-y-6">
          {/* Dispute/Refund monitor */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-bold text-zinc-400 text-xs uppercase tracking-widest">Refund & Dispute Pipeline</h3>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">LIVE</span>
            </div>
            {pendingRefunds.length > 0 ? (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {pendingRefunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex justify-between items-center group hover:border-rose-500/40 transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Refund Required</p>
                      <p className="text-sm font-medium text-white">{refund.guestName || 'System Guest'}</p>
                    </div>
                    <p className="text-lg font-black text-white font-mono tracking-tight">₹{Math.abs(refund.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <Icon name="CheckCircleIcon" size={32} className="text-zinc-700 mb-2" />
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No Critical Refunds Pending</p>
              </div>
            )}
          </div>

          {/* Platform Invoice Audit */}
          <div>
             <h3 className="font-bold text-zinc-400 text-xs uppercase tracking-widest mb-3 px-1">Recent Invoices</h3>
             <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <div className="max-h-48 overflow-y-auto divide-y divide-white/5 pr-2 custom-scrollbar">
                  {transactions
                    .filter(isPayment)
                    .slice(0, 10)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-4 flex justify-between items-center hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-300 text-sm truncate">INV-{t.id.split('-')[0].toUpperCase()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{t.propertyName}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-[10px] text-zinc-600 font-medium">{t.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <p className="text-sm font-black text-white font-mono">₹{t.amount?.toLocaleString()}</p>
                           <button 
                             onClick={async () => await generateInvoicePDF(t)}
                             className="p-2 text-zinc-500 hover:text-sky-400 transition-colors"
                           >
                              <Icon name="DocumentArrowDownIcon" size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancialTreasury;
