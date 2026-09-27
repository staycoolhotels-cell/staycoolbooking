'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Transaction } from '@/lib/types';
import SpendingChart from '@/components/common/SpendingChart';
import { generateInvoicePDF, exportTransactionsToPDF } from '@/lib/pdf-utils';
import RealTimeInvoice from '@/components/common/RealTimeInvoice';
import { supabase } from '@/lib/supabaseClient';
import { calculateRefundDistribution } from '@/lib/refund-policy';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import TransferToBankModal from "@/app/admin-panel/financials/components/TransferToBankModal";

type AdminFinancialTreasuryProps = {
  transactions?: Transaction[];
};

const AdminFinancialTreasury = ({ transactions = [] }: AdminFinancialTreasuryProps) => {
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setLocalTransactions(transactions);
      return;
    }

    const fetchFinancialData = async () => {
      try {
        const [{ data: bookingsData }, { data: transfersData }] = await Promise.all([
          supabase
            .from('bookings')
            .select(`
              *,
              guest:users!guest_id(name, email, phone),
              property:properties!property_id(
                title,
                location,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                host:users!host_id(name, email, phone)
              )
            `)
            .not('status', 'in', '("pending_payment","payment_failed")')
            .order('created_at', { ascending: false }),
          supabase
            .from('payment_transfers')
            .select('*')
        ]);

        const transferMap: Record<string, any> = {};
        (transfersData || []).forEach((t: any) => {
          if (t.booking_id) transferMap[t.booking_id] = t;
        });

        if (bookingsData && bookingsData.length > 0) {
          const mapped: Transaction[] = bookingsData.map((b: any) => {
            const rawAmount = Number(b.total_price ?? b.amount ?? b.price ?? b.grand_total ?? 0);
            const amount = isNaN(rawAmount) ? 0 : rawAmount;
            const serviceFee = b.service_fee || Math.round((amount * 0.1) / 1.1);
            const statusStr = (b.status || '').toLowerCase();
            const isRefund = statusStr === 'cancelled' || statusStr === 'refunded' || statusStr === 'failed';

            const guestEmail = b.guest?.email || '';
            const guestPhone = b.guest?.phone || '';
            const guestAddress = [guestEmail, guestPhone].filter(Boolean).join('\n') || 'Address not provided';

            const hostName = b.property?.host?.name || 'Platform Host';
            const hostEmail = b.property?.host?.email || '';
            const hostPhone = b.property?.host?.phone || '';
            const propertyName = b.property?.title || 'Property Stays';
            const propertyLocation = b.property?.location || [b.property?.city, b.property?.state].filter(Boolean).join(', ') || '';
            const propertyAddress = [b.property?.address_line1, b.property?.address_line2, b.property?.city, b.property?.state, b.property?.postal_code].filter(Boolean).join(', ') || propertyLocation;

            const checkIn = b.check_in ? new Date(b.check_in).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined;
            const checkOut = b.check_out ? new Date(b.check_out).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : undefined;
            const nights = b.check_in && b.check_out 
              ? Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60 * 24)))
              : 1;

            let guestRefundAmount = undefined;
            let hostShare = undefined;
            let adminShare = undefined;
            let retainedPenalty = undefined;
            let retainedServiceFee = undefined;
            let netRefundablePool = undefined;
            let appliedPolicy = undefined;
            let daysBeforeCheckIn = undefined;
            let refundPercentage = undefined;

            if (isRefund) {
              const dist = calculateRefundDistribution(
                amount,
                b.check_in || b.created_at,
                b.cancelled_at || new Date().toISOString(),
                b.created_at,
                b.has_free_cancellation,
                Number(b.free_cancellation_fee || 0)
              );
              daysBeforeCheckIn = dist.daysBeforeCheckIn;
              appliedPolicy = dist.appliedPolicy;
              refundPercentage = dist.guestRefundPercent;
              guestRefundAmount = dist.guestRefundAmount;
              hostShare = dist.hostShare;
              adminShare = dist.adminShare;
              retainedPenalty = dist.netRefundablePool - dist.guestRefundAmount;
              retainedServiceFee = dist.platformFee;
              netRefundablePool = dist.netRefundablePool;
            }

            const transfer = transferMap[b.id];
            let hostPayoutAmount = undefined;
            let adminCommissionAmount = undefined;

            if (!isRefund) {
              if (transfer && Number(transfer.host_amount) > 0) {
                hostPayoutAmount = Math.round(Number(transfer.host_amount));
                adminCommissionAmount = Math.round(Number(transfer.platform_commission || (amount - hostPayoutAmount)));
              } else {
                const guestFee = serviceFee || Math.round((amount * 0.1) / 1.1);
                const hostRevenue = Math.max(0, amount - guestFee);
                const hostCommission = Math.round(hostRevenue * 0.10);
                hostPayoutAmount = Math.max(0, hostRevenue - hostCommission);
                adminCommissionAmount = Math.max(0, amount - hostPayoutAmount);
              }
            }

            return {
              id: b.id,
              transactionId: `TXN-${String(b.id).slice(0, 8).toUpperCase()}`,
              invoice_id: String(b.id).slice(0, 8).toUpperCase(),
              booking_id: b.id,
              propertyName,
              propertyLocation,
              propertyAddress,
              guestName: b.guest?.name || 'Guest User',
              guestEmail,
              guestPhone,
              guestAddress,
              hostName,
              hostEmail,
              hostPhone,
              amount: amount,
              serviceFee: serviceFee,
              netRevenue: amount - serviceFee,
              type: isRefund ? 'refund' : 'payment',
              status: isRefund ? 'refunded' : 'completed',
              date: b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : 'N/A',
              bookingDate: b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : undefined,
              cancellationDate: b.cancelled_at ? new Date(b.cancelled_at).toLocaleDateString('en-IN') : undefined,
              checkIn,
              checkOut,
              nights,
              paymentMethod: 'Razorpay',
              daysBeforeCheckIn,
              appliedPolicy,
              refundPercentage,
              guestRefundAmount,
              hostShare,
              adminShare,
              hostPayoutAmount,
              adminCommissionAmount,
              refundAmount: guestRefundAmount,
              retainedPenalty,
              retainedServiceFee,
              netRefundablePool,
              breakdown: {
                accommodation: Math.round(amount / 1.1),
                service_fee: serviceFee,
                taxes: 0,
                cancellation_fee: Number(b.free_cancellation_fee || 0)
              }
            };
          });
          setLocalTransactions(mapped);
        }
      } catch (err) {
        console.error('Error fetching financial treasury data:', err);
      }
    };

    fetchFinancialData();
  }, [transactions]);

  const activeData = localTransactions.length > 0 ? localTransactions : transactions;

  const isPayment = (t: Transaction) => {
    const st = (t.status || '').toLowerCase();
    const type = (t.type || '').toLowerCase();
    return type !== 'refund' && st !== 'refunded' && st !== 'failed' && (t.amount || 0) >= 0;
  };

  const isCancelled = (t: Transaction) => {
    const st = (t.status || '').toLowerCase();
    const type = (t.type || '').toLowerCase();
    return type === 'refund' || st === 'refunded';
  };

  const paymentList = activeData.filter(isPayment);
  const cancelledList = activeData.filter(isCancelled);

  const totalRevenue = paymentList.reduce((acc, t) => acc + (t.amount || 0), 0);

  // Platform earnings from confirmed/completed bookings (guest commission + host commission)
  const earningsFromPayments = paymentList.reduce(
    (acc, t) => {
      if (t.adminCommissionAmount !== undefined && t.adminCommissionAmount !== null) {
        return acc + Number(t.adminCommissionAmount);
      }
      const amt = Number(t.amount || 0);
      const guestFee = Number(t.serviceFee) || Math.round((amt * 0.1) / 1.1);
      const hostRev = Math.max(0, amt - guestFee);
      const hostComm = Math.round(hostRev * 0.10);
      return acc + (guestFee + hostComm);
    },
    0
  );

  // Admin retained share from cancelled bookings (platform fee is always non-refundable)
  // When cancelled, adminShare = retained platform fee (non-refundable) + penalty share (if any)
  const earningsFromCancellations = cancelledList.reduce(
    (acc, t) => {
      if (t.adminShare !== undefined && t.adminShare !== null) {
        return acc + Number(t.adminShare);
      }
      return acc;
    },
    0
  );

  const platformEarnings = earningsFromPayments + earningsFromCancellations;

  const pendingRefunds = activeData.filter((t) => t.type === 'refund' || t.status === 'refunded' || t.status === 'pending');

  const [previewTransaction, setPreviewTransaction] = React.useState<Transaction | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const downloadInvoicesBatch = async () => {
    await exportTransactionsToPDF(activeData);
  };

  return (
    <div className="bg-[#0a0a0f]/80 border border-white/10 rounded-3xl md:rounded-[2rem] shadow-2xl p-4 md:p-8 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Platform Treasury</h2>
          <p className="text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider md:tracking-widest mt-0.5 md:mt-1">Cross-System Financial Intelligence</p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] md:text-xs font-black uppercase tracking-wider rounded-lg md:rounded-xl transition-all shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer"
          >
            <Icon name="ArrowDownTrayIcon" size={14} />
            <span>Transfer to Bank</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadInvoicesBatch}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-sky-500/10 border border-sky-500/20 rounded-lg md:rounded-xl text-sky-400 text-[9px] md:text-xs font-bold uppercase tracking-wider hover:bg-sky-500/20 transition-all shrink-0"
          >
            <div className="md:hidden">
              <Icon name="ArrowDownTrayIcon" size={12} />
            </div>
            <div className="hidden md:block">
              <Icon name="ArrowDownTrayIcon" size={16} />
            </div>
            <span className="max-w-[50px] md:max-w-none text-left leading-tight md:leading-normal">Export<br className="md:hidden" /> Ledger</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Revenue Allocation breakdown */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 md:p-6 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/15 transition-all" />
          <h3 className="font-bold text-zinc-400 text-center mb-4 md:mb-6 text-[10px] md:text-xs uppercase tracking-widest">Revenue Allocation Matrix</h3>
          <SpendingChart transactions={activeData} mode="admin" />
          <div className="mt-6 md:mt-8 flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 md:p-4 border border-blue-500/20 rounded-xl bg-blue-500/5">
              <p className="text-lg md:text-2xl font-black text-white font-mono">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Booking Revenue (Gross)</p>
            </div>
            <div 
              onClick={() => setIsTransferModalOpen(true)}
              className="text-center p-3 md:p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/5 hover:border-emerald-500/40 cursor-pointer transition-all group/card relative"
            >
              <p className="text-lg md:text-2xl font-black text-emerald-400 font-mono">
                ₹{platformEarnings.toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                Admin Revenue (Net)
                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded">Settle</span>
              </p>
              {earningsFromCancellations > 0 && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-[8px] text-emerald-300/60">
                    Bookings: ₹{earningsFromPayments.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[8px] text-amber-400/70">
                    Cancellations (retained): ₹{earningsFromCancellations.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
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
                {pendingRefunds.map((refund) => {
                  const guestRefund = refund.guestRefundAmount !== undefined ? refund.guestRefundAmount : (refund.refundAmount !== undefined ? refund.refundAmount : Math.abs(refund.amount || 0));
                  return (
                    <div
                      key={refund.id}
                      className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 sm:p-4 flex justify-between items-center group hover:border-rose-500/40 transition-all gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Refund</span>
                          <span className="text-[9px] font-mono text-zinc-500">#{refund.invoice_id || refund.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{refund.guestName || 'System Guest'}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{refund.propertyName}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-black text-rose-400 font-mono tracking-tight">
                            ₹{guestRefund.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[8px] text-zinc-500 font-bold uppercase">To Guest</p>
                        </div>
                        <button 
                          onClick={() => setPreviewTransaction(refund)}
                          className="p-1.5 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5"
                          title="Live Preview Refund Invoice"
                        >
                          <Icon name="EyeIcon" size={15} />
                        </button>
                        <button 
                          onClick={async () => await generateInvoicePDF(refund)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors bg-white/5 rounded-lg border border-white/5"
                          title="Download Refund Invoice PDF"
                        >
                          <Icon name="DocumentArrowDownIcon" size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                  {activeData
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
                         <div className="flex items-center gap-2">
                           <p className="text-sm font-black text-white font-mono mr-2">INR {t.amount?.toLocaleString('en-IN')}</p>
                           <button 
                             onClick={() => setPreviewTransaction(t)}
                             className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5"
                             title="Live Preview"
                           >
                              <Icon name="EyeIcon" size={16} />
                           </button>
                           <button 
                             onClick={async () => await generateInvoicePDF(t)}
                             className="p-2 text-zinc-500 hover:text-sky-400 transition-colors bg-white/5 rounded-lg border border-white/5"
                             title="Download PDF"
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

      <Dialog open={!!previewTransaction} onOpenChange={(open) => !open && setPreviewTransaction(null)}>
        <DialogContent className="max-w-4xl bg-transparent border-none p-0 overflow-visible">
          <DialogTitle className="sr-only">Invoice Preview</DialogTitle>
          <div className="max-h-[90vh] overflow-y-auto rounded-2xl custom-scrollbar">
            {previewTransaction && (
              <RealTimeInvoice 
                transaction={previewTransaction} 
                onClose={() => setPreviewTransaction(null)} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TransferToBankModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        adminRevenue={platformEarnings}
      />
    </div>
  );
};

export default AdminFinancialTreasury;
