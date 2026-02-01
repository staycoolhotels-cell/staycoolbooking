import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Review } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import ReviewList from './components/ReviewList';

const ReviewsPage = async () => {
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

  const { data: reviews, error } = await supabase.from('reviews').select('*');

  if (error) {
    console.error('Error fetching reviews:', error);
    // Handle error appropriately
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Reviews Management</h1>
      <ReviewList initialReviews={reviews || []} />
    </div>
  );
};

export default ReviewsPage;
