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
  const [dynamicSuggestions, setDynamicSuggestions] = React.useState<PriceSuggestion[]>([]);
  const [loadingAI, setLoadingAI] = React.useState(false);

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

  React.useEffect(() => {
    const fetchAI = async () => {
      const propIds = Array.from(new Set(bookings.map(b => b.property_id).filter(Boolean)));
      if (propIds.length === 0) return;
      
      setLoadingAI(true);
      try {
        const { generatePricingAI } = await import('@/lib/pricing-actions');
        const suggestions = await generatePricingAI(propIds);
        setDynamicSuggestions(suggestions);
      } catch (err) {
        console.error('Failed to fetch Pricing AI:', err);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchAI();
  }, [bookings]);

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* 1. Header & Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-6 bg-[#0a0a0f]/80 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
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

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 shadow-inner w-full md:w-auto">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Historical (30d)</p>
            <p className="text-base sm:text-xl font-heading font-black text-zinc-400 px-1">₹{historicalTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div>
            <p className="text-[10px] font-bold text-success uppercase tracking-widest pl-1">Projected (14d)</p>
            <p className="text-lg sm:text-2xl font-heading font-black text-white px-1">₹{totalProjected.toLocaleString('en-IN')}</p>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex flex-col items-center justify-center pr-2">
            <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-0.5 rounded-md border border-success/20">
              <Icon name="ArrowTrendingUpIcon" size={14} />
              <span className="text-xs font-bold">+{historicalTotal > 0 ? Math.round((totalProjected / historicalTotal) * 100) : 0}%</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">Velocity</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* 2. Expected Earnings Chart */}
        <div className="lg:col-span-2 relative group overflow-hidden bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-white/10 p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col min-h-[300px] sm:min-h-[450px]">
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
                  stroke={(props) => (props as any).payload?.type === 'Projected' ? '#3b82f6' : '#52525b'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProjected)"
                  activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. AI Suggestions & Summary */}
        <div className="space-y-6 lg:space-y-8 flex flex-col h-full">
          <div className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-white/10 p-3 sm:p-6 shadow-2xl flex-1 relative overflow-hidden group">
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-1000" />

            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-8 relative z-10">
              <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-inner">
                <Icon name="BanknotesIcon" size={15} className="text-purple-400 sm:hidden" />
                <Icon name="BanknotesIcon" size={18} className="text-purple-400 hidden sm:block" />
              </div>
              <h2 className="text-xs sm:text-sm font-heading font-bold text-white uppercase tracking-wider">
                Pricing AI
              </h2>
            </div>

            <div className="space-y-4 relative z-10 overflow-y-auto max-h-[280px] pr-1 no-scrollbar">
              {loadingAI ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <Icon name="ArrowPathIcon" size={32} className="text-purple-500 animate-spin mb-4" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Consulting AI Strategist...</p>
                </div>
              ) : dynamicSuggestions.length > 0 ? (
                dynamicSuggestions.map((s, idx) => (
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

          <div className="bg-gradient-to-br from-[#12121a] to-[#050505] rounded-xl sm:rounded-[2rem] border border-white/5 p-3 sm:p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-success/10 transition-colors duration-1000" />

            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Icon name="InformationCircleIcon" size={16} className="text-zinc-500" />
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                AI Summary
              </p>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium relative z-10 pr-4">
              Revenue growth is currently optimized based on local demand markers. 
              Pricing AI suggests periodic adjustments to maximize yield during high-velocity windows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecasting;
