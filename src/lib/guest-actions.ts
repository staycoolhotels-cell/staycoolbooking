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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error(`[getGuestProfileForHost] FATAL:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function updateUserProfile(userId: string, userData: any, personalInfo: any) {
  try {
    const supabaseAdmin = await createSupabaseAdminClient();

    // 1. Update public.users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ 
        name: userData.name, 
        avatar_url: userData.avatar_url,
        phone: userData.phone 
      })
      .eq('id', userId);

    if (userError) throw userError;

    // 2. Update user_personal_info
    if (personalInfo) {
      const { error: infoError } = await supabaseAdmin
        .from('user_personal_info')
        .upsert({
          user_id: userId,
          bio: personalInfo.bio || '',
          languages: personalInfo.languages || [],
          location: personalInfo.location || null,
          occupation: personalInfo.occupation || null,
          date_of_birth: personalInfo.date_of_birth || personalInfo.dateOfBirth || null,
          nationality: personalInfo.nationality || null,
          gender: personalInfo.gender || null,
        }, { onConflict: 'user_id' });

      if (infoError) throw infoError;
    }

    // 3. Recalculate Completion Percentage
    // We can't import from admin-actions here to avoid circular deps
    // so we'll do a quick calculation here.
    
    const { data: verif } = await supabaseAdmin
      .from('verifications')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle();

    let completion = 0;
    if (userData.name) completion += 10;
    if (userData.email || userData.email) completion += 10; // email usually from auth
    if (userData.avatar_url) completion += 10;
    if (userData.phone || personalInfo.phone) completion += 10;
    
    if (personalInfo.bio) completion += 10;
    if (personalInfo.location) completion += 10;
    if (personalInfo.date_of_birth || personalInfo.dateOfBirth) completion += 10;
    if (personalInfo.gender) completion += 10;
    
    if (verif) completion += 20;

    await supabaseAdmin
      .from('users')
      .update({ completion_percentage: completion })
      .eq('id', userId);

    return { success: true, completion };
  } catch (error: any) {
    console.error('updateUserProfile error:', error);
    return { success: false, error: error.message };
  }
}
