'use client';

import React, { useState, useMemo } from 'react';
import EarningsChart from './EarningsChart';
import { Transaction } from '@/lib/types';
import HostConnectRazorpay from '@/components/HostConnectRazorpay';
import PayoutsTable from './PayoutsTable';
import { format, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

interface EarningsProps {
  earnings: Transaction[]; // Changed from Earning[] to Transaction[]
}

const Earnings = ({ earnings }: EarningsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Year');

  // Transform transactions to chart data
  const chartData = useMemo(() => {
    // Filter by period (mock implementation for "This Year")
    const now = new Date();
    const filtered = earnings.filter(t => {
      const date = new Date(t.date || new Date());
      if (selectedPeriod === 'This Year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Group by month
    const grouped = new Array(12).fill(0);
    filtered.forEach(t => {
      const date = new Date(t.date || new Date());
      const month = date.getMonth();
      // Assuming amount is in property currency units (e.g. INR)
      grouped[month] += Number(t.amount);
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, i) => ({ month: m, earnings: grouped[i] }));

  }, [earnings, selectedPeriod]);

  const totalEarnings = useMemo(() => {
    return earnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [earnings]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 col-span-2">
          <h3 className="text-xl font-bold text-white mb-4">Payout Settings</h3>
          <p className="text-zinc-400 text-sm mb-4">Connect your bank account via Razorpay to receive automatic payouts.</p>
          <div className="max-w-md">
            <HostConnectRazorpay />
          </div>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 flex flex-col justify-center">
          <p className="text-zinc-400 font-medium mb-2">Total Earnings</p>
          <h2 className="text-4xl font-bold text-green-400">₹{totalEarnings.toLocaleString()}</h2>
          <p className="text-zinc-500 text-sm mt-2">Lifetime revenue</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Analytics</h2>
        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border border-border rounded-lg bg-zinc-900 text-text-primary border-zinc-700"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option>This Year</option>
            <option>Last Year</option>
          </select>
          <button
            onClick={() => console.log(`Exporting earnings for: ${selectedPeriod}`)}
            className="px-4 py-2 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-lg font-semibold"
          >
            Export CSV
          </button>
        </div>
      </div>

      <EarningsChart data={chartData} />

      <div className="mt-8">
        <PayoutsTable transactions={earnings} />
      </div>
    </div>
  );
};

export default Earnings;
