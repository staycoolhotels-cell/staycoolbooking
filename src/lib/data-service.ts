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
    console.log('Fetching active properties from DB (Cache Miss)...');
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
    revalidate: 3600, // Revalidate every hour by default
    tags: [CACHE_TAGS.properties],
  }
);

// 2. Fetch properties for a specific host (Cached across requests)
export const getHostProperties = cache(async (hostId: string) => {
  return unstable_cache(
    async () => {
      console.log(`Fetching properties for host ${hostId} from DB (Cache Miss)...`);
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', hostId);

      if (error) throw error;
      return data as Property[];
    },
    [`host-properties-${hostId}`],
    {
      revalidate: 600, // 10 minutes
      tags: [CACHE_TAGS.host_properties(hostId), CACHE_TAGS.properties],
    }
  )();
});

// 3. Simple Request-level memoized User fetch
export const getCachedUser = cache(async (userId: string) => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
});

// 4. Fetch bookings for a host (Memoized & Cached)
export const getHostBookings = cache(async (hostId: string) => {
  return unstable_cache(
    async () => {
      console.log(`Fetching bookings for host ${hostId} from DB (Cache Miss)...`);
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('*, properties!inner(*), guest:users!guest_id(name, avatar_url)')
        .eq('properties.host_id', hostId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    [`host-bookings-${hostId}`],
    {
      revalidate: 300, // 5 minutes
      tags: [CACHE_TAGS.bookings],
    }
  )();
});
