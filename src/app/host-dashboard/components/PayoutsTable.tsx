'use client';

import React from 'react';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface PayoutsTableProps {
    transactions: Transaction[];
}

const PayoutsTable = ({ transactions }: PayoutsTableProps) => {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
                <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
            </div>
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-zinc-950/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Transaction ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Guest</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Property</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 text-sm text-zinc-300 whitespace-nowrap">
                                        {format(new Date(tx.date || new Date()), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-400 font-mono whitespace-nowrap">
                                        {tx.transactionId || tx.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-300">
                                        {tx.guestName || 'Guest'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-300">
                                        {tx.propertyName || 'Property'}
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-bold whitespace-nowrap ${tx.type === 'refund' ? 'text-red-400' : 'text-green-400'}`}>
                                        {tx.type === 'refund' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {tx.status === 'completed' && <CheckCircle size={16} className="text-green-500 mr-2" />}
                                            {tx.status === 'pending' && <Clock size={16} className="text-yellow-500 mr-2" />}
                                            {tx.status === 'failed' && <XCircle size={16} className="text-red-500 mr-2" />}
                                            <span className={`text-sm capitalize ${tx.status === 'completed' ? 'text-green-500' :
                                                tx.status === 'pending' ? 'text-yellow-500' :
                                                    'text-red-500'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                    No transactions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card Layout - Hidden on Desktop */}
            <div className="md:hidden divide-y divide-zinc-800">
                {transactions.length > 0 ? (
                    transactions.map((tx) => (
                        <div key={tx.id} className="p-5 space-y-4 active:bg-zinc-800/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                        {format(new Date(tx.date || new Date()), 'MMM d, yyyy')}
                                    </p>
                                    <p className="font-bold text-white text-base">{tx.guestName || 'Guest'}</p>
                                    <p className="text-xs text-zinc-400">{tx.propertyName || 'Property'}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-black ${tx.type === 'refund' ? 'text-red-400' : 'text-green-400'}`}>
                                        {tx.type === 'refund' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-end mt-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${tx.status === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                                tx.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                                                    'bg-red-500/10 border-red-500/30 text-red-500'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <p className="text-[10px] text-zinc-600 font-mono">ID: {tx.transactionId || tx.id.slice(0, 8)}</p>
                                <button className="text-[10px] font-bold uppercase text-sky-400">Details</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-10 text-center text-zinc-500 text-sm">
                        No transactions found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayoutsTable;
