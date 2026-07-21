const { createClient } = require('@supabase/supabase-js');
const url = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(url, serviceKey);

async function check() {
    const { data, error } = await supabase
        .from('payment_transfers')
        .select('id, referrer_id, referrer_amount')
        .limit(1);
    
    if (error) {
        console.error('Error selecting:', error.message);
    } else {
        console.log('Columns exist! Data:', data);
    }
}
check();
