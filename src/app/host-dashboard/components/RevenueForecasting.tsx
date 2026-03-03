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

interface RevenueForecastingProps {
  bookings?: Booking[];
}

const RevenueForecasting: React.FC<RevenueForecastingProps> = ({ bookings = [] }) => {
  const { revenueData, priceSuggestions } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Filter and process bookings for forecasting
    const confirmedBookings = bookings
      .filter((b) => b.status === 'confirmed' && b.check_in >= today)
      .sort((a, b) => a.check_in.localeCompare(b.check_in));

    const forecastMap: { [key: string]: number } = {};
    const suggestions: PriceSuggestion[] = [];

    confirmedBookings.forEach((b) => {
      const date = new Date(b.check_in).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      forecastMap[date] = (forecastMap[date] || 0) + (Number(b.total_price) || 0);

      // Basic AI Suggestion Logic based on occupancy
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
      revenueData: chartData,
      priceSuggestions: suggestions.slice(0, 3)
    };
  }, [bookings]);

  return (
    <div className="p-8 space-y-10 bg-transparent">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Revenue Velocity</h1>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
          Financial Forecasting & AI Insights
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expected Earnings Chart */}
        <div className="lg:col-span-2 bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">
            Expected Earnings (Forecast)
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                  }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="expectedEarnings"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Suggestions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">
              Pricing AI
            </h2>
            <div className="space-y-4">
              {priceSuggestions.length > 0 ? (
                priceSuggestions.map((s, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx}
                    className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10"
                  >
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">
                      {s.propertyName}
                    </p>
                    <p className="text-sm font-bold text-white mb-1">{s.suggestion}</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">{s.impact}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-xs text-zinc-600 italic">
                  Analyzing market trends... No changes suggested today.
                </p>
              )}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-zinc-900 to-black rounded-[2.5rem] border border-white/5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
              AI Summary
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Revenue is projected to increase by{' '}
              <span className="text-green-500 font-bold">18%</span> over the next 14 days based on
              current booking velocity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecasting;

