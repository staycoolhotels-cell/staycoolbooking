'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface TransferToBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminRevenue: number;
}

export default function TransferToBankModal({
  isOpen,
  onClose,
  adminRevenue,
}: TransferToBankModalProps) {
  // Modes: 'admin_revenue' | 'full_balance' | 'custom'
  const [transferMode, setTransferMode] = useState<'admin_revenue' | 'full_balance' | 'custom'>('admin_revenue');
  const [customAmount, setCustomAmount] = useState(adminRevenue ? String(adminRevenue) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recentSettlements, setRecentSettlements] = useState<any[]>([]);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessResult(null);
      setTransferMode('admin_revenue');
      setCustomAmount(adminRevenue ? String(adminRevenue) : '');
      fetchSettlementHistory();
    }
  }, [isOpen, adminRevenue]);

  const fetchSettlementHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/admin/settlements');
      const data = await res.json();
      if (data.success) {
        if (data.liveBalance !== undefined) {
          setLiveBalance(Number(data.liveBalance));
        }
        const combined = [
          ...(data.ondemand || []),
          ...(data.regular || [])
        ].slice(0, 5);
        setRecentSettlements(combined);
      }
    } catch (e) {
      console.warn('Failed to fetch settlement history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessResult(null);

      const payload: any = {
        description: 'Admin platform revenue settlement to bank',
      };

      if (transferMode === 'admin_revenue') {
        payload.amount = Number(adminRevenue);
        payload.settleFullBalance = false;
      } else if (transferMode === 'full_balance') {
        payload.settleFullBalance = true;
      } else {
        payload.amount = Number(customAmount);
        payload.settleFullBalance = false;
      }

      const res = await fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initiate transfer to bank');
      }

      setSuccessResult(data.settlement);
      fetchSettlementHistory();
    } catch (err: any) {
      console.error('Settlement error:', err);
      setError(err.message || 'An error occurred during bank transfer initiation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-[#0d0d14] border border-white/10 text-white rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <DialogTitle className="sr-only">Transfer Admin Revenue to Bank</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icon name="BuildingLibraryIcon" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Transfer to Bank
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  On-Demand Payout
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Settle platform revenue earnings directly into registered Admin bank account
              </p>
            </div>
          </div>
        </div>

        <div className="py-5 space-y-5">
          {/* Revenue, Razorpay Live Balance & Destination Bank Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Admin Revenue
              </span>
              <p className="text-xl font-black text-emerald-400 mt-1 font-mono">
                ₹{Number(adminRevenue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] text-zinc-500 mt-0.5">Platform earned pool</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Razorpay Balance
              </span>
              <p className="text-xl font-black text-sky-400 mt-1 font-mono">
                {liveBalance !== null ? `₹${liveBalance.toLocaleString('en-IN')}` : 'Loading...'}
              </p>
              <p className="text-[9px] text-zinc-500 mt-0.5">Ready for instant payout</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Destination Bank
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm font-bold text-white truncate">Axis Bank</p>
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5">Linked primary account</p>
            </div>
          </div>

          {/* Protection Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <div className="text-blue-400 shrink-0 mt-0.5">
              <Icon name="ShieldCheckIcon" size={18} />
            </div>
            <div className="text-xs text-blue-200/90 leading-relaxed">
              <strong className="text-blue-300 font-semibold block mb-0.5">Escrow Protection Active</strong>
              Host payouts are held in Razorpay Route escrow and will <strong>never</strong> transfer to your bank. Only your platform earnings are settled.
            </div>
          </div>

          {/* Balance info note if zero */}
          {liveBalance === 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-2">
              <Icon name="InformationCircleIcon" size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                Razorpay balance is currently <strong>₹0.00</strong> (all prior settlements have completed). As new guest bookings arrive, your commission accumulates in Razorpay and can be sent to your bank with this button.
              </span>
            </div>
          )}

          {/* Success State */}
          {successResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-2"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <Icon name="CheckCircleIcon" size={18} />
                Settlement Initiated Successfully!
              </div>
              <p className="text-xs text-emerald-200/80">
                Transfer ID: <code className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[11px]">{successResult.id}</code>
              </p>
              <p className="text-xs text-emerald-200/80">
                Amount: <strong>₹{(Number(successResult.amount_requested || successResult.amount || 0) / 100).toLocaleString('en-IN')}</strong> · Status: <span className="capitalize font-semibold">{successResult.status || 'Processed'}</span>
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5"
            >
              <div className="text-rose-400 shrink-0 mt-0.5">
                <Icon name="ExclamationTriangleIcon" size={16} />
              </div>
              <div className="leading-relaxed">{error}</div>
            </motion.div>
          )}

          {/* Settlement Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Choose Transfer Amount
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTransferMode('admin_revenue')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  transferMode === 'admin_revenue'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-lg shadow-emerald-500/5'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Admin Revenue</span>
                  {transferMode === 'admin_revenue' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </div>
                <p className="text-xs font-mono font-bold text-emerald-400">₹{Number(adminRevenue || 0).toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">Transfer platform earnings</p>
              </button>

              <button
                type="button"
                onClick={() => setTransferMode('full_balance')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  transferMode === 'full_balance'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-lg shadow-emerald-500/5'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Full Balance</span>
                  {transferMode === 'full_balance' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </div>
                <p className="text-xs font-mono font-bold text-sky-400">
                  {liveBalance !== null ? `₹${liveBalance.toLocaleString('en-IN')}` : 'All eligible'}
                </p>
                <p className="text-[9px] text-zinc-500 mt-0.5">Settle all available funds</p>
              </button>

              <button
                type="button"
                onClick={() => setTransferMode('custom')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  transferMode === 'custom'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-lg shadow-emerald-500/5'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Custom Amount</span>
                  {transferMode === 'custom' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </div>
                <p className="text-xs font-mono font-bold text-zinc-300">Custom ₹</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">Enter custom amount</p>
              </button>
            </div>

            {transferMode === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2"
              >
                <label className="text-[11px] text-zinc-400 block mb-1 font-medium">Amount to transfer (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 pl-8 pr-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Recent Settlements History Preview */}
          {recentSettlements.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Recent Settlements
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {recentSettlements.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                  >
                    <div>
                      <span className="font-mono text-zinc-300 text-[11px]">{s.id}</span>
                      <p className="text-[9px] text-zinc-500">
                        {s.created_at ? new Date(s.created_at * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white">
                        ₹{(Number(s.amount_settled || s.amount_requested || s.amount || 0) / 100).toLocaleString('en-IN')}
                      </span>
                      <p className="text-[9px] text-emerald-400 capitalize font-medium">{s.status || 'processed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={
              loading ||
              (transferMode === 'admin_revenue' && (!adminRevenue || Number(adminRevenue) <= 0)) ||
              (transferMode === 'custom' && (!customAmount || Number(customAmount) <= 0))
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Initiating...
              </>
            ) : (
              <>
                <Icon name="ArrowRightIcon" size={14} />
                Transfer to Bank
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
