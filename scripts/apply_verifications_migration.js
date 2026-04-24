require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    try {
        console.log('🔄 Applying verifications RLS policies...\n');

        // Drop existing policies if they exist
        console.log('1. Dropping existing policies (if any)...');
        await supabase.rpc('exec_sql', {
            sql: 'DROP POLICY IF EXISTS "Users can insert own verifications" ON public.verifications;'
        });
        await supabase.rpc('exec_sql', {
            sql: 'DROP POLICY IF EXISTS "Admins can update verifications" ON public.verifications;'
        });

        // Create INSERT policy
        console.log('2. Creating INSERT policy for users...');
        const insertPolicy = `
      CREATE POLICY "Users can insert own verifications" 
      ON public.verifications 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
    `;

        const { error: insertError } = await supabase.rpc('exec_sql', { sql: insertPolicy });
        if (insertError) {
            console.error('❌ Error creating INSERT policy:', insertError);
            throw insertError;
        }
        console.log('✅ INSERT policy created successfully');

        // Create UPDATE policy
        console.log('3. Creating UPDATE policy for admins...');
        const updatePolicy = `
      CREATE POLICY "Admins can update verifications" 
      ON public.verifications 
      FOR UPDATE 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE users.id = auth.uid() 
          AND users.role = 'admin'
        )
      );
    `;

        const { error: updateError } = await supabase.rpc('exec_sql', { sql: updatePolicy });
        if (updateError) {
            console.error('❌ Error creating UPDATE policy:', updateError);
            throw updateError;
        }
        console.log('✅ UPDATE policy created successfully');

        console.log('\n✅ All policies applied successfully!');
        console.log('\n📋 Summary:');
        console.log('  - Users can now insert their own verification records');
        console.log('  - Admins can update verification statuses');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}


console.log('⚠️  Note: This script requires manual execution via Supabase SQL Editor');
console.log('Please copy the SQL from the migration file and run it in the Supabase dashboard.\n');
console.log('Migration file: supabase/migrations/20260205000004_fix_verifications_rls.sql\n');

applyMigration();
