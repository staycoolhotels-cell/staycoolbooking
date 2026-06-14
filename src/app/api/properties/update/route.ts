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

    const finalUpdatePayload = { ...updatePayload };
    if (updatePayload.title && !updatePayload.name) {
      finalUpdatePayload.name = updatePayload.title;
    } else if (updatePayload.name && !updatePayload.title) {
      finalUpdatePayload.title = updatePayload.name;
    }

    const { data, error } = await supabaseAdmin
      .from('properties')
      .update(finalUpdatePayload)
      .eq('id', propertyId)
      .eq('host_id', hostId)
      .select()
      .single();

    if (error) {
      console.error('API: Error updating property:', error);
      return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
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
      const roomTypeCounts: Record<string, number> = updatePayload.room_type_counts || data?.room_type_counts || {};
      const roomTypes: string[] = updatePayload.room_types || data?.room_types || [];
      const roomTypeAmenities = updatePayload.room_type_amenities || data?.room_type_amenities || {};

      const hasDistributedCounts = Object.keys(roomTypeCounts).length > 0 &&
        Object.values(roomTypeCounts).some((v: number) => v > 0);

      if (hasDistributedCounts) {
        // Fully redistribute all rooms by type — delete and recreate
        await supabaseAdmin.from('rooms').delete().eq('property_id', propertyId);

        const roomsToInsert: { property_id: string; name: string; status: string; room_type: string; room_amenities: any }[] = [];
        for (const [roomType, count] of Object.entries(roomTypeCounts)) {
          const amenities = roomTypeAmenities[roomType] || [];
          for (let i = 0; i < count; i++) {
            roomsToInsert.push({
              property_id: propertyId,
              name: `${roomType} ${i + 1}`,
              status: 'available',
              room_type: roomType,
              room_amenities: amenities,
            });
          }
        }

        if (roomsToInsert.length > 0) {
          const { error: roomsError } = await supabaseAdmin.from('rooms').insert(roomsToInsert);
          if (roomsError) console.error('API: Error redistributing rooms on update:', roomsError);
        }
      } else {
        // Fallback: just add missing rooms with the first room type
        const { data: existingRooms } = await supabaseAdmin
          .from('rooms')
          .select('id, name')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: true });

        const existingCount = existingRooms?.length || 0;

        if (newTotalRooms > existingCount) {
          const defaultRoomType = roomTypes.length > 0 ? roomTypes[0] : null;
          const defaultRoomAmenities = defaultRoomType && roomTypeAmenities[defaultRoomType]
            ? roomTypeAmenities[defaultRoomType]
            : [];

          const roomsToAdd = Array.from({ length: newTotalRooms - existingCount }).map((_, i) => ({
            property_id: propertyId,
            name: `${unitLabel} ${existingCount + i + 1}`,
            status: 'available',
            room_type: defaultRoomType,
            room_amenities: defaultRoomAmenities,
          }));

          const { error: roomsError } = await supabaseAdmin.from('rooms').insert(roomsToAdd);
          if (roomsError) console.error('API: Error syncing rooms on update:', roomsError);
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
