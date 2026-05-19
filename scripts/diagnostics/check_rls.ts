
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMjY3NTMsImV4cCI6MjA4MjkwMjc1M30.H4049rHx_Ur1b_xxl9swVrdBN0G5aEQVvRNPzdqus4w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLS() {
    console.log('Checking active properties as anonymous user...');

    const { data: activeProperties, error: activeError } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active');

    if (activeError) {
        console.error('Error fetching active properties:', activeError);
    } else {
        console.log(`Found ${activeProperties?.length || 0} active properties.`);
        if (activeProperties && activeProperties.length > 0) {
            console.log('Sample property:', JSON.stringify(activeProperties[0], null, 2));
        }
    }

    console.log('\nChecking ALL properties (no filter) as anonymous user...');
    const { data: allProperties, error: allError } = await supabase
        .from('properties')
        .select('*')
        .limit(5);

    if (allError) {
        console.error('Error fetching all properties:', allError);
    } else {
        console.log(`Found ${allProperties?.length || 0} visible properties (limit 5).`);
    }
}

checkRLS();
