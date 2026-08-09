import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import HostOnboardingClient from './HostOnboardingClient';

export const metadata = { title: 'Host setup - StayCool' };

export default async function HostOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ 'property-created'?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth?role=host');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'host') redirect('/');

  const admin = createServiceClient();
  const [{ count: propertyCount }, { data: kyc }] = await Promise.all([
    admin.from('properties').select('*', { count: 'exact', head: true }).eq('host_id', user.id),
    admin.from('host_kyc_details').select('kyc_status').eq('user_id', user.id).maybeSingle(),
  ]);

  if (propertyCount && kyc?.kyc_status === 'activated') redirect('/host-dashboard');

  const params = await searchParams;
  return (
    <HostOnboardingClient
      hasProperty={Boolean(propertyCount)}
      propertyCreated={params['property-created'] === '1'}
    />
  );
}
