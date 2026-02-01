import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching properties...');
  const { data, error } = await supabase.from('properties').select('id, host_id, name, status');

  if (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Error fetching properties', details: error.message }, { status: 500 });
  }

  console.log('Properties fetched successfully.');
  return NextResponse.json({ data });
}
