'use server';

import { createServiceClient } from './supabase-server';

/**
 * Fetches all messages for a specific user (as sender or receiver)
 * using the service role to bypass RLS join restrictions.
 */
export async function getUserMessages(userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!sender_id(id, name), receiver:users!receiver_id(id, name)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user messages:', error);
    return [];
  }
  return data;
}
