const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://dlislsrlwovcxsuqdlvy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q'
);

async function fixBookings() {
    console.log('Fetching pending bookings...');
    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('status', 'pending_payment')
        .select('id');

    if (error) {
        console.error('Error updating bookings:', error.message);
        process.exit(1);
    }

    console.log(`Successfully updated ${data ? data.length : 0} bookings from 'pending_payment' to 'confirmed'.`);
}

fixBookings();
