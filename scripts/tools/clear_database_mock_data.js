const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// Emails of system accounts we want to preserve
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@staycool.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DefaultPassword123!';
const HOST_EMAIL = process.env.HOST_EMAIL || 'buddi@gmail.com';
const HOST_PASSWORD = process.env.HOST_PASSWORD || 'Praveen@123';

async function clearDatabase() {
    console.log('==================================================');
    console.log('   STAYCOOL BOOKING DATABASE CLEARING UTILITY    ');
    console.log('==================================================');
    console.log(`Preserving Admin: ${ADMIN_EMAIL}`);
    console.log(`Preserving Host: ${HOST_EMAIL}`);
    console.log('--------------------------------------------------');

    try {
        // 1. Fetch all auth users
        console.log('Step 1: Listing users from auth.users...');
        const { data: { users: authUsers }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listErr) {
            throw new Error(`Failed to list auth users: ${listErr.message}`);
        }
        console.log(`Found ${authUsers.length} total users in authentication list.`);

        // Separate preserved users
        const usersToDelete = authUsers.filter(
            u => u.email !== ADMIN_EMAIL && u.email !== HOST_EMAIL
        );
        const preservedAuthUsers = authUsers.filter(
            u => u.email === ADMIN_EMAIL || u.email === HOST_EMAIL
        );

        console.log(`- Preserved users: ${preservedAuthUsers.map(u => u.email).join(', ') || 'None'}`);
        console.log(`- Users marked for deletion: ${usersToDelete.length}`);

        // 2. Delete all transaction and relational data from public tables
        console.log('\nStep 2: Clearing all transactional and relational data in public schema...');
        
        // Define tables in safe deletion order (child tables first)
        const tables = [
            'booking_rooms',
            'bookings',
            'reviews',
            'wishlist',
            'transactions',
            'verifications',
            'user_achievements',
            'user_personal_info',
            'preferences',
            'disputes',
            'activities',
            'maintenance_alerts',
            'cleaning_checklists',
            'rooms',
            'properties'
        ];

        for (const table of tables) {
            console.log(`Clearing table "public.${table}"...`);
            // To delete all rows, we can match on 'id' not being null/empty, or use a general filters
            // Check if table has 'id' or other primary keys
            let deleteQuery = supabase.from(table).delete();
            
            if (table === 'user_personal_info' || table === 'preferences') {
                // Primary key is user_id
                deleteQuery = deleteQuery.neq('user_id', '00000000-0000-0000-0000-000000000000');
            } else {
                deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
            }

            const { error: delErr } = await deleteQuery;
            if (delErr) {
                // If it fails because of missing columns or table, we log and continue
                console.warn(`  Note: Table "${table}" could not be cleared or does not exist (${delErr.message})`);
            } else {
                console.log(`  SUCCESS: Cleared "${table}".`);
            }
        }

        // 3. Delete non-preserved users from public.users
        console.log('\nStep 3: Removing non-preserved users from public.users...');
        const preservedEmails = [ADMIN_EMAIL, HOST_EMAIL];
        const { error: userDelErr } = await supabase
            .from('users')
            .delete()
            .not('email', 'in', `(${preservedEmails.map(e => `"${e}"`).join(',')})`);
            
        if (userDelErr) {
            console.error(`  Error deleting from public.users: ${userDelErr.message}`);
        } else {
            console.log('  SUCCESS: Non-preserved users deleted from public.users.');
        }

        // 4. Delete non-preserved users from auth.users
        console.log('\nStep 4: Deleting non-preserved users from auth.users...');
        for (const user of usersToDelete) {
            console.log(`Deleting auth user: ${user.email} (${user.id})...`);
            const { error: authDelErr } = await supabase.auth.admin.deleteUser(user.id);
            if (authDelErr) {
                console.error(`  Failed to delete auth user ${user.email}: ${authDelErr.message}`);
            } else {
                console.log(`  SUCCESS: Deleted auth user ${user.email}`);
            }
        }

        // 5. Ensure the Admin user exists
        console.log('\nStep 5: Verifying and syncing Admin Account...');
        let adminAuthUser = authUsers.find(u => u.email === ADMIN_EMAIL);
        
        if (!adminAuthUser) {
            console.log(`Admin account ${ADMIN_EMAIL} not found. Creating it...`);
            const { data: { user: newAdmin }, error: createAdminErr } = await supabase.auth.admin.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                email_confirm: true,
                user_metadata: { name: 'StayCool Admin', role: 'admin' }
            });
            
            if (createAdminErr) {
                console.error(`  Failed to create Admin user: ${createAdminErr.message}`);
            } else {
                console.log(`  SUCCESS: Created Admin user with ID: ${newAdmin.id}`);
                adminAuthUser = newAdmin;
            }
        } else {
            console.log(`Admin account ${ADMIN_EMAIL} exists.`);
            // Update metadata to ensure role is correct
            await supabase.auth.admin.updateUserById(adminAuthUser.id, {
                password: ADMIN_PASSWORD,
                user_metadata: { name: 'StayCool Admin', role: 'admin' }
            });
        }

        if (adminAuthUser) {
            console.log('Syncing Admin profile to public.users...');
            const { error: adminSyncErr } = await supabase.from('users').upsert({
                id: adminAuthUser.id,
                email: ADMIN_EMAIL,
                name: 'StayCool Admin',
                role: 'admin',
                status: 'active',
                kyc_status: 'verified',
                total_bookings: 0
            });
            
            if (adminSyncErr) {
                console.error(`  Failed to sync Admin profile: ${adminSyncErr.message}`);
            } else {
                console.log('  SUCCESS: Admin profile synced.');
            }
        }

        // 6. Ensure the Host user exists
        console.log('\nStep 6: Verifying and syncing Host Account...');
        let hostAuthUser = authUsers.find(u => u.email === HOST_EMAIL);
        
        if (!hostAuthUser) {
            console.log(`Host account ${HOST_EMAIL} not found. Creating it...`);
            const { data: { user: newHost }, error: createHostErr } = await supabase.auth.admin.createUser({
                email: HOST_EMAIL,
                password: HOST_PASSWORD,
                email_confirm: true,
                user_metadata: { name: 'StayCool Host', role: 'host' }
            });
            
            if (createHostErr) {
                console.error(`  Failed to create Host user: ${createHostErr.message}`);
            } else {
                console.log(`  SUCCESS: Created Host user with ID: ${newHost.id}`);
                hostAuthUser = newHost;
            }
        } else {
            console.log(`Host account ${HOST_EMAIL} exists.`);
            // Update metadata to ensure role is correct
            await supabase.auth.admin.updateUserById(hostAuthUser.id, {
                password: HOST_PASSWORD,
                user_metadata: { name: 'StayCool Host', role: 'host' }
            });
        }

        if (hostAuthUser) {
            console.log('Syncing Host profile to public.users...');
            const { error: hostSyncErr } = await supabase.from('users').upsert({
                id: hostAuthUser.id,
                email: HOST_EMAIL,
                name: 'StayCool Host',
                role: 'host',
                status: 'approved',
                kyc_status: 'verified',
                total_bookings: 0
            });
            
            if (hostSyncErr) {
                console.error(`  Failed to sync Host profile: ${hostSyncErr.message}`);
            } else {
                console.log('  SUCCESS: Host profile synced.');
            }
        }

        console.log('\n==================================================');
        console.log('         DATABASE CLEARED SUCCESSFULLY!          ');
        console.log('   Your database is now fresh and ready for production!');
        console.log('==================================================');

    } catch (err) {
        console.error('\n❌ FATAL ERROR DURING DATABASE CLEARING:', err.message);
    }
}

clearDatabase();
