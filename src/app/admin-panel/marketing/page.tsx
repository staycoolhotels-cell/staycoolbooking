import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Campaign } from '@/lib/types';
import CampaignList from './components/CampaignList';

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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    redirect('/auth');
  }

  const { data: campaigns, error } = await supabase.from('campaigns').select('*');

  if (error) {
    console.error('Error fetching campaigns:', error);
    // Handle error appropriately
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Marketing Dashboard</h1>
      <CampaignList initialCampaigns={campaigns || []} />
    </div>
  );
};

export default MarketingPage;
