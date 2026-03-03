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
            console.error('Failed to create admin user:', createError);
            return { success: false, message: 'Failed to create admin user: ' + createError.message };
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

    return { success: true, message: 'Admin user initialized successfully', adminEmail };
}

export async function POST(request: Request) {
    try {
        const result = await ensureAdminUserExists();

        if (result.success) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
