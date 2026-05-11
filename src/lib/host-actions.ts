'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

export async function updateHostProfile(
  userId: string, 
  userData: { name?: string; email?: string; avatar_url?: string; phone?: string },
  personalInfo: { bio?: string; address?: string; gender?: string }
) {
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
    // Note: The table schema might have 'bio' and 'address' or 'location'.
    // Let's check user_personal_info in guest-actions: it uses 'bio', 'location'.
    // In Host dashboard it says 'address'. I'll map address to location if needed.
    
    const { error: infoError } = await supabaseAdmin
      .from('user_personal_info')
      .upsert({
        user_id: userId,
        bio: personalInfo.bio || '',
        location: personalInfo.address || null, // Mapping address to location
        gender: personalInfo.gender || null,
      }, { onConflict: 'user_id' });

    if (infoError) throw infoError;

    return { success: true };
  } catch (error: any) {
    console.error('updateHostProfile error:', error);
    return { success: false, error: error.message };
  }
}
