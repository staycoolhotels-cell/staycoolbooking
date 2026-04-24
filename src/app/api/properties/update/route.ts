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
