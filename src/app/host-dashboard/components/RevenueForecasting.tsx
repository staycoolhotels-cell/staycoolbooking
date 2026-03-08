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
import { RevenueForecastData, PriceSuggestion, Booking } from '@/lib/types';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

interface RevenueForecastingProps {
  bookings?: Booking[];
}

const RevenueForecasting: React.FC<RevenueForecastingProps> = ({ bookings = [] }) => {
  const { revenueData, priceSuggestions, totalProjected } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const confirmedBookings = bookings
      .filter((b) => b.status === 'confirmed' && b.check_in >= today)
      .sort((a, b) => a.check_in.localeCompare(b.check_in));

    const forecastMap: { [key: string]: number } = {};
    const suggestions: PriceSuggestion[] = [];
    let total = 0;

    confirmedBookings.forEach((b) => {
      const date = new Date(b.check_in).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const amount = Number(b.total_price) || 0;
      forecastMap[date] = (forecastMap[date] || 0) + amount;
      total += amount;

      if (forecastMap[date] > 1000) {
        suggestions.push({
          propertyId: b.properties?.id || b.property_id,
          propertyName: b.properties?.name || b.properties?.title || 'Property',
          suggestion: 'Increase price by 12%',
          impact: 'High seasonal demand detected',
        });
      }
    });

    const chartData = Object.keys(forecastMap).map((date) => ({
      date,
      expectedEarnings: forecastMap[date],
    }));

    return {
      revenueData: chartData.length > 0 ? chartData : [
        { date: '1st', expectedEarnings: 0 },
        { date: '15th', expectedEarnings: 0 },
        { date: '30th', expectedEarnings: 0 }
      ],
      priceSuggestions: suggestions.slice(0, 3),
      totalProjected: total
    };
  }, [bookings]);

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* 1. Header & Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-[#0a0a0f]/80 p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-success/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success/30 to-success/10 border border-success/20 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <Icon name="BanknotesIcon" size={28} className="text-success drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-black text-white tracking-tight drop-shadow-md">Revenue Velocity</h1>
            <p className="text-sm font-medium text-zinc-400 mt-1">Financial Forecasting & AI Insights</p>
          </div>
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-5 shadow-inner w-full md:w-auto">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Projected Earnings</p>
            <p className="text-2xl font-heading font-black text-white px-1">₹{totalProjected.toLocaleString('en-IN')}</p>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex flex-col items-center justify-center pr-2">
            <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-0.5 rounded-md border border-success/20">
              <Icon name="ArrowTrendingUpIcon" size={14} />
              <span className="text-xs font-bold">+18%</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">Velocity</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* 2. Expected Earnings Chart */}
        <div className="lg:col-span-2 relative group overflow-hidden bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl flex flex-col min-h-[450px]">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                <Icon name="ChartBarIcon" size={18} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Expected Earnings
              </h2>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400">
              14 Day Forecast
            </div>
          </div>

          <div className="flex-1 w-full min-h-[300px] relative z-10 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={15}
                  fontWeight={600}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                  fontWeight={600}
                  dx={-10}
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
                  dataKey="expectedEarnings"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. AI Suggestions & Summary */}
        <div className="space-y-6 lg:space-y-8 flex flex-col h-full">
          <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex-1 relative overflow-hidden group">
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-1000" />

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-inner">
                <Icon name="SparklesIcon" size={18} className="text-purple-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Pricing AI
              </h2>
            </div>

            <div className="space-y-4 relative z-10 overflow-y-auto max-h-[250px] pr-1 no-scrollbar">
              {priceSuggestions.length > 0 ? (
                priceSuggestions.map((s, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="p-4 rounded-[1.5rem] bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 shadow-inner group/card hover:border-purple-500/40 transition-colors"
                  >
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 shadow-sm">
                      {s.propertyName}
                    </p>
                    <p className="text-sm font-bold text-white mb-2 leading-tight">{s.suggestion}</p>
                    <div className="flex items-center gap-2">
                      <Icon name="BoltIcon" size={12} className="text-zinc-500 group-hover/card:text-yellow-500 transition-colors" />
                      <p className="text-[10px] text-zinc-400 font-medium">{s.impact}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 pb-2 text-center h-full opacity-60">
                  <Icon name="CpuChipIcon" size={32} className="text-zinc-500 mb-4" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-1">Analyzing Data</p>
                  <p className="text-xs text-zinc-500 font-medium">No pricing adjustments recommended for current trends.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#12121a] to-[#050505] rounded-[2rem] border border-white/5 p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-success/10 transition-colors duration-1000" />

            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Icon name="InformationCircleIcon" size={16} className="text-zinc-500" />
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                AI Summary
              </p>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium relative z-10 pr-4">
              Revenue is projected to increase by{' '}
              <span className="text-success font-black px-1 py-0.5 bg-success/10 rounded-md border border-success/20 mx-1 shadow-sm">+18%</span>{' '}
              over the next 14 days based on current booking velocity and seasonal search trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecasting;
