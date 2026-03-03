
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixOrphanedProperties() {
    console.log('Starting Orphaned Property Fix...');

    // 1. Find the Admin User
    const { data: adminUsers, error: userError } = await supabase
        .from('users')
        .select('id, email, role, stripe_account_id, stripe_onboarding_completed')
        .eq('email', adminEmail);

    if (userError || !adminUsers || adminUsers.length === 0) {
        console.error('Admin user not found:', userError);
        // Fallback: Find ANY host
        console.log('Admin not found, looking for any host...');
        const { data: hosts } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'host')
            .limit(1);

        if (hosts && hosts.length > 0) {
            console.log('Found fallback host:', hosts[0].id);
            await reassignProperties(hosts[0].id);
        } else {
            console.error('No suitable host found to reassign properties to.');
        }
        return;
    }

    const adminUser = adminUsers[0];
    console.log('Found Admin User:', adminUser.id);

    // 2. Ensure Admin is a Host and Verified (if not, update it)
    // We want to ensure the target user CAN receive payments
    if (adminUser.role !== 'host') {
        console.log('Promoting Admin to Host...');
        await supabase.from('users').update({ role: 'host' }).eq('id', adminUser.id);
    }

    // 3. Reassign the specific orphaned property (or all)
    await reassignProperties(adminUser.id);
}

async function reassignProperties(newHostId: string) {
    // The specific bad ID from the user error
    const badHostId = '38ac5294-564b-45ba-ab18-035f59c30e19';

    // Update properties with the bad host ID
    const { data, error } = await supabase
        .from('properties')
        .update({ host_id: newHostId })
        .eq('host_id', badHostId)
        .select();

    if (error) {
        console.error('Error updating properties:', error);
    } else {
        console.log(`Successfully reassigned ${data.length} orphaned properties to Host ${newHostId}`);
    }
}

fixOrphanedProperties();
