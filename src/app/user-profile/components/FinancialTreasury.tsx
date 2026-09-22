'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Transaction } from '@/lib/types';
import SpendingChart from '@/components/common/SpendingChart';
import { generateInvoicePDF } from '@/lib/pdf-utils';
import RefundTrackerCard from './RefundTrackerCard';
import BookingDetailsModal from './BookingDetailsModal';

type FinancialTreasuryProps = {
  transactions: Transaction[];
  bookings?: any[];
};

const FinancialTreasury = ({ transactions = [], bookings = [] }: FinancialTreasuryProps) => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
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
            {(() => {
              const cancelled = (bookings || []).filter(b => b.status === 'cancelled');
              if (cancelled.length > 0) {
                return (
                  <div className="space-y-3">
                    {cancelled.slice(0, 2).map(b => (
                      <RefundTrackerCard
                        key={b.id}
                        booking={b}
                        guestName={transactions[0]?.guestName}
                        onViewDetails={() => setSelectedBooking(b)}
                      />
                    ))}
                  </div>
                );
              }
              if (refunds.length > 0) {
                return (
                  <div className="space-y-3">
                    {refunds.map(refund => {
                      const matchedBooking = (bookings || []).find(b => b.id === (refund.booking_id || refund.id));
                      return (
                        <RefundTrackerCard
                          key={refund.id}
                          amount={Math.abs(refund.amount)}
                          guestName={refund.guestName}
                          booking={{
                            cancelled_at: refund.cancellationDate || refund.date,
                            refund_amount: Math.abs(refund.amount),
                            refund_status: refund.status
                          }}
                          onViewDetails={matchedBooking ? () => setSelectedBooking(matchedBooking) : undefined}
                        />
                      );
                    })}
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-white/5 rounded-2xl border border-dashed border-zinc-800">
                  <Icon name="DocumentTextIcon" size={24} className="text-zinc-600 mb-2 md:w-8 md:h-8" />
                  <p className="text-xs md:text-sm text-zinc-500 italic">No refunds to track.</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          transactions={transactions}
        />
      )}
    </div>
  );
};

export default FinancialTreasury;
