'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Transaction } from '@/lib/types';
import SpendingChart from './SpendingChart';

type FinancialTreasuryProps = {
  transactions: Transaction[];
};

const FinancialTreasury = ({ transactions = [] }: FinancialTreasuryProps) => {
  const isPayment = (t: Transaction) => t.type === 'payment' || (!t.type && (t.amount || 0) > 0);

  const totalSpending = transactions
    .filter(isPayment)
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingRefunds = transactions.filter((t) => t.type === 'refund' && t.status === 'pending');

  const downloadInvoice = (invoiceId: string) => {
    console.log(`Downloading invoice ${invoiceId}...`);
    // Simulate download delay
    setTimeout(() => {
      alert(`Invoice ${invoiceId} has been downloaded successfully.`);
    }, 1000);
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] shadow-xl p-8 shadow-sky-900/5">
      <h2 className="text-xl font-bold text-white mb-4">Financial Treasury</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending Breakdown */}
        <div className="bg-zinc-800/40 rounded-xl p-4">
          <h3 className="font-semibold text-zinc-300 text-center mb-3">Spending Breakdown</h3>
          <SpendingChart transactions={transactions} />
          <p className="text-center text-2xl font-bold text-white mt-4">
            ₹{totalSpending.toLocaleString('en-IN')}
          </p>
          <p className="text-center text-xs text-zinc-400 uppercase">Total Paid</p>
        </div>

        {/* Refund & Invoice Section */}
        <div className="space-y-4">
          {/* Refund Tracker */}
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Refund Tracker</h3>
            {pendingRefunds.length > 0 ? (
              pendingRefunds.map((refund) => (
                <div
                  key={refund.id}
                  className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-yellow-200">Refund Pending</p>
                    <p className="text-sm text-gray-400">Booking: {refund.booking_id}</p>
                  </div>
                  <p className="text-lg font-bold text-white">₹{Math.abs(refund.amount)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No pending refunds.</p>
            )}
          </div>

          {/* Invoice Vault */}
          <div>
            <h3 className="font-semibold text-zinc-300 mb-2">Invoice Vault</h3>
            <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
              {transactions
                .filter(isPayment)
                .map((t) => (
                  <div
                    key={t.id}
                    className="bg-zinc-800/60 rounded-lg p-2.5 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-white">Invoice {t.invoice_id || (t.id ? t.id.split('-')[0].toUpperCase() : 'N/A')}</p>
                      <p className="text-xs text-zinc-400">Booking: {t.booking_id}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => downloadInvoice(t.invoice_id || (t.id ? t.id.split('-')[0].toUpperCase() : 'N/A'))}
                      className="p-2 bg-primary/20 rounded-full hover:bg-primary/40 transition"
                    >
                      <Icon name="ArrowDownTrayIcon" size={16} className="text-primary" />
                    </motion.button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialTreasury;
