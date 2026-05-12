'use client';

import React, { useMemo } from 'react';
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { RevenueForecastData, Booking } from '@/lib/types';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

interface RevenueForecastingProps {
  bookings?: Booking[];
}

const RevenueForecasting: React.FC<RevenueForecastingProps> = ({ bookings = [] }) => {
  const { revenueData, totalProjected, historicalTotal } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const relevantBookings = bookings
      .filter((b) => (b.status === 'confirmed' || b.status === 'completed'))
      .sort((a, b) => a.check_in.localeCompare(b.check_in));

    const forecastMap: { [key: string]: number } = {};
    const historicalMap: { [key: string]: number } = {};
    let projectedTotal = 0;
    let histTotal = 0;

    relevantBookings.forEach((b) => {
      const checkInDate = new Date(b.check_in);
      const dateStr = checkInDate.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      });
      const amount = Number(b.total_price) || 0;

      if (checkInDate >= today) {
        forecastMap[dateStr] = (forecastMap[dateStr] || 0) + amount;
        projectedTotal += amount;
      } else if (checkInDate >= thirtyDaysAgo) {
        historicalMap[dateStr] = (historicalMap[dateStr] || 0) + amount;
        histTotal += amount;
      }
    });

    const chartData = [];
    for (let i = -30; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const earnings = forecastMap[label] || historicalMap[label] || 0;

      chartData.push({
        date: label,
        earnings,
        type: i >= 0 ? 'Projected' : 'Historical'
      });
    }

    return {
      revenueData: chartData,
      totalProjected: projectedTotal,
      historicalTotal: histTotal
    };
  }, [bookings]);

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* 1. Header & Summary */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 md:gap-6 bg-[#0a0a0f]/80 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-success/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-success/30 to-success/10 border border-success/20 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <Icon name="BanknotesIcon" size={20} className="text-success drop-shadow-md sm:hidden" />
            <Icon name="BanknotesIcon" size={28} className="text-success drop-shadow-md hidden sm:block" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-heading font-black text-white tracking-tight drop-shadow-md">Revenue Velocity</h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-400 mt-0.5">Financial Forecasting & AI Insights</p>
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-2 sm:flex items-center gap-4 sm:gap-8 shadow-inner w-full lg:w-auto overflow-hidden">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Historical (30d)</p>
            <p className="text-sm sm:text-xl font-heading font-black text-zinc-400">₹{historicalTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="hidden sm:block h-10 w-[1px] bg-white/10 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-success uppercase tracking-widest whitespace-nowrap">Projected (14d)</p>
            <p className="text-sm sm:text-2xl font-heading font-black text-white">₹{totalProjected.toLocaleString('en-IN')}</p>
          </div>
          <div className="hidden sm:block h-10 w-[1px] bg-white/10 shrink-0" />
          <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-center sm:flex-col gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-md border border-success/20">
              <Icon name="ArrowTrendingUpIcon" size={14} />
              <span className="text-xs font-bold">+{historicalTotal > 0 ? Math.round((totalProjected / historicalTotal) * 100) : 0}%</span>
            </div>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Velocity Score</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        {/* 2. Expected Earnings Chart */}
        <div className="relative group overflow-hidden bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-white/10 p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col min-h-[300px] sm:min-h-[450px]">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-1000" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                <Icon name="ChartBarIcon" size={18} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Revenue Performance
              </h2>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                <span className="inline-block w-2 h-2 bg-zinc-600 rounded-full mr-2 opacity-50"></span>
                Past 30d
              </div>
              <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-bold text-blue-400 uppercase tracking-tighter">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Next 14d
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[200px] sm:min-h-[300px] relative z-10 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={15}
                  fontWeight={600}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
                  fontWeight={600}
                  dx={-15}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    backgroundColor: 'rgba(10,10,15,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProjected)"
                  activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecasting;
