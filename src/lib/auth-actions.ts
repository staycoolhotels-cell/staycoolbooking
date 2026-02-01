'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logActivity } from './activity-actions';

const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
        set: (name: string, value: string, options) => {
          cookieStore.set(name, value, options);
        },
        remove: (name: string, options) => {
          cookieStore.delete(name);
        },
      },
    }
  );
};

/**
 * Handles new user registration with role-based metadata.
 */
export async function signUpUser(prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const name = formData.get('fullName') as string;
  const role = formData.get('role') as 'Guest' | 'Host' | null;
  const finalRole = role === 'Host' || role === 'Guest' ? role.toLowerCase() : 'guest';

  if (!email || !password || !confirmPassword || !name) {
    return 'All fields are required.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
        role: finalRole,
      },
    },
  });

  if (error) {
    return error.message;
  }
  if (data.user) {
    await logActivity('new_user', `New user signed up: ${name} as ${finalRole}`, data.user.id);
    // Redirect to a generic page. Host accounts need approval.
    redirect('/user-profile');
  }
  return undefined; // Indicate success
}

/**
 * Signs the user out of the current session.
 */
export const signOutUser = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
};

export async function login(prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createSupabaseServerClient();

  if (!email || !password) {
    return 'Email and password are required.';
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return 'Invalid login credentials';
  }

  if (signInData.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', signInData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return 'Could not retrieve user profile. Please try again.';
    }

    // Role-based redirection logic
    if (profile.role === 'admin') {
      redirect('/admin-panel');
    }

    if (profile.role === 'host') {
      if (profile.status === 'active') {
        redirect('/host-dashboard');
      } else {
        await supabase.auth.signOut();
        if (profile.status === 'pending') {
          return 'Your host account is pending approval from an administrator.';
        }
        if (profile.status === 'rejected') {
          return 'Your host account application has been rejected.';
        }
        return 'Your host account is not active.';
      }
    }
    if (profile.role === 'guest') {
      redirect('/user-profile');
    }
  }

  redirect('/user-profile');
}
