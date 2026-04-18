'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const createSupabaseAdminClient = async () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
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
    // 0. Base Validation
    if (!guestId) {
      console.error('[getGuestProfileForHost] No guestId provided');
      throw new Error('No guest ID provided');
    }

    // Basic UUID validation to prevent malformed ID errors in Supabase Auth
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(guestId)) {
       console.error(`[getGuestProfileForHost] Invalid UUID format for guestId: "${guestId}"`);
       throw new Error(`Invalid guest ID format: ${guestId}`);
    }

    const supabaseUser = await createSupabaseServerClient();
    const { data: { user: hostUser }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !hostUser) {
      console.error('[getGuestProfileForHost] Unauthorized access or session expired:', authError);
      throw new Error('Unauthorized');
    }

    // Use admin client to bypass RLS for guest profiles (only accessible to hosts via this action)
    const supabaseAdmin = await createSupabaseAdminClient();

    console.log(`[getGuestProfileForHost] Fetching for guestId: "${guestId}" by host: ${hostUser.id}`);

    // 1. Fetch Basic User Info from public.users
    const { data: guest, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', guestId)
      .maybeSingle(); 

    if (userError) {
      console.error(`[getGuestProfileForHost] DB query error for ${guestId}:`, userError);
      throw userError;
    }
    
    let finalGuest = guest;

    // Self-healing: if guest not in public.users, try fetching from auth.users
    if (!guest) {
      console.log(`[getGuestProfileForHost] ⚠️  Guest profile NOT found in DB for "${guestId}", attempting self-heal from Auth...`);
      try {
        const { data: { user: authUser }, error: authFetchError } = await supabaseAdmin.auth.admin.getUserById(guestId);
        
        if (authFetchError) {
           console.error(`[getGuestProfileForHost] ❌ Auth fetch failed for "${guestId}":`, authFetchError.message);
        } else if (authUser) {
           console.log(`[getGuestProfileForHost] Found "${guestId}" in Auth. Syncing to DB...`);
           const userRole = authUser.user_metadata?.role || 'guest';
           const userName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Guest User';
           const userStatus = authUser.user_metadata?.status || (userRole === 'host' ? 'pending' : 'active');

           const { data: newProfile, error: createError } = await supabaseAdmin
             .from('users')
             .upsert({
               id: guestId,
               email: authUser.email,
               name: userName,
               role: userRole,
               status: userStatus,
               created_at: authUser.created_at || new Date().toISOString(),
             }, { onConflict: 'id' })
             .select('*')
             .maybeSingle();

           if (!createError && newProfile) {
             console.log(`[getGuestProfileForHost] ✅ Successfully self-healed guest profile for ${guestId}`);
             finalGuest = newProfile;
           } else {
             console.error(`[getGuestProfileForHost] ❌ Failed to create DB profile for ${guestId}:`, createError);
           }
        } else {
           console.error(`[getGuestProfileForHost] ❌ No user found in Auth either for "${guestId}"`);
        }
      } catch (e) {
        console.error('[getGuestProfileForHost] Self-heal routine crashed:', e);
      }
    }

    if (!finalGuest) {
      const dbUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const dbKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      console.error(`[getGuestProfileForHost] ❌ Final check FAILED for "${guestId}". DB_URL: ${dbUrl}, S_KEY: ${dbKey}`);
      throw new Error(`Guest not found in database or authentication records. (ID: ${guestId}, ENV: ${dbUrl ? 'OK' : 'MISSING'}:${dbKey ? 'OK' : 'MISSING'})`);
    }

    // 2. Fetch Personal Info
    const { data: personalInfo } = await supabaseAdmin
      .from('user_personal_info')
      .select('*')
      .eq('user_id', guestId)
      .maybeSingle();

    // 3. Fetch Verification Status
    const { data: verificationData } = await supabaseAdmin
      .from('user_verifications')
      .select('*')
      .eq('user_id', guestId)
      .maybeSingle();

    const verifications = verificationData ? {
      user_id: verificationData.user_id,
      isEmailVerified: verificationData.emailVerified || false,
      isPhoneVerified: verificationData.phoneVerified || false,
      isIdVerified: verificationData.idVerified || false,
      isPaymentMethodVerified: false 
    } : null;

    // 4. Fetch Booking Count
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', guestId);

    return {
      success: true,
      data: {
        guest: finalGuest,
        personalInfo,
        verifications,
        bookingCount: bookingCount || 0
      }
    };
  } catch (error: any) {
    console.error(`[getGuestProfileForHost] FATAL:`, error.message);
    return { success: false, error: error.message || 'Failed to fetch guest details' };
  }
}
