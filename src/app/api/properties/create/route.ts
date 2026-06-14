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
    const { hostId, propertyPayload } = await request.json();

    if (!hostId || !propertyPayload || !propertyPayload.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payloadWithHost = {
      ...propertyPayload,
      name: propertyPayload.name || propertyPayload.title || '',
      title: propertyPayload.title || propertyPayload.name || '',
      host_id: hostId,
    };

    // Insert property
    const { data: property, error: propError } = await supabaseAdmin
      .from('properties')
      .insert(payloadWithHost)
      .select()
      .single();

    if (propError || !property) {
      console.error('API: Error creating property:', propError);
      return NextResponse.json({ error: propError?.message || 'Failed to create property' }, { status: 500 });
    }

    // Automatically create sub-units (rooms) based on total_rooms
    // Skip for single-unit property types where sub-unit management is not applicable
    const singleUnitTypes = ['Home Stay', 'Apartment', 'Villa', 'Dormitory'];
    const isSingleUnit = singleUnitTypes.includes(property.tier || '');
    const isTent = property.tier === 'Tent';
    const totalRooms = property.total_rooms || 1;
    const unitLabel = isTent ? 'Tent' : 'Room';

    if (!isSingleUnit && totalRooms > 0) {
      const roomTypeCounts: Record<string, number> = property.room_type_counts || {};
      const roomTypes: string[] = property.room_types || [];

      const roomsToInsert: { property_id: string; name: string; status: string; room_type: string | null; room_amenities: any }[] = [];

      const hasDistributedCounts = Object.keys(roomTypeCounts).length > 0 &&
        Object.values(roomTypeCounts).some((v: number) => v > 0);

      if (hasDistributedCounts) {
        // Distribute rooms per type based on room_type_counts
        let roomIndex = 1;
        for (const [roomType, count] of Object.entries(roomTypeCounts)) {
          const amenities = (property.room_type_amenities && property.room_type_amenities[roomType]) || [];
          for (let i = 0; i < count; i++) {
            roomsToInsert.push({
              property_id: property.id,
              name: `${roomType} ${i + 1}`,
              status: 'available',
              room_type: roomType,
              room_amenities: amenities,
            });
            roomIndex++;
          }
        }
      } else {
        // Fallback: all rooms get the first room type
        const defaultRoomType = roomTypes.length > 0 ? roomTypes[0] : null;
        const defaultRoomAmenities = (defaultRoomType && property.room_type_amenities && property.room_type_amenities[defaultRoomType])
          ? property.room_type_amenities[defaultRoomType]
          : [];

        for (let i = 0; i < totalRooms; i++) {
          roomsToInsert.push({
            property_id: property.id,
            name: `${unitLabel} ${i + 1}`,
            status: 'available',
            room_type: defaultRoomType,
            room_amenities: defaultRoomAmenities,
          });
        }
      }

      const { error: roomsError } = await supabaseAdmin
        .from('rooms')
        .insert(roomsToInsert);

      if (roomsError) {
        console.error('API: Error creating rooms:', roomsError);
        // We still consider property creation successful
      }
    }

    // Invalidate caches to ensure lists reflect the update
    revalidateTag(CACHE_TAGS.properties);
    revalidatePath('/homepage', 'page');
    revalidatePath('/', 'layout');

    return NextResponse.json({ data: property });
  } catch (err) {
    console.error('API: Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
