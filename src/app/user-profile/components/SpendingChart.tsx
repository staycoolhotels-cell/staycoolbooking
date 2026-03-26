'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '@/lib/types';

const COLORS = {
  accommodation: '#0ea5e9', // sky-500
  service_fee: '#38bdf8', // sky-400
  taxes: '#ef4444', // red-500
};

type SpendingChartProps = {
  transactions: Transaction[];
};

const SpendingChart = ({ transactions }: SpendingChartProps) => {
  const paymentTransactions = transactions.filter((t) => t.type === 'payment');

  const data = Object.entries(
    paymentTransactions.reduce(
      (acc, t) => {
        if (t.breakdown) {
          acc.accommodation += t.breakdown.accommodation;
          acc.service_fee += t.breakdown.service_fee;
          acc.taxes += t.breakdown.taxes;
        }
        return acc;
      },
      { accommodation: 0, service_fee: 0, taxes: 0 }
    )
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-md border border-sky-500/20 rounded-lg p-2 shadow-xl shadow-sky-900/20">
          <p className="label text-sky-100 font-medium">{`${payload[0].name} : ₹${payload[0].value.toFixed(2)}`}</p>
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
                fill={COLORS[entry.name.replace(' ', '_') as keyof typeof COLORS]}
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
