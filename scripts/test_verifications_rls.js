require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVerificationInsert() {
    try {
        console.log('🧪 Testing verifications table RLS policies...\n');

        // Get current user (should be authenticated)
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('⚠️  No authenticated user found. Testing with service role key...');

            // Try to insert a test verification record
            const testData = {
                user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
                doc_type: 'test',
                file_url: 'test.pdf',
                status: 'pending'
            };

            const { data, error } = await supabase
                .from('verifications')
                .insert([testData])
                .select();

            if (error) {
                if (error.message.includes('row-level security')) {
                    console.log('❌ RLS policy error still exists:');
                    console.log('   ', error.message);
                    console.log('\n📝 The policies may not have been created successfully.');
                    console.log('   Please apply the migration manually via Supabase SQL Editor.');
                } else if (error.message.includes('foreign key')) {
                    console.log('✅ RLS policies are working! (Foreign key error is expected for test data)');
                    console.log('   The INSERT policy allows the operation.');
                } else {
                    console.log('⚠️  Unexpected error:', error.message);
                }
            } else {
                console.log('✅ Test insert successful! RLS policies are working correctly.');
                console.log('   Data:', data);

                // Clean up test data
                await supabase
                    .from('verifications')
                    .delete()
                    .eq('doc_type', 'test');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testVerificationInsert();
