import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createServiceClient } from './supabase-server';
import { Property } from './types';

/**
 * CACHE KEY CONSTANTS
 */
export const CACHE_TAGS = {
  properties: 'properties',
  bookings: 'bookings',
  users: 'users',
  host_properties: (hostId: string) => `host-properties-${hostId}`,
};

/**
 * SERVER-SIDE DATA SERVICE
 * Wraps Supabase calls with Next.js caching layers
 */

// 1. Fetch all active properties (Cached across requests)
export const getActiveProperties = unstable_cache(
  async () => {
    console.info('Fetching active properties from DB (Cache Miss)...');
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    return data as Property[];
  },
  ['active-properties'],
  {
    revalidate: 60, // Revalidate every minute by default
    tags: [CACHE_TAGS.properties],
  }
);

// 2. Fetch properties for a specific host (No cross-request cache, request-level memoization only)
export const getHostProperties = cache(async (hostId: string) => {
  console.info(`Fetching properties for host ${hostId} from DB...`);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('host_id', hostId);

  if (error) throw error;
  return data as Property[];
});

// 3. Simple Request-level memoized User fetch
export const getCachedUser = cache(async (userId: string) => {
  const supabase = createServiceClient();
  
  // Fetch user basic info
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !userData) return null;

  // Fetch personal info separately to avoid relationship cache issues
  const { data: personalData, error: personalError } = await supabase
    .from('user_personal_info')
    .select('gender, bio')
    .eq('user_id', userId)
    .maybeSingle();
  
  return {
    ...userData,
    gender: personalData?.gender || '',
    bio: personalData?.bio || '',
  };
});

// 4. Fetch Support Admin (Bypasses RLS)
export const getSupportAdmin = cache(async () => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (error) return null;
  return data;
});

// 5. Fetch bookings for a host (No cross-request cache, request-level memoization only)
export const getHostBookings = cache(async (hostId: string) => {
  console.info(`Fetching bookings for host ${hostId} from DB...`);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, properties!inner(*), guest:users!guest_id(name, avatar_url), booking_rooms(rooms(room_type))')
    .eq('properties.host_id', hostId)
    .not('status', 'in', '("pending_payment","payment_failed")')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
});
