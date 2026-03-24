import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchHostKycList } from '@/lib/admin-actions';
import AdminPageHeader from '../components/AdminPageHeader';
import KycList from './components/KycList';

const KycManagementPage = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') redirect('/auth');

  const kycRecords = await fetchHostKycList();

  return (
    <div>
      <AdminPageHeader
        title="KYC Management"
        subtitle="Review host banking & KYC verification details"
      />
      <KycList initialRecords={kycRecords} />
    </div>
  );
};

export default KycManagementPage;
