import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS } from '@/lib/data-service';

// Server-side admin client — bypasses PostgREST schema cache entirely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { propertyId, hostId, updatePayload } = await request.json();

    if (!propertyId || !hostId || !updatePayload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('properties')
      .update(updatePayload)
      .eq('id', propertyId)
      .eq('host_id', hostId)
      .select()
      .single();

    if (error) {
      console.error('API: Error updating property:', error);
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }

    // Sync sub-units (rooms) when total_rooms changes during edit
    // Skip for single-unit property types where sub-unit management is not applicable
    const singleUnitTypes = ['Home Stay', 'Apartment', 'Villa', 'Dormitory'];
    const propertyTier = updatePayload.tier || data?.tier || '';
    const isSingleUnit = singleUnitTypes.includes(propertyTier);
    const isTent = propertyTier === 'Tent';
    const unitLabel = isTent ? 'Tent' : 'Room';

    if (!isSingleUnit && updatePayload.total_rooms && updatePayload.total_rooms > 0) {
      const newTotalRooms = updatePayload.total_rooms;

      // Get existing rooms count for this property
      const { data: existingRooms } = await supabaseAdmin
        .from('rooms')
        .select('id, name')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });

      const existingCount = existingRooms?.length || 0;

      // If new total is greater than existing, add the missing rooms
      if (newTotalRooms > existingCount) {
        const roomsToAdd = Array.from({ length: newTotalRooms - existingCount }).map((_, i) => ({
          property_id: propertyId,
          name: `${unitLabel} ${existingCount + i + 1}`,
          status: 'available',
        }));

        const { error: roomsError } = await supabaseAdmin
          .from('rooms')
          .insert(roomsToAdd);

        if (roomsError) {
          console.error('API: Error syncing rooms on update:', roomsError);
          // Property update was successful, rooms sync failure is non-critical
        }
      }
    }

    // Invalidate caches to ensure home page and other lists reflect the update
    revalidateTag(CACHE_TAGS.properties);
    revalidatePath('/homepage', 'page');
    revalidatePath('/', 'layout');
    revalidatePath('/property-listing/[id]', 'page');

    return NextResponse.json({ data });
  } catch (err) {
    console.error('API: Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
