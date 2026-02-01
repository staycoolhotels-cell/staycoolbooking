'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const processData = (transactions: Transaction[]) => {
  const totalRevenue = transactions
    .filter((t) => t.status === 'completed')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalRefunds = 0; // Assuming no refunds table for now

  const netRevenue = totalRevenue - totalRefunds;

  const monthlyData = transactions.reduce(
    (acc, t) => {
      const month = format(new Date(t.date), 'MMM');
      if (!acc[month]) {
        acc[month] = { revenue: 0, refunds: 0 };
      }
      if (t.status === 'completed') {
        acc[month].revenue += t.amount || 0;
      }
      return acc;
    },
    {} as Record<string, { revenue: number; refunds: number }>
  );

  const chartData = Object.keys(monthlyData).map((month) => ({
    name: month,
    revenue: monthlyData[month].revenue,
    refunds: Math.abs(monthlyData[month].refunds),
  }));

  return { totalRevenue, totalRefunds, netRevenue, chartData };
};

interface FinancialsListProps {
  initialTransactions: Transaction[];
}

const FinancialsList = ({ initialTransactions }: FinancialsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const { totalRevenue, totalRefunds, netRevenue, chartData } = processData(transactions);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions((prev) => [...prev, payload.new as Transaction]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) => prev.filter((t) => t.id !== (payload.old as Transaction).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{Math.abs(totalRefunds).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{netRevenue.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue and Refunds</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="refunds" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction: Transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.id}</TableCell>
                <TableCell>{format(new Date(transaction.date), 'MM/dd/yyyy')}</TableCell>
                <TableCell>₹{transaction.amount?.toLocaleString('en-IN')}</TableCell>
                <TableCell>
                  <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                    {transaction.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FinancialsList;
