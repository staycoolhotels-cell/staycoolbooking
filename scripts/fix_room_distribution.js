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

// For ghftyd property: room_types = ["Double Room","Twin Room","Deluxe Room","Suite","Single Room"], total_rooms = 7
// We'll infer counts: 1 Single, 1 Twin, 1 Deluxe, 1 Suite, 3 Double Room = 7
const PROPERTY_ID = 'f8592b5c-d885-45e4-88a7-80f441f83589';

// Assign room type counts (must add up to 7)
const ROOM_TYPE_COUNTS = {
  'Single Room': 1,
  'Double Room': 3,
  'Twin Room': 1,
  'Deluxe Room': 1,
  'Suite': 1,
};

async function run() {
  console.log('Redistributing rooms for ghftyd...');

  // 1. Update room_type_counts in properties table
  const { error: propErr } = await supabase
    .from('properties')
    .update({ room_type_counts: ROOM_TYPE_COUNTS })
    .eq('id', PROPERTY_ID);

  if (propErr) {
    console.error('Failed to update room_type_counts:', propErr);
    return;
  }
  console.log('✓ Updated room_type_counts in properties table');

  // 2. Delete existing rooms
  const { error: delErr } = await supabase.from('rooms').delete().eq('property_id', PROPERTY_ID);
  if (delErr) { console.error('Failed to delete rooms:', delErr); return; }
  console.log('✓ Deleted existing rooms');

  // 3. Recreate rooms distributed by type
  const roomsToInsert = [];
  for (const [roomType, count] of Object.entries(ROOM_TYPE_COUNTS)) {
    for (let i = 0; i < count; i++) {
      roomsToInsert.push({
        property_id: PROPERTY_ID,
        name: `${roomType} ${i + 1}`,
        status: 'available',
        room_type: roomType,
        room_amenities: [],
      });
    }
  }

  const { error: insErr } = await supabase.from('rooms').insert(roomsToInsert);
  if (insErr) { console.error('Failed to insert rooms:', insErr); return; }
  console.log(`✓ Created ${roomsToInsert.length} rooms with distributed types:`);

  // 4. Verify
  const { data: rooms } = await supabase.from('rooms').select('name, room_type').eq('property_id', PROPERTY_ID);
  const counts = {};
  (rooms || []).forEach(r => { counts[r.room_type] = (counts[r.room_type] || 0) + 1; });
  console.log('Final room type counts:', JSON.stringify(counts, null, 2));
}

run();
