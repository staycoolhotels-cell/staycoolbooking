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
    .select('*, sender:users!sender_id(id, name, role, avatar_url), receiver:users!receiver_id(id, name, role, avatar_url), property:properties(id, name)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user messages:', error);
    return [];
  }
  return data;
}

/**
 * Fetches the count of unread messages categorized by whether the sender is an admin or guest/host.
 */
export async function getUnreadCounts(userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender:users!sender_id(role)')
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread counts:', error);
    return { guestUnreadCount: 0, adminUnreadCount: 0 };
  }

  let guestUnreadCount = 0;
  let adminUnreadCount = 0;

  data?.forEach((msg: any) => {
    if (msg.sender?.role === 'admin') {
      adminUnreadCount++;
    } else {
      guestUnreadCount++;
    }
  });

  return { guestUnreadCount, adminUnreadCount };
}

/**
 * Fetches an admin user to initiate support chats.
 */
export async function getAdminUser() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, avatar_url')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching admin user:', error);
  }

  if (data) {
    return data;
  }

  // Fallback: Search for user with admin email pattern if role was not set
  const { data: fallbackData } = await supabase
    .from('users')
    .select('id, name, role, avatar_url')
    .ilike('email', '%admin%')
    .limit(1)
    .maybeSingle();

  return fallbackData || null;
}

