'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '@/lib/types';

const COLORS: Record<string, string> = {
  accommodation: '#0ea5e9', // sky-500
  'host payout': '#0ea5e9',
  host_payout: '#0ea5e9',
  service_fee: '#8b5cf6', // violet-500
  'service fee': '#8b5cf6',
  platform_fee: '#8b5cf6',
  'platform fee': '#8b5cf6',
  taxes: '#f43f5e', // rose-500
};

type SpendingChartProps = {
  transactions?: Transaction[];
  mode?: 'admin' | 'guest';
};

const SpendingChart = ({ transactions = [], mode }: SpendingChartProps) => {
  const paymentTransactions = transactions.filter(
    (t) => t.type === 'payment' || t.status === 'completed' || (!t.type && (t.amount || 0) > 0)
  );

  const isAdminMode = mode === 'admin' || (!mode && paymentTransactions.some(t => t.adminCommissionAmount !== undefined));

  const accumulated = paymentTransactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount || 0);

      if (isAdminMode) {
        // Admin Panel: Total Service Fee = 10% Guest Service Fee + 10% Host Commission (Total Admin Revenue)
        let adminServiceFee = 0;
        if (t.adminCommissionAmount !== undefined && t.adminCommissionAmount !== null) {
          adminServiceFee = Number(t.adminCommissionAmount);
        } else {
          const guestFee = Number(t.serviceFee) || Math.round((amount * 0.1) / 1.1);
          const hostRev = Math.max(0, amount - guestFee);
          const hostComm = Math.round(hostRev * 0.10);
          adminServiceFee = guestFee + hostComm;
        }

        let hostPayout = 0;
        if (t.hostPayoutAmount !== undefined && t.hostPayoutAmount !== null) {
          hostPayout = Number(t.hostPayoutAmount);
        } else {
          hostPayout = Math.max(0, amount - adminServiceFee);
        }

        acc.accommodation += hostPayout;
        acc.service_fee += adminServiceFee;
        acc.taxes += (t.breakdown?.taxes ?? 0);
      } else {
        // Guest Profile View: Accommodation Charges + Guest Service Fee
        const serviceFee =
          t.breakdown?.service_fee !== undefined
            ? Number(t.breakdown.service_fee)
            : t.serviceFee !== undefined
            ? Number(t.serviceFee)
            : Math.round((amount * 0.1) / 1.1);
        const accommodation =
          t.breakdown?.accommodation !== undefined
            ? Number(t.breakdown.accommodation)
            : Math.max(0, amount - serviceFee);
        const taxes = Number(t.breakdown?.taxes ?? 0);

        acc.accommodation += accommodation;
        acc.service_fee += serviceFee;
        acc.taxes += taxes;
      }
      return acc;
    },
    { accommodation: 0, service_fee: 0, taxes: 0 }
  );

  let data = Object.entries(accumulated).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value: value,
  }));

  const totalVal = data.reduce((sum, item) => sum + item.value, 0);

  if (totalVal === 0) {
    data = [
      { name: 'accommodation', value: isAdminMode ? 80 : 90 },
      { name: 'service fee', value: isAdminMode ? 20 : 10 },
      { name: 'taxes', value: 0 },
    ];
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const val = Number(entry.value);
      const isFee = String(entry.name).toLowerCase().includes('service') || String(entry.name).toLowerCase().includes('fee');
      const formattedVal = Number.isInteger(val)
        ? val.toLocaleString('en-IN')
        : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return (
        <div className="bg-zinc-900/95 backdrop-blur-md border border-sky-500/20 rounded-lg p-2.5 shadow-xl shadow-sky-900/20">
          <p className="label text-sky-100 font-medium">{`${entry.name} : ₹${formattedVal}`}</p>
          {isAdminMode && isFee && (
            <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Guest 10% Fee + Host 10% Commission</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={50}
            fill="#38bdf8"
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name] || COLORS[entry.name.replace(' ', '_')] || '#0ea5e9'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingChart;
