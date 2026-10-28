import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// Server-side admin client — bypasses RLS for storage uploads
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string | null;
    const folderPath = formData.get('folderPath') as string | null;

    if (!file || !bucket || !folderPath) {
      return NextResponse.json({ error: 'Missing file, bucket, or folderPath' }, { status: 400 });
    }

    const rawExt = file.name.split('.').pop() || 'jpg';
    const cleanExt = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    const randomStr = Math.random().toString(36).substring(2, 8);

    // Sanitize folderPath segments to ensure safe Supabase Storage key characters (letters, numbers, hyphens, underscores)
    const cleanFolderPath = folderPath
      .split('/')
      .map((part) =>
        part
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      )
      .filter(Boolean)
      .join('/');

    const fileName = `${cleanFolderPath || 'uploads'}/${Date.now()}_${randomStr}.${cleanExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error('API: Unexpected upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
