'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const createSupabaseAdminClient = async () => {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: (name: string, value: string, options) => {
                    cookieStore.set(name, value, options);
                },
                remove: (name: string, options) => {
                    cookieStore.delete(name);
                },
            },
        }
    );
};

/**
 * Ensures the Admin User exists in Supabase and matches the ENV credentials.
 * This allows "Self-Healing" if the DB is wiped or Password changes in ENV.
 */
async function ensureAdminUserExists() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables.');
    }

    const supabaseAdmin = await createSupabaseAdminClient();

    // Check if admin exists by email
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Failed to list users for admin check:', error);
        return { success: false, message: 'Failed to list users for admin check' };
    }

    const existingAdmin = users.find(u => u.email === adminEmail);
    let adminId: string;

    if (existingAdmin) {
        // Admin exists, update password to ensure it matches ENV
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingAdmin.id,
            { password: adminPassword, user_metadata: { role: 'admin', name: 'System Admin' } }
        );
        if (updateError) {
            console.error('Failed to update admin password:', updateError);
            return { success: false, message: 'Failed to update admin password' };
        }
        adminId = existingAdmin.id;
    } else {
        // Create new Admin
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'admin', name: 'System Admin' }
        });
        if (createError) {
            console.error('Failed to create admin user:', createError.message);
            return { success: false, message: 'Failed to create admin user.' };
        }
        if (!newUser) {
            console.error('Failed to create admin user, no user data returned.');
            return { success: false, message: 'Failed to create admin user, no user data returned' };
        }
        adminId = newUser.user.id;
    }

    // Ensure public.users table reflects admin role and status
    const { error: upsertPublicUserError } = await supabaseAdmin
        .from('users')
        .upsert(
            {
                id: adminId,
                email: adminEmail,
                name: 'System Admin',
                role: 'admin',
                status: 'active',
            },
            { onConflict: 'id' } // Upsert based on the 'id'
        );

    if (upsertPublicUserError) {
        console.error('Failed to upsert admin into public.users:', upsertPublicUserError);
        return { success: false, message: 'Failed to upsert admin into public.users' };
    }

    // Demote any OTHER admins in public.users to role 'guest'
    const { data: otherAdmins } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('role', 'admin')
        .neq('email', adminEmail);

    if (otherAdmins && otherAdmins.length > 0) {
        for (const other of otherAdmins) {
            console.log(`Demoting non-env admin user: ${other.email}`);
            await supabaseAdmin
                .from('users')
                .update({ role: 'guest' })
                .eq('id', other.id);

            await supabaseAdmin.auth.admin.updateUserById(other.id, {
                user_metadata: { role: 'guest' }
            });
        }
    }

    return { success: true, message: 'Admin user initialized successfully', adminEmail };
}

export async function POST(request: Request) {
    try {
        // SECURITY: This endpoint is privileged — it can create/reset admin credentials.
        // It must only be callable with the correct ADMIN_INIT_SECRET header.
        // Set ADMIN_INIT_SECRET in your .env and supply it as: X-Admin-Init-Secret: <value>
        const expectedSecret = process.env.ADMIN_INIT_SECRET;
        if (!expectedSecret) {
            console.error('ADMIN_INIT_SECRET is not configured in environment variables.');
            return NextResponse.json({ success: false, message: 'Endpoint not available' }, { status: 503 });
        }

        const suppliedSecret = request.headers.get('x-admin-init-secret');
        if (!suppliedSecret || suppliedSecret !== expectedSecret) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const result = await ensureAdminUserExists();

        if (result.success) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error: any) {
        console.error('Unexpected error in admin-init:', error.message);
        return NextResponse.json(
            { success: false, message: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
