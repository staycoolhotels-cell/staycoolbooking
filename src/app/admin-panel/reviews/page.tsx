import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Role-based check: only admins can access this page
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/auth');
  }

  const { data: reviews, error } = await supabase.from('reviews').select('*');

  if (error) {
    console.error('Error fetching reviews:', error);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Reviews Management</h1>
      <ReviewList initialReviews={reviews || []} />
    </div>
  );
};

export default ReviewsPage;
