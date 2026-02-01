'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '@/lib/types';

const COLORS = {
  accommodation: '#3b82f6', // blue-500
  service_fee: '#8b5cf6', // violet-500
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
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-2">
          <p className="label text-white">{`${payload[0].name} : ₹${payload[0].value.toFixed(2)}`}</p>
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
            fill="#8884d8"
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
