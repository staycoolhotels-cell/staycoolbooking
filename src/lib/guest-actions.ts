'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const createSupabaseAdminClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
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

const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
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

export async function getGuestProfileForHost(guestId: string) {
  try {
    const supabaseUser = await createSupabaseServerClient();
    const { data: { user: hostUser }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !hostUser) {
      throw new Error('Unauthorized');
    }

    // Use admin client to bypass RLS for guest profiles (only accessible to hosts via this action)
    const supabaseAdmin = await createSupabaseAdminClient();

    // 1. Fetch Basic User Info
    const { data: guest, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', guestId)
      .maybeSingle(); // Changed from .single() for better error handling

    if (userError) throw userError;
    if (!guest) throw new Error('Guest not found');

    // 2. Fetch Personal Info
    const { data: personalInfo } = await supabaseAdmin
      .from('user_personal_info')
      .select('*')
      .eq('user_id', guestId)
      .maybeSingle();

    // 3. Fetch Verification Status
    // Corrected table name from 'user_verification_status' to 'user_verifications'
    const { data: verificationData } = await supabaseAdmin
      .from('user_verifications')
      .select('*')
      .eq('user_id', guestId)
      .maybeSingle();

    // Map verification status fields to match UserVerificationStatus interface
    const verifications = verificationData ? {
      user_id: verificationData.user_id,
      isEmailVerified: verificationData.emailVerified || false,
      isPhoneVerified: verificationData.phoneVerified || false,
      isIdVerified: verificationData.idVerified || false,
      isPaymentMethodVerified: false // Default since not in schema
    } : null;

    // 4. Fetch Booking Count
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', guestId);

    return {
      success: true,
      data: {
        guest,
        personalInfo,
        verifications,
        bookingCount: bookingCount || 0
      }
    };
  } catch (error: any) {
    console.error('getGuestProfileForHost error:', error);
    return { success: false, error: error.message || 'Failed to fetch guest details' };
  }
}
