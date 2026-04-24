'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Transaction } from '@/lib/types';
import SpendingChart from '@/components/common/SpendingChart';
import { generateInvoicePDF } from '@/lib/pdf-utils';

type FinancialTreasuryProps = {
  transactions: Transaction[];
};

const FinancialTreasury = ({ transactions = [] }: FinancialTreasuryProps) => {
  const isPayment = (t: Transaction) => t.type === 'payment' || (!t.type && (t.amount || 0) > 0);

  const totalSpending = transactions
    .filter(isPayment)
    .reduce((acc, t) => acc + t.amount, 0);

  const refunds = transactions.filter((t) => t.type === 'refund');

  const downloadInvoice = async (t: Transaction) => {
    await generateInvoicePDF(t);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-[1.5rem] md:rounded-[2rem] shadow-xl p-4 md:p-8 shadow-sky-900/5">
      <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Financial Treasury</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Spending Breakdown */}
        <div className="bg-zinc-800/40 rounded-xl p-3 md:p-4">
          <h3 className="font-semibold text-sm md:text-base text-zinc-300 text-center mb-2 md:mb-3">Spending Breakdown</h3>
          <SpendingChart transactions={transactions} />
          <p className="text-center text-xl md:text-2xl font-bold text-white mt-3 md:mt-4">
            ₹{totalSpending.toLocaleString('en-IN')}
          </p>
          <p className="text-center text-[10px] md:text-xs text-zinc-400 uppercase">Total Paid</p>
        </div>

        {/* Refund Tracker Section */}
        <div className="space-y-3 md:space-y-4">
          <div>
            <h3 className="font-semibold text-sm md:text-base text-gray-300 mb-2 font-sans">Refund Tracker</h3>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {refunds.length > 0 ? (
                refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className={`border rounded-xl p-3 md:p-4 flex justify-between items-center transition-all hover:scale-[1.01] ${
                      refund.status === 'pending' 
                        ? 'bg-yellow-900/10 border-yellow-500/20' 
                        : 'bg-emerald-900/10 border-emerald-500/20'
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-xs md:text-sm ${
                        refund.status === 'pending' ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        {refund.status === 'pending' ? 'Refund Pending' : 'Refund Processed'}
                      </p>
                      <p className="text-[9px] md:text-[11px] text-zinc-500 mt-0.5">ID: {refund.booking_id}</p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="text-right">
                        <p className="text-sm md:text-base font-bold text-white font-sans">₹{Math.abs(refund.amount).toLocaleString('en-IN')}</p>
                        <p className="text-[9px] md:text-[10px] text-zinc-500">{refund.date}</p>
                      </div>
                      <button
                        onClick={() => downloadInvoice(refund)}
                        className="p-2 md:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-zinc-400 hover:text-white group"
                        title="Download Refund Receipt"
                      >
                        <Icon name="ArrowDownTrayIcon" size={16} className="group-hover:translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-white/5 rounded-2xl border border-dashed border-zinc-800">
                  <Icon name="DocumentTextIcon" size={24} className="text-zinc-600 mb-2 md:w-8 md:h-8" />
                  <p className="text-xs md:text-sm text-zinc-500 italic">No refunds to track.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialTreasury;
