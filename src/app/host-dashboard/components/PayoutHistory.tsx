'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TrendingUp, Clock, CheckCircle2, XCircle, RefreshCw, IndianRupee, Wallet } from 'lucide-react';

interface PaymentTransfer {
    id: string;
    booking_id: string;
    razorpay_payment_id: string | null;
    razorpay_transfer_id: string | null;
    total_amount: number;
    platform_commission: number;
    host_amount: number;
    commission_type: string;
    commission_value: number;
    transfer_status: 'pending' | 'processing' | 'settled' | 'failed' | 'reversed';
    created_at: string;
    bookings?: {
        total_price?: number;
        service_fee?: number;
        status?: string;
        properties?: {
            title?: string;
        };
    };
}

const statusConfig = {
    pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20', icon: Clock },
    processing: { label: 'Processing', color: 'text-sky-400', bg: 'bg-sky-500/10 border border-sky-500/20', icon: Clock },
    settled: { label: 'Settled', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20', icon: XCircle },
    reversed: { label: 'Reversed', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border border-zinc-500/20', icon: XCircle },
};

interface PayoutHistoryProps {
    hostId: string;
}

export default function PayoutHistory({ hostId }: PayoutHistoryProps) {
    const [transfers, setTransfers] = useState<PaymentTransfer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransfers();
    }, []);

    async function fetchTransfers() {
        setLoading(true);
        // 1. Fetch actual transfers joined with bookings to extract accommodation earnings excluding guest fees
        const { data: transfersData, error: transfersError } = await supabase
            .from('payment_transfers')
            .select('*, bookings(total_price, service_fee, status, properties(title))')
            .eq('host_id', hostId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (transfersError) {
            console.error('[PayoutHistory] Error fetching transfers:', transfersError);
        }

        if (!transfersError && transfersData && transfersData.length > 0) {
            setTransfers(transfersData as any);
            setLoading(false);
            return;
        }

        // 2. Fallback: Derive from bookings if transfers are not recorded
        const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*, properties!inner(*)')
            .eq('properties.host_id', hostId)
            .in('status', ['confirmed', 'completed'])
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (!bookingsError && bookingsData) {
            const mappedTransfers: PaymentTransfer[] = bookingsData.map(b => {
                const total = Number(b.total_price);
                // Zero commission from guest. Only host platform commission (10%) is deducted.
                const hostRevenue = total;
                const commissionRate = 10; // Host platform commission is 10%
                const hostCommission = Math.round(hostRevenue * (commissionRate / 100));
                const hostShare = hostRevenue - hostCommission;
                
                return {
                    id: b.id,
                    booking_id: b.id,
                    razorpay_payment_id: 'LEGACY-REF',
                    razorpay_transfer_id: null,
                    total_amount: hostRevenue,
                    platform_commission: hostCommission,
                    host_amount: hostShare,
                    commission_type: 'percentage',
                    commission_value: commissionRate,
                    transfer_status: b.status === 'completed' ? 'settled' : 'pending',
                    created_at: b.created_at,
                    bookings: {
                        total_price: b.total_price,
                        service_fee: Number(b.service_fee || 0),
                        status: b.status,
                        properties: b.properties
                    }
                };
            });
            setTransfers(mappedTransfers);
        } else if (bookingsError) {
            console.error('[PayoutHistory] Error fetching fallback bookings:', bookingsError);
        }
        setLoading(false);
    }

    const totalSettled = transfers
        .filter(t => t.transfer_status === 'settled')
        .reduce((sum, t) => sum + Number(t.host_amount), 0);

    const totalPending = transfers
        .filter(t => ['pending', 'processing'].includes(t.transfer_status))
        .reduce((sum, t) => sum + Number(t.host_amount), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 md:space-y-8 relative">

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6 bg-[#0a0a0f]/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bottom-0 w-80 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3 md:gap-5 w-full lg:w-auto">
                    <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-sky-500/30 to-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.3)] shrink-0">
                        <Wallet size={20} className="text-sky-400 drop-shadow-md md:hidden" />
                        <Wallet size={32} className="text-sky-400 drop-shadow-md hidden md:block" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Payout History</h1>
                        <p className="text-[10px] md:text-sm font-bold text-zinc-400 mt-0.5 md:mt-1 uppercase tracking-widest flex items-center gap-2">
                            Transfer Ledger &amp; Settlement Tracker
                        </p>
                    </div>
                </div>

                <div className="relative z-10 hidden sm:flex items-center gap-4">
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                        <div className="px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">Live Sync</div>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl p-4 md:p-6 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3">
                            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                            Total Settled
                        </div>
                        <div className="flex items-center gap-1 text-lg sm:text-xl md:text-2xl font-black text-white truncate">
                            <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0" />
                            {totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl p-4 md:p-6 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3">
                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
                            Pending Payouts
                        </div>
                        <div className="flex items-center gap-1 text-lg sm:text-xl md:text-2xl font-black text-amber-400 truncate">
                            <IndianRupee className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            {totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl p-4 md:p-6 relative overflow-hidden sm:col-span-2 lg:col-span-1">
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3">
                            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-400" />
                            Total Transactions
                        </div>
                        <div className="text-xl md:text-2xl font-black text-white">{transfers.length}</div>
                    </div>
                </div>
            </div>

            {/* Payout table */}
            <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 md:px-8 py-3.5 md:py-5 border-b border-white/5">
                    <h3 className="font-black text-white tracking-tight">Payout History</h3>
                    <button
                        onClick={fetchTransfers}
                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-sky-400 uppercase tracking-widest transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                </div>

                {transfers.length === 0 ? (
                    <div className="py-20 flex flex-col items-center text-center px-4 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <IndianRupee className="w-8 h-8 text-sky-500/40" />
                        </div>
                        <div className="max-w-md">
                            <p className="text-sm font-bold uppercase tracking-widest text-white mb-2">No active payouts found</p>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Payout history syncs automatically after each successful booking. 
                                If you have existing bookings from before the sync system was active, 
                                they may not appear here until a new transaction is processed.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-6 md:px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                                    <th className="text-right px-6 md:px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Earnings Total</th>
                                    <th className="text-right px-6 md:px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Commission</th>
                                    <th className="text-right px-6 md:px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Share</th>
                                    <th className="text-center px-6 md:px-8 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transfers.map(transfer => {
                                    const config = statusConfig[transfer.transfer_status] ?? statusConfig.pending;
                                    const StatusIcon = config.icon;
                                    const date = new Date(transfer.created_at);

                                    // Guest total paid = Host gross earnings (zero guest service fee)
                                    const guestTotalPaid = Number(transfer.bookings?.total_price || transfer.total_amount || 0);
                                    const hostGrossEarnings = guestTotalPaid;
                                    const hostCommission = Math.round(hostGrossEarnings * 0.10);
                                    const hostShare = Number(transfer.host_amount);

                                    return (
                                        <tr key={transfer.id} className="hover:bg-white/2 transition-colors group">
                                            <td className="px-6 md:px-8 py-4 text-zinc-300">
                                                <div className="font-medium">{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-xs text-zinc-600 font-mono mt-0.5">
                                                    {transfer.razorpay_payment_id ?? '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-8 py-4 text-right font-semibold text-white">
                                                ₹{hostGrossEarnings.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 md:px-8 py-4 text-right text-red-400">
                                                -₹{hostCommission.toLocaleString('en-IN')}
                                                <div className="text-xs text-zinc-600 mt-0.5">
                                                    10%
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-8 py-4 text-right font-black text-emerald-400">
                                                ₹{hostShare.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 md:px-8 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${config.bg} ${config.color} mx-auto`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {config.label}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
