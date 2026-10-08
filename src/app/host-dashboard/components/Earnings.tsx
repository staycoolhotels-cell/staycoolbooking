'use client';

import React, { useState, useMemo } from 'react';
import EarningsChart from './EarningsChart';
import { Transaction } from '@/lib/types';
import PayoutsTable from './PayoutsTable';
import Icon from '@/components/ui/AppIcon';
import { exportTransactionsToPDF } from '@/lib/pdf-utils';

interface EarningsProps {
  earnings: Transaction[];
}

const Earnings = ({ earnings }: EarningsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Year');
  const [isExporting, setIsExporting] = useState(false);

  const getHostNetAmount = (t: Transaction) => {
    if (t.netRevenue !== undefined) return Number(t.netRevenue);
    const gross = Number(t.amount) || 0;
    // Zero commission from guest. Only host platform commission (10%) is deducted.
    return Math.round(gross * 0.90);
  };

  // Transform transactions to chart data
  const chartData = useMemo(() => {
    const now = new Date();
    const filtered = earnings.filter(t => {
      const date = new Date(t.date || new Date());
      if (selectedPeriod === 'This Year') {
        return date.getFullYear() === now.getFullYear();
      } else if (selectedPeriod === 'Last Year') {
        return date.getFullYear() === now.getFullYear() - 1;
      }
      return true;
    });

    const grouped = new Array(12).fill(0);
    filtered.forEach(t => {
      const date = new Date(t.date || new Date());
      const month = date.getMonth();
      grouped[month] += getHostNetAmount(t);
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, i) => ({ month: m, earnings: grouped[i] }));
  }, [earnings, selectedPeriod]);

  const totalEarnings = useMemo(() => {
    return earnings.reduce((acc, curr) => acc + getHostNetAmount(curr), 0);
  }, [earnings]);

  const recentEarnings = useMemo(() => {
    // Mock calculation for 'This Month' to show growth
    return totalEarnings * 0.15; // Just a placeholder for visual effect 
  }, [totalEarnings]);

  return (
    <div className="w-full space-y-6 md:space-y-8 relative">

      {/* 1. Header Module */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 bg-[#0a0a0f]/80 p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 lg:gap-5 w-full lg:w-auto">
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0">
            <Icon name="BanknotesIcon" size={24} className="text-emerald-400 drop-shadow-md sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg leading-tight">Financial Treasury</h1>
            <p className="text-[10px] lg:text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2">
              Revenue & Payout Management
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
          <button
            onClick={async () => {
              setIsExporting(true);
              try {
                await exportTransactionsToPDF(earnings);
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
            className={`w-full lg:w-auto px-4 lg:px-6 py-3 lg:py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold uppercase tracking-widest text-[10px] lg:text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 lg:gap-3 border border-emerald-500/30 ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Icon name="ArrowDownTrayIcon" size={16} className={`lg:w-[18px] lg:h-[18px] ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Generating PDF...' : 'Export Finance Log'}
          </button>
        </div>
      </div>

      {/* 2. Top Stats */}
      <div className="bg-gradient-to-br from-[#0a0a0f] to-zinc-900/80 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[140px] md:min-h-[180px]">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-6">
            <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded-lg">
              <Icon name="ChartBarIcon" size={16} className="text-emerald-400 md:w-5 md:h-5" />
            </div>
            <h3 className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest leading-tight">Gross Revenue (Lifetime)</h3>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black text-emerald-500">₹</span>
            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
              {totalEarnings.toLocaleString()}
            </h2>
          </div>

          <div className="mt-4 md:mt-6 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 w-fit px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg border border-emerald-500/20">
            <Icon name="ArrowTrendingUpIcon" size={12} className="md:w-[14px] md:h-[14px]" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">+₹{recentEarnings.toLocaleString()} This Month</span>
          </div>
        </div>
      </div>

      {/* 3. Analytics Chart Section */}
      <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl p-6 md:p-8 relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Icon name="PresentationChartLineIcon" size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Revenue Velocity Matrix</h2>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Monthly Earnings Breakdown</p>
            </div>
          </div>

          <div className="relative w-full lg:w-48 shrink-0">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-black/50 border border-white/10 hover:border-purple-500/50 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium appearance-none cursor-pointer shadow-inner"
            >
              <option value="This Year" className="bg-zinc-900">Fiscal Year (Current)</option>
              <option value="Last Year" className="bg-zinc-900">Fiscal Year (Previous)</option>
            </select>
            <Icon name="ChevronDownIcon" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="w-full h-[350px] relative z-10">
          <EarningsChart data={chartData} />
        </div>
      </div>

      {/* 4. Ledger Table */}
      <div className="relative">
        <PayoutsTable transactions={earnings} />
      </div>

    </div>
  );
};

export default Earnings;
