import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthClient from './AuthClient';

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
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

  if (user) {
    const { returnTo } = await searchParams;
    const safeReturnTo = returnTo?.startsWith('/guest-booking-flow') ? returnTo : null;
    // Check role and redirect accordingly
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      redirect('/admin-panel');
    } else if (profile?.role === 'host') {
      redirect('/host-onboarding');
    } else {
      redirect(safeReturnTo || '/');
    }
  }

  return <AuthClient />;
}
