const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?/);
  if (match) {
    let value = (match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data: props } = await supabase
    .from('properties')
    .select('id, title, room_types, room_type_counts, total_rooms');

  for (const p of props || []) {
    console.log(`\n=== ${p.title} ===`);
    console.log('  room_types:', JSON.stringify(p.room_types));
    console.log('  room_type_counts:', JSON.stringify(p.room_type_counts));
    console.log('  total_rooms:', p.total_rooms);

    const { data: rooms } = await supabase
      .from('rooms')
      .select('name, room_type')
      .eq('property_id', p.id);

    const counts = {};
    (rooms || []).forEach(r => {
      const t = (r.room_type || 'Unknown').trim();
      counts[t] = (counts[t] || 0) + 1;
    });
    console.log('  rooms table counts:', JSON.stringify(counts));
  }
}
run();
