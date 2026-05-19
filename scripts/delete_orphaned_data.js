
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteData() {
    console.log('Starting Cleanup...');
    const badId = '38ac5294-564b-45ba-ab18-035f59c30e19';

    try {
        // 1. Find properties
        const { data: properties } = await supabase.from('properties').select('id').eq('host_id', badId);

        if (!properties || properties.length === 0) {
            console.log('No corrupted properties found.');
            return;
        }

        const propertyIds = properties.map(p => p.id);
        console.log('Found corrupted properties:', propertyIds);

        // 2. Find bookings for these properties
        const { data: bookings } = await supabase.from('bookings').select('id').in('property_id', propertyIds);
        const bookingIds = bookings ? bookings.map(b => b.id) : [];
        console.log('Found affected bookings:', bookingIds);

        // 3. Delete payments
        if (bookingIds.length > 0) {
            const { error: payError } = await supabase.from('payments').delete().in('booking_id', bookingIds);
            if (payError) console.error('Payment delete error:', payError);
            else console.log('Deleted payments.');

            // Delete bookings
            const { error: bookError } = await supabase.from('bookings').delete().in('id', bookingIds);
            if (bookError) console.error('Booking delete error:', bookError);
            else console.log('Deleted bookings.');
        }

        // 4. Delete properties
        const { error: propError } = await supabase.from('properties').delete().in('id', propertyIds);
        if (propError) console.error('Property delete error:', propError);
        else console.log('Deleted properties.');

        console.log('Cleanup Complete.');

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

deleteData();
