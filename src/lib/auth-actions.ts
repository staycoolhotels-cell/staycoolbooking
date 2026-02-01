'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logActivity } from './activity-actions';

// --- Supabase Client Helpers ---

const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

// --- Authentication Actions ---

/**
 * Handles new user registration strictly for Guests and Hosts.
 * Admins cannot sign up via this flow.
 */
export async function signUpUser(prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const name = formData.get('fullName') as string;
  const rawRole = formData.get('role') as string;

  // 1. Basic Validation
  if (!email || !password || !confirmPassword || !name) {
    return 'All fields are required.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  // 2. Role Sanitization
  // Only allow 'host' or 'guest'. Default to 'guest'.
  const role = rawRole?.toLowerCase() === 'host' ? 'host' : 'guest';

  // 3. Create Supabase User
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        // Note: The database trigger (schema.sql) will handle 
        // setting public.users.status based on this role.
        // Role=Host -> Status=Pending
        // Role=Guest -> Status=Active
      },
    },
  });

  if (error) {
    console.error('Signup Error:', error.message);
    return error.message;
  }

  if (data.user) {
    // Log the activity
    await logActivity(
      'new_user',
      `New ${role} signed up: ${name}`,
      data.user.id
    );

    // 4. Role-Based Redirect / Messaging
    // If Host, they are pending approval. 
    // Ideally, we redirect to a "Registration Successful - Pending Approval" page.
    if (role === 'host') {
      // Cannot login immediately effectively, or if auto-login happens, the dashboard check will block them.
      // We'll redirect to a generic waiting page or profile.
      // For now, let's redirect to login with a success message indicator? 
      // Or directly to the dashboard where the "Pending" screen will be shown.
      // Next.js actions often auto-login on signup depending on config, but Supabase default often requires email confirmation 
      // unless disabled. Assuming email confirmation is OFF or handled.
    }

    return undefined; // Success implies redirect happens or UI updates
  }

  return undefined;
}

/**
 * Signs the user out.
 */
export const signOutUser = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
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
    return false;
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
      return false;
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
      return false;
    }
    if (!newUser) {
      console.error('Failed to create admin user, no user data returned.');
      return false;
    }
    adminId = newUser.id;
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
    return false;
  }

  return true;
}

/**
 * Unified Login Function enforcing Strict Role Access.
 */
export async function login(prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return 'Email and password are required.';
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 1. ADMIN FLOW Check
  if (email === adminEmail) {
    if (password !== adminPassword) {
      return 'Invalid credentials'; // Admin credentials must match ENV exactly
    }

    // Sync Admin User to Ensure DB Existence
    const syncSuccess = await ensureAdminUserExists();
    if (!syncSuccess) {
      return 'System Error: Could not verify admin account.';
    }

    // Proceed to Sign In via Supabase (now that we know user/pass exists in Auth)
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Admin Login Supabase Error:', error.message);
      return 'Login failed despite verification.';
    }

    redirect('/admin-panel');
    return; // Should not reach here
  }

  // 2. REGULAR USER FLOW (Host/Guest)
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return 'Invalid credentials';
  }

  if (data.user) {
    const userId = data.user.id;
    // 3. Strict Role Verification
    // We MUST fetch the role from public.users to be secure (not just relying on stale metadata)
    const supabaseAdmin = await createSupabaseAdminClient();
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      // Critical Error: User in Auth but not in DB.
      // Self-heal? Or Block? 
      // Block is safer for "Strict".
      await supabase.auth.signOut();
      return 'Account profile not found. Please contact support.';
    }

    const { role, status } = userProfile;

    // 4. Role Specific Logic

    // CASE: Admin trying to login via regular form? 
    // If they used ENV creds, handled above. 
    // If they have an account that is admin but not matching ENV email? (Shouldn't happen with strict design).
    if (role === 'admin') {
      redirect('/admin-panel');
    }

    // CASE: HOST
    if (role === 'host') {
      if (status === 'pending') {
        await supabase.auth.signOut();
        return 'Host account pending approval. Please wait for an administrator to approve your account.';
      }
      if (status === 'rejected') {
        await supabase.auth.signOut();
        return 'Host account has been rejected.';
      }
      if (status === 'suspended') {
        await supabase.auth.signOut();
        return 'Host account suspended.';
      }

      // Approved Host
      redirect('/host-dashboard');
    }

    // CASE: GUEST
    if (role === 'guest') {
      redirect('/user-profile'); // Or appropriate guest landing
    }

    // Fallback
    await supabase.auth.signOut();
    return 'Role not recognized.';
  }

  return 'Login failed.';
}
