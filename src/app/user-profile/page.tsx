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

  // Use getUser() for better security instead of getSession()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth');
  }

  const { data: profile, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (userError || !profile) {
    console.error('Error fetching user data or user not found:', JSON.stringify(userError, null, 2));
    redirect('/signup');
  }

  // Role-based access control
  // Redirect admins to admin panel
  if (profile.role === 'admin') {
    redirect('/admin-panel');
  }

  // Redirect hosts to host dashboard
  if (profile.role === 'host') {
    redirect('/host-dashboard');
  }

  // Only guests should access this page
  if (profile.role !== 'guest') {
    redirect('/');
  }

  const userData = {
    ...profile,
    email: user.email,
    name: user.user_metadata.name || profile.name,
    avatar_url: user.user_metadata.avatar_url || profile.avatar_url,
    reward_points: 0, // Default value
  };

  const { data: profilePoints } = await supabase
    .from('profiles')
    .select('reward_points')
    .eq('id', user.id)
    .maybeSingle();

  if (profilePoints) {
    userData.reward_points = profilePoints.reward_points;
  }

  const { data: personalInfo, error: personalInfoError } = await supabase
    .from('user_personal_info')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: verifications, error: verificationsError } = await supabase
    .from('verifications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: rawReviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*, reviewer:users!reviewer_id(name)')
    .eq('receiver_id', user.id);

  const reviews = rawReviews?.map((rev: any) => ({
    ...rev,
    guestName: rev.reviewer?.name || 'Host',
  })) || [];

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, properties!inner(*)')
    .eq('guest_id', user.id);

  const { data: achievements, error: achievementsError } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id);

  const mappedTransactions = (bookings || []).map(b => ({
    id: b.id,
    booking_id: b.id.slice(0, 8).toUpperCase(),
    amount: Number(b.total_price),
    date: new Date(b.created_at).toLocaleDateString(),
    type: (b.status === 'confirmed' || b.status === 'completed') ? 'payment' : 
          (b.status === 'cancelled' || b.status === 'refunded') ? 'refund' : 'other',
    status: (b.status === 'confirmed' || b.status === 'completed') ? 'completed' : 
            (b.status === 'cancelled' ? 'refunded' : 'pending'),
    breakdown: {
      accommodation: Number(b.total_price) * 0.9,
      service_fee: Number(b.total_price) * 0.1,
      taxes: 0
    }
  }));

  const { data: wishlist, error: wishlistError } = await supabase
    .from('wishlist')
    .select('*, properties(*)')
    .eq('user_id', user.id);

  const allUserData = {
    ...userData,
    ...personalInfo,
    email: user.email, // Ensure email is not overwritten by null in personalInfo
    verifications,
    reviews,
    bookings,
    achievements,
    transactions: mappedTransactions,
    wishlist,
  };

  return (
    <main className="min-h-screen bg-[#080808] pb-12">

      {/* Main Profile Component renders Overview, Reviews, or Settings based on user interaction */}
      <div className="py-2">
        {allUserData && <UserProfileInteractive userData={allUserData as any} />}
      </div>
    </main>
  );
}
