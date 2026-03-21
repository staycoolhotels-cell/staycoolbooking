'use client';

import React, { useMemo } from 'react';
import { PayoutData, PayoutStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#3b82f6']; // Emerald for Net Profit, Blue for Platform Fee

type FinancialTreasuryProps = {
  transactions?: Transaction[];
};

const FinancialTreasury: React.FC<FinancialTreasuryProps> = ({ transactions = [] }) => {
  const payouts = useMemo(() => {
    return transactions.map((t) => {
      const totalPayout = Number(t.amount) || 0;
      const platformFee = t.breakdown?.service_fee || (totalPayout * 0.1);
      const netProfit = totalPayout - platformFee;

      const statusMap: Record<string, string> = {
        'completed': 'Completed',
        'pending': 'Processing',
        'failed': 'Failed',
      };

      return {
        id: t.id || Math.random().toString(),
        date: (() => {
          const d = new Date(t.date || new Date());
          return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        })(),
        platformFee,
        netProfit,
        totalPayout,
        status: statusMap[t.status] || 'Processing'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const latestPayout = payouts[0];
  const lifetimeEarnings = payouts.reduce((acc, curr) => acc + curr.netProfit, 0);

  const pieChartData = latestPayout
    ? [
      { name: 'Your Profit', value: latestPayout.netProfit },
      { name: 'Platform Fee', value: latestPayout.platformFee },
    ]
    : [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#12121a]/95 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <p className="font-bold text-white text-sm mb-1">{payload[0].name}</p>
          <p className="text-emerald-400 font-mono font-bold tracking-tight">₹{parseFloat(payload[0].value).toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* 1. Header & Summary */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Icon name="BanknotesIcon" size={32} className="text-emerald-400 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Treasury</h1>
            <p className="text-sm font-medium text-zinc-400 mt-1 uppercase tracking-widest">Financial & Payout Analytics</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="flex-1 sm:flex-none bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-inner group transition-colors hover:border-emerald-500/30">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400/70 transition-colors">Lifetime Net Profit</p>
            <p className="text-2xl font-heading font-black text-white drop-shadow-sm font-mono tracking-tight">₹{lifetimeEarnings.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* 2. Latest Payout Breakdown (Left Column) */}
        <div className="xl:col-span-1 bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col group">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <Icon name="ChartPieIcon" size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Latest Action
              </h2>
            </div>
            {latestPayout && (
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${latestPayout.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  latestPayout.status === 'Processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                {latestPayout.status}
              </span>
            )}
          </div>

          <div className="relative z-10 flex-1 flex flex-col">
            {latestPayout ? (
              <>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-6">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Processed on {latestPayout.date}</p>
                  <p className="text-3xl font-heading font-black text-white font-mono tracking-tight drop-shadow-sm">
                    ₹{latestPayout.totalPayout.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="h-[220px] w-full mt-auto relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-18px' }}>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Net Profit</p>
                    <p className="text-lg font-black text-emerald-400 font-mono tracking-tight">{(latestPayout.netProfit / latestPayout.totalPayout * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60 h-full">
                <Icon name="BanknotesIcon" size={32} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">No payout data</p>
                <p className="text-xs text-zinc-500 mt-1">Accept bookings to see analytics.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Payout History Table (Right Column) */}
        <div className="xl:col-span-2 bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col group min-h-[400px]">
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                <Icon name="ListBulletIcon" size={20} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Payout Ledger
              </h2>
            </div>
            <button className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              Export CSV
            </button>
          </div>

          <div className="flex-1 overflow-x-auto relative z-10">
            {payouts.length > 0 ? (
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500">
                    <th className="pb-4 font-bold text-[10px] uppercase tracking-widest px-4">Date</th>
                    <th className="pb-4 font-bold text-[10px] uppercase tracking-widest px-4">Net Profit</th>
                    <th className="pb-4 font-bold text-[10px] uppercase tracking-widest px-4">Gross Payout</th>
                    <th className="pb-4 font-bold text-[10px] uppercase tracking-widest px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={payout.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group/row"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-zinc-300">
                        {payout.date}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-emerald-400 font-mono tracking-tight">₹{payout.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-zinc-400 font-mono tracking-tight">₹{payout.totalPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${payout.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              payout.status === 'Processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${payout.status === 'Completed' ? 'bg-emerald-400' :
                              payout.status === 'Processing' ? 'bg-blue-400 animate-pulse' :
                                'bg-red-400'
                            }`} />
                          {payout.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
                <Icon name="DocumentTextIcon" size={32} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">No ledger history</p>
                <p className="text-xs text-zinc-500 mt-1">Future transactions will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialTreasury;
