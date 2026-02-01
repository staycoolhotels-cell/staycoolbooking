'use server';

import { supabase } from './supabaseClient';

export const logActivity = async (type: string, description: string, userId?: string) => {
  const { data, error } = await supabase
    .from('activities')
    .insert([{ type, description, user_id: userId }])
    .select();

  if (error) {
    console.error('Error logging activity:', error);
  }

  return data;
};
