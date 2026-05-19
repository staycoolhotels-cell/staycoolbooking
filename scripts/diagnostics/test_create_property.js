// Test script to verify create_property function
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlislsrlwovcxsuqdlvy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaXNsc3Jsd292Y3hzdXFkbHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMjY3NTMsImV4cCI6MjA4MjkwMjc1M30.H4049rHx_Ur1b_xxl9swVrdBN0G5aEQVvRNPzdqus4w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateProperty() {
    console.log('Testing create_property function...\n');

    // First, check if the function exists
    const { data: functions, error: funcError } = await supabase
        .rpc('create_property', {
            p_name: 'Test Property',
            p_title: 'Test Property',
            p_description: 'Test Description',
            p_price_per_night: 100,
            p_weekend_price_per_night: 150,
            p_location: 'Test Location',
            p_tier: 'standard',
            p_amenities: [],
            p_license_url: 'https://example.com/license.pdf',
            p_tax_bill_url: 'https://example.com/tax.pdf',
            p_current_bill_url: 'https://example.com/bill.pdf',
            p_image_url: 'https://example.com/image.jpg',
        });

    if (funcError) {
        console.error('Error calling create_property:');
        console.error('Message:', funcError.message);
        console.error('Details:', funcError.details);
        console.error('Hint:', funcError.hint);
        console.error('Code:', funcError.code);
        console.error('Full error:', JSON.stringify(funcError, null, 2));
    } else {
        console.log('Success! Property created with ID:', functions);
    }
}

testCreateProperty();
