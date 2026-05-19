
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyNjc1MywiZXhwIjoyMDgyOTAyNzUzfQ.UfXHBCd8FjoXMktEvJjFF37B1xEY2xA99oAGLN03E1Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .ilike('title', '%yjyjytjuy%');

    const { data: data2 } = await supabase
        .from('properties')
        .select('*')
        .ilike('name', '%yjyjytjuy%');
    console.log('Matches by title:', data);
    console.log('Matches by name:', data2);
}

check();
