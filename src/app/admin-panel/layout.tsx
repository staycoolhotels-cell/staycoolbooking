import React from 'react';
import AdminShell from './components/AdminShell';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );

  // Use getUser() for better security instead of getSession()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth');
  }

  // Check user role from public.users table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
    // User exists in auth but not in public.users - sign out and redirect
    await supabase.auth.signOut();
    redirect('/auth');
  }

  // Redirect non-admin users to their appropriate dashboards
  if (userProfile.role === 'host') {
    redirect('/host-dashboard');
  }

  if (userProfile.role === 'guest') {
    redirect('/');
  }

  // Only admins can proceed
  if (userProfile.role !== 'admin') {
    redirect('/');
  }

  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
