import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    try {
        console.log('Applying verifications RLS migration...');

        // Read the migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20260205000004_fix_verifications_rls.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolons and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            const { error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                console.error('Error executing statement:', error);
                throw error;
            }
        }

        console.log('✅ Migration applied successfully!');

        // Verify the policies were created
        const { data, error } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'verifications');

        if (error) {
            console.error('Error verifying policies:', error);
        } else {
            console.log('\nVerifications table policies:');
            console.log(data);
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();
