import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CampaignList from './components/CampaignList';
import AdminPageHeader from '../components/AdminPageHeader';

const MarketingPage = async () => {
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

  const { data: campaigns, error } = await supabase.from('campaigns').select('*');

  if (error) {
    console.error('Error fetching campaigns:', error);
  }

  return (
    <div>
      <AdminPageHeader
        title="Marketing Hub"
        subtitle="Manage promotional campaigns and visibility"
      />
      <CampaignList initialCampaigns={campaigns || []} />
    </div>
  );
};

export default MarketingPage;
