const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking rooms table...");
    const { data: roomsData, error: roomsError } = await supabase.from('rooms').select('id').limit(1);
    if (roomsError) console.error("Error querying rooms:", roomsError.message);
    else console.log("rooms table EXISTS");

    console.log("Checking properties.total_rooms...");
    const { data: propsData, error: propsError } = await supabase.from('properties').select('total_rooms').limit(1);
    if (propsError) console.error("Error querying properties:", propsError.message);
    else console.log("properties.total_rooms EXISTS");

    console.log("Checking bookings.booking_type...");
    const { data: bookingsData, error: bookingsError } = await supabase.from('bookings').select('booking_type').limit(1);
    if (bookingsError) console.error("Error querying bookings:", bookingsError.message);
    else console.log("bookings.booking_type EXISTS");
}

checkSchema();
