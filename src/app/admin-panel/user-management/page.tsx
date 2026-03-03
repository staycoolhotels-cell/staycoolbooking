import { syncAndFetchUsers } from '@/lib/admin-actions';
import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import UserList from './components/UserList';
import FixTriggersButton from './components/FixTriggersButton';

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <FixTriggersButton />
          <Button asChild>
            <Link href="/signup">Add User</Link>
          </Button>
        </div>
      </div>
      <UserList initialUsers={users || []} />
    </div>
  );
};

export default UserManagementPage;
