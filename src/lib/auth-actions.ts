'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logActivity } from './activity-actions';
import { verifyPaymentSignature } from './payment-actions';

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

  // Payment Details
  const razorpayPaymentId = formData.get('razorpay_payment_id') as string;
  const razorpayOrderId = formData.get('razorpay_order_id') as string;
  const razorpaySignature = formData.get('razorpay_signature') as string;

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

  // 3. Payment Verification for Host
  if (role === 'host') {
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return 'Payment verification failed: Missing payment details.';
    }
    const isPaymentValid = await verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isPaymentValid) {
      return 'Payment verification failed: Invalid signature.';
    }
  }

  // 4. Create Supabase User
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        // Status is handled by the database trigger:
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
    const userId = data.user.id;
    // Enforce strict status logic manually to bypass potential trigger failures
    const userRole = role;
    const userName = name;
    // HOST APPROVAL: Hosts start as 'pending'
    const userStatus = userRole === 'host' ? 'pending' : 'active';

    // Create public user profile immediately with correct status
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: email,
        name: userName,
        role: userRole,
        status: userStatus,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('CRITICAL: Failed to create public profile:', profileError);
      // We don't stop the flow, but we log it. The Admin Sync will heal this later if needed.
    } else {
      console.log(`✅ Profile created for ${userId} [${userRole}] with status: ${userStatus}`);
    }

    // Log the activity
    await logActivity(
      'new_user',
      `New ${role} signed up: ${name}`,
      userId
    );

    console.log('🎉 SIGNUP SUCCESS:', {
      userId: userId,
      email: data.user.email,
      role,
      status: userStatus,
      metadata: data.user.user_metadata
    });

    // 5. Role-Based Redirect / Messaging
    // UPDATE: We do NOT redirect anymore. We sign out and let client show success modal.

    console.log('✅ SIGNUP COMPLETE. Signing out to enforce manual login.');
    await supabase.auth.signOut();

    return {
      success: true,
      message: 'Account created successfully. Please log in.',
      role
    };
  }

  return undefined;
}

/**
 * Signs the user out.
 */
export const signOutUser = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // Explicitly clear any stale cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name);
    }
  });

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
    return false;
  }

  return true;
}

/**
 * Unified Login Function enforcing Strict Role Access.
 * Admin is identified by role='admin' in the database, NOT by email matching env var.
 */
export async function login(prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return 'Email and password are required.';
  }

  // 1. SELF-HEAL: If this is the admin email, ensure the user exists in Supabase first
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && email.toLowerCase().trim() === adminEmail.toLowerCase().trim()) {
    console.log('Admin login attempt detected. Synchronizing auth user from .env...');
    await ensureAdminUserExists();
  }

  // Attempt login for ALL users (admin, host, guest) via Supabase
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login Error:', error.message);
    return 'Invalid credentials';
  }

  if (!data.user) {
    return 'Login failed. Please try again.';
  }

  const userId = data.user.id;

  // Fetch role from public.users table (source of truth)
  const supabaseAdmin = await createSupabaseAdminClient();
  const profileResponse = await supabaseAdmin
    .from('users')
    .select('role, status')
    .eq('id', userId)
    .single();
  
  let userProfile = profileResponse.data;
  const profileError = profileResponse.error;

  if (profileError || !userProfile) {
    // Self-heal: Create missing profile — use auth metadata for role/status to not overwrite approved state
    console.log('User profile not found, attempting to create...');
    const userRole = data.user.user_metadata?.role || 'guest';
    const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
    // CRITICAL: Respect metadata status if it exists (set by admin approveHost).
    // If metadata has NO status, default new hosts to 'pending', guests to 'active'.
    const metaStatus = data.user.user_metadata?.status;
    const userStatus = metaStatus || (userRole === 'host' ? 'pending' : 'active');

    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        name: userName,
        email: data.user.email,
        role: userRole,
        status: userStatus,
        avatar_url: data.user.user_metadata?.avatar_url || null,
      }, { onConflict: 'id' })
      .select('role, status')
      .single();

    if (createError || !newProfile) {
      console.error('Failed to create user profile:', createError);
      await supabase.auth.signOut();
      return 'Account profile not found. Please contact support.';
    }
    userProfile = newProfile;
  }

  const { role, status } = userProfile;
  const normalizedRole = role?.toLowerCase() || '';

  // 1. ADMIN FLOW
  if (normalizedRole === 'admin') {
    redirect('/admin-panel');
    return;
  }

  // 2. HOST FLOW
  if (normalizedRole === 'host') {
    console.log('🔍 HOST LOGIN DEBUG:', {
      userId,
      email: data.user.email,
      role: normalizedRole,
      status,
      rawStatus: userProfile.status,
      userProfile
    });

    // SYNC-HEAL: If DB says 'pending' but auth metadata says 'active',
    // it means admin approved this host but DB didn't sync properly.
    // Trust the metadata and heal the DB record.
    if (status === 'pending') {
      const metaStatus = data.user.user_metadata?.status;
      if (metaStatus === 'active') {
        console.log('⚠️ SYNC HEAL: DB says pending but metadata says active. Healing DB...');
        await supabaseAdmin
          .from('users')
          .update({ status: 'active' })
          .eq('id', userId);
        // Override local status so login proceeds
        userProfile = { ...userProfile, status: 'active' };
        redirect('/host-dashboard');
        return;
      }
      console.log('❌ BLOCKING: Host status is pending');
      await supabase.auth.signOut();
      return 'Host account pending approval. Please wait for an administrator to approve your account.';
    }
    if (status === 'rejected') {
      const rejectionReason = data.user.user_metadata?.rejection_reason || 'No reason provided';
      console.log('❌ BLOCKING: Host status is rejected');
      await supabase.auth.signOut();
      return `Host account has been rejected. Reason: ${rejectionReason}`;
    }
    if (status === 'suspended') {
      console.log('❌ BLOCKING: Host status is suspended');
      await supabase.auth.signOut();
      return 'Host account suspended.';
    }
    if (status === 'approved' || status === 'approved_host' || status === 'active') {
      console.log('✅ ALLOWING: Host status is approved/active');
      redirect('/host-dashboard');
    }
    console.log('❌ BLOCKING: Host status not recognized:', status);
    await supabase.auth.signOut();
    return 'Host account status not recognized. Please contact support.';
  }

  // 3. GUEST FLOW
  if (normalizedRole === 'guest') {
    if (status === 'suspended') {
      await supabase.auth.signOut();
      return 'Guest account suspended.';
    }
    redirect('/user-profile');
  }

  // Fallback for unrecognized roles
  console.error('Role not recognized during login:', { role, normalizedRole, status, userId });
  await supabase.auth.signOut();
  return `Role not recognized: ${role}. Please contact support.`;
}

// --- Mobile Authentication Actions ---

export async function signInWithMobile(prevState: string | undefined, formData: FormData) {
  const phone = formData.get('phone') as string;

  if (!phone) {
    return 'Phone number is required.';
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    console.error('Mobile Sign In Error:', error.message);
    return error.message;
  }

  return { success: true, message: 'OTP sent successfully' };
}

export async function verifyMobileOtp(prevState: string | undefined, formData: FormData) {
  const phone = formData.get('phone') as string;
  const token = formData.get('otp') as string;
  const name = formData.get('name') as string; // Optional context for new users
  const role = (formData.get('role') as string)?.toLowerCase() || 'guest'; // Default to guest

  // Payment Details
  const razorpayPaymentId = formData.get('razorpay_payment_id') as string;
  const razorpayOrderId = formData.get('razorpay_order_id') as string;
  const razorpaySignature = formData.get('razorpay_signature') as string;

  if (!phone || !token) {
    return 'Phone number and OTP are required.';
  }

  // Payment Verification for Host
  if (role === 'host') {
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return 'Payment verification failed: Details missing.';
    }
    const isPaymentValid = await verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isPaymentValid) {
      return 'Payment verification failed: Invalid signature.';
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    console.error('OTP Verification Error:', error.message);
    return 'Invalid OTP code.';
  }

  if (data.user) {
    const userId = data.user.id;
    const supabaseAdmin = await createSupabaseAdminClient();

    // Check if user profile exists
    // We MUST fetch the role from public.users to be secure
    const profileResponse = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single();
    
    let userProfile = profileResponse.data;
    const profileError = profileResponse.error;

    if (profileError || !userProfile) {
      // Create new profile for mobile user
      console.log('Mobile user profile not found, creating...');

      const userRole = role === 'host' ? 'host' : 'guest';
      const userStatus = userRole === 'host' ? 'active' : 'active'; // Hosts are auto-approved now
      const userName = name || 'Mobile User';

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          name: userName,
          phone: phone,
          // Email might be null for phone users, handle schema constraints if any
          role: userRole,
          status: userStatus,
        })
        .select('role, status')
        .single();

      if (createError) {
        console.error('Failed to create mobile user profile:', createError);
        // Attempt to see if it failed because email is required (common in some schemas)
        // For now, we assume schema supports it or we handle it.
        await supabase.auth.signOut();
        return 'Failed to create user profile. Please contact support.';
      }
      userProfile = newProfile;

      // Log new user
      await logActivity(
        'new_user',
        `New ${userRole} signed up via Mobile: ${userName}`,
        userId
      );
    }

    if (!userProfile) {
      await supabase.auth.signOut();
      return 'User profile error.';
    }

    // Role Specific Redirects
    // UPDATE: We do NOT redirect anymore. We sign out and let client show success modal.

    const normalizedRole = userProfile.role?.toLowerCase() || '';

    console.log('✅ MOBILE SIGNUP COMPLETE. Signing out to enforce manual login.');
    await supabase.auth.signOut();

    return {
      success: true,
      message: 'Account created successfully. Please log in.',
      role: normalizedRole
    };
  }
}
