import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
import FinancialsList from './components/FinancialsList';

const FinancialsPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    redirect('/auth');
  }

  const { data: transactions, error } = await supabase.from('transactions').select('*');

  if (error) {
    console.error('Error fetching transactions:', error);
    // Handle error appropriately
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Financials</h1>
      <FinancialsList initialTransactions={transactions || []} />
    </div>
  );
};

export default FinancialsPage;
