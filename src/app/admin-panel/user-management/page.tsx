import { syncAndFetchUsers } from '@/lib/admin-actions';
import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserList from './components/UserList';
import AdminPageHeader from '../components/AdminPageHeader';

const UserManagementPage = async () => {
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

  // Use the sync action to fetch users, ensuring any missing from public.users are created
  const users = await syncAndFetchUsers();

  return (
    <div>
      <AdminPageHeader
        title="User Management"
        subtitle="Control platform access and user profiles"
      />
      <UserList initialUsers={users || []} />
    </div>
  );
};

export default UserManagementPage;
