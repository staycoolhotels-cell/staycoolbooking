import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import UserProfileInteractive from './components/UserProfileInteractive';

export default async function ProfilePage() {
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
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    redirect('/auth');
  }

  const { data: profile, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (userError || !profile) {
    console.error('Error fetching user data or user not found:', JSON.stringify(userError, null, 2));
    redirect('/signup');
  }

  const user = {
    ...profile,
    email: session.user.email,
    name: session.user.user_metadata.name,
    avatar_url: session.user.user_metadata.avatar_url,
  };

  const { data: personalInfo, error: personalInfoError } = await supabase
    .from('user_personal_info')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const { data: verifications, error: verificationsError } = await supabase
    .from('verifications')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('guest_id', session.user.id);

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, properties!inner(*)')
    .eq('guest_id', session.user.id);

  const { data: achievements, error: achievementsError } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', session.user.id);

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('guest_id', session.user.id);

  const { data: wishlist, error: wishlistError } = await supabase
    .from('wishlist')
    .select('*, properties!inner(*)')
    .eq('user_id', session.user.id);



  const userData = {
    ...user,
    ...personalInfo,
    verifications,
    reviews,
    bookings,
    achievements,
    transactions,
    wishlist,
  };

  return (
    <main className="min-h-screen bg-[#050505] pb-12 pt-[100px]">
      
      {/* Main Profile Component renders Overview, Reviews, or Settings based on user interaction */}
      <div className="py-8">
        {userData && <UserProfileInteractive userData={userData as any} />}
      </div>
    </main>
  );
}
