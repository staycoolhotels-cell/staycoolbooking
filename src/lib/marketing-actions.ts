'use server';

import { createClient } from '@supabase/supabase-js';
import { Campaign } from './types';

const createAdminSupabaseClient = async () => {
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

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from('campaigns').insert([campaign]).select().single();
  if (error) {
    console.error('Error creating campaign:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
  return { success: true, data };
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from('campaigns').update(updates).eq('id', id).select().single();
  if (error) {
    console.error('Error updating campaign:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
  return { success: true, data };
}

export async function deleteCampaign(id: string) {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) {
    console.error('Error deleting campaign:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
  return { success: true };
}
