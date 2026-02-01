import React from 'react';
import { PayoutData, PayoutStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const dummyPayouts: PayoutData[] = [
  {
    id: 'payout1',
    date: '2024-01-05',
    platformFee: 50,
    gstTaxes: 20,
    netProfit: 430,
    totalPayout: 500,
    status: 'Completed',
  },
  {
    id: 'payout2',
    date: '2024-01-12',
    platformFee: 60,
    gstTaxes: 25,
    netProfit: 515,
    totalPayout: 600,
    status: 'Initiated',
  },
  {
    id: 'payout3',
    date: '2024-01-19',
    platformFee: 45,
    gstTaxes: 18,
    netProfit: 387,
    totalPayout: 450,
    status: 'Completed',
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const FinancialTreasury: React.FC = () => {
  const latestPayout = dummyPayouts[0]; // Assuming latest payout is the first one

  const pieChartData = latestPayout
    ? [
        { name: 'Platform Fee', value: latestPayout.platformFee },
        { name: 'GST/Taxes', value: latestPayout.gstTaxes },
        { name: 'Net Profit', value: latestPayout.netProfit },
      ]
    : [];

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">
        Financial Treasury & Payout Analytics
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Latest Payout Summary</h2>
          {latestPayout ? (
            <div>
              <p className="text-zinc-400">
                <strong>Date:</strong> {latestPayout.date}
              </p>
              <p className="text-zinc-400">
                <strong>Total Payout:</strong> ₹{latestPayout.totalPayout.toFixed(2)}
              </p>
              <p className="text-zinc-400">
                <strong>Status:</strong>{' '}
                <span
                  className={`font-semibold ${latestPayout.status === 'Completed' ? 'text-green-600' : latestPayout.status === 'Initiated' ? 'text-blue-600' : 'text-red-600'}`}
                >
                  {latestPayout.status}
                </span>
              </p>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `₹${typeof value === 'number' ? value.toFixed(2) : parseFloat(value as string).toFixed(2)}`
                      }
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: 'none',
                        borderRadius: '0.5rem',
                      }}
                      itemStyle={{ color: 'white' }}
                      labelStyle={{ color: 'white' }}
                    />
                    <Legend wrapperStyle={{ color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-white/50">No payout data available.</p>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Payout History</h2>
          {dummyPayouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Net Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Total Payout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-white/10">
                  {dummyPayouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {payout.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        ₹{payout.netProfit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        ₹{payout.totalPayout.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payout.status === 'Completed' ? 'bg-green-500/20 text-green-400' : payout.status === 'Initiated' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}
                        >
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-white/50">No payout history available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialTreasury;
