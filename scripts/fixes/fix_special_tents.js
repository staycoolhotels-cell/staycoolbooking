const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const propertyId = '108b3253-df2b-4520-80ae-a33512778eb7';
  
  console.log('--- FIXING SPECIAL TENTS ---');
  
  // 1. Update room_type_counts of properties table
  const newCounts = { "Standard Tent": 1, "Luxury Tent": 2 };
  const { error: updatePropError } = await supabase
    .from('properties')
    .update({ room_type_counts: newCounts })
    .eq('id', propertyId);
    
  if (updatePropError) {
    console.error('Error updating property room_type_counts:', updatePropError);
    return;
  }
  console.log('Successfully updated properties table room_type_counts.');

  // 2. Fetch the room type amenities
  const { data: propData, error: fetchPropError } = await supabase
    .from('properties')
    .select('room_type_amenities')
    .eq('id', propertyId)
    .single();
    
  if (fetchPropError) {
    console.error('Error fetching property room_type_amenities:', fetchPropError);
    return;
  }
  
  const roomTypeAmenities = propData.room_type_amenities || {};
  
  // 3. Delete all rooms for this property
  const { error: deleteRoomsError } = await supabase
    .from('rooms')
    .delete()
    .eq('property_id', propertyId);
    
  if (deleteRoomsError) {
    console.error('Error deleting old rooms:', deleteRoomsError);
    return;
  }
  console.log('Successfully deleted old rooms.');

  // 4. Insert standard tent and luxury tents
  const roomsToInsert = [
    {
      property_id: propertyId,
      name: 'Standard Tent 1',
      status: 'available',
      room_type: 'Standard Tent',
      room_amenities: roomTypeAmenities['Standard Tent'] || []
    },
    {
      property_id: propertyId,
      name: 'Luxury Tent 1',
      status: 'available',
      room_type: 'Luxury Tent',
      room_amenities: roomTypeAmenities['Luxury Tent'] || []
    },
    {
      property_id: propertyId,
      name: 'Luxury Tent 2',
      status: 'available',
      room_type: 'Luxury Tent',
      room_amenities: roomTypeAmenities['Luxury Tent'] || []
    }
  ];
  
  const { error: insertRoomsError } = await supabase
    .from('rooms')
    .insert(roomsToInsert);
    
  if (insertRoomsError) {
    console.error('Error inserting new rooms:', insertRoomsError);
    return;
  }
  
  console.log('Successfully created standard and luxury tent sub-units!');
  console.log('--- DONE ---');
}

run();
