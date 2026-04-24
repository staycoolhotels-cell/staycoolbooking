'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import Icon from '@/components/ui/AppIcon';

interface PayoutsTableProps {
    transactions: Transaction[];
}

const PayoutsTable = ({ transactions }: PayoutsTableProps) => {
    const [showAllMobile, setShowAllMobile] = useState(false);
    
    // Only affect mobile view
    const displayedMobileTransactions = showAllMobile ? transactions : transactions.slice(0, 2);

    return (
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="p-6 md:p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                        <Icon name="DocumentTextIcon" size={20} className="text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-heading font-black text-white tracking-tight leading-tight">Financial Ledger</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Automated Payout History</p>
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto relative z-10">
                <table className="w-full">
                    <thead className="bg-black/40 border-b border-white/5">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Network ID</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Initiator</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Target Asset</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Net Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${tx.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)]' :
                                                tx.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                    'bg-red-500/10 border-red-500/20 text-red-400'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-400 animate-pulse' :
                                                    tx.status === 'pending' ? 'bg-amber-400' :
                                                        'bg-red-400'
                                                }`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{tx.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-zinc-300 font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Icon name="CalendarIcon" size={14} className="text-zinc-600" />
                                            {format(new Date(tx.date || new Date()), 'MMM d, yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[11px] text-zinc-500 font-mono font-bold tracking-wider whitespace-nowrap">
                                        {tx.transactionId || tx.id.slice(0, 12).toUpperCase()}
                                    </td>
                                    <td className="px-8 py-6 text-sm text-white font-bold whitespace-nowrap flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 shrink-0">
                                            <Icon name="UserIcon" size={14} className="text-zinc-500" />
                                        </div>
                                        {tx.guestName || 'Guest Identity'}
                                    </td>
                                    <td className="px-8 py-6 text-sm text-zinc-400 font-medium whitespace-nowrap">
                                        {tx.propertyName || 'Property Reference'}
                                    </td>
                                    <td className="px-8 py-6 text-right whitespace-nowrap">
                                        <span className={`text-base font-black tracking-tight ${tx.type === 'refund' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {tx.type === 'refund' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-16">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <Icon name="BanknotesIcon" size={32} className="text-zinc-700 mb-3" />
                                        <span className="text-sm font-bold text-white mb-1">No Ledger Entries</span>
                                        <span className="text-xs text-zinc-500">There are no financial transactions recorded yet.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-white/5 relative z-10">
                {transactions.length > 0 ? (
                    <>
                        {displayedMobileTransactions.map((tx) => (
                            <div key={tx.id} className="p-6 active:bg-white/[0.02] transition-colors flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 shrink-0">
                                            <Icon name="UserIcon" size={16} className="text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-base leading-tight">{tx.guestName || 'Guest'}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">ID: {tx.transactionId?.slice(0, 8) || tx.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black tracking-tight ${tx.type === 'refund' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {tx.type === 'refund' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <Icon name="HomeIcon" size={12} className="text-zinc-600" />
                                            <p className="text-xs font-medium">{tx.propertyName || 'Property'}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                            <Icon name="CalendarIcon" size={12} className="text-zinc-600" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">{format(new Date(tx.date || new Date()), 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border backdrop-blur-md ${tx.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            tx.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-400' :
                                                tx.status === 'pending' ? 'bg-amber-400' :
                                                    'bg-red-400'
                                            }`} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{tx.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {transactions.length > 2 && (
                            <div className="p-4 flex justify-center border-t border-white/5">
                                <button
                                    onClick={() => setShowAllMobile(!showAllMobile)}
                                    className="px-6 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl text-xs font-bold text-sky-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                                >
                                    {showAllMobile ? 'Show Less' : 'Show All'}
                                    <Icon name={showAllMobile ? "ChevronUpIcon" : "ChevronDownIcon"} size={14} className="text-sky-400" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-10 text-center text-zinc-500 text-sm">
                        No financial activity recorded.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayoutsTable;
