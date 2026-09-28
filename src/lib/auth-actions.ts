'use server';



import { createServerClient } from '@supabase/ssr';

import { cookies, headers } from 'next/headers';

import { redirect } from 'next/navigation';

import { logActivity } from './activity-actions';


import { sendMsg91OTP, verifyMsg91OTP } from './msg91';

import crypto from 'crypto';







// --- Supabase Client Helpers ---



export const createSupabaseServerClient = async () => {

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



export const createSupabaseAdminClient = async () => {

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

export async function signUpUser(_prevState: string | undefined, formData: FormData) {

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



  // 3.5 Check if email already exists in public.users to give a clean error

  const supabaseAdmin = await createSupabaseAdminClient();

  const { data: existingUser } = await supabaseAdmin

    .from('users')

    .select('id')

    .eq('email', email.trim())

    .maybeSingle();



  if (existingUser) {

    return 'An account with this email already exists.';

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

        status: 'active',

      },

    },

  });



  if (error) {

    console.error('Signup Error:', error.message);

    return `Signup Error: ${error.message}`;

  }



  if (data.user) {

    const userId = data.user.id;

    // Enforce strict status logic manually to bypass potential trigger failures

    const userRole = role;

    const userName = name;

    // Hosts start as active immediately after signup; no signup payment is required.

    const userStatus = 'active';



    // --- Referral Logic ---

    let referrerId = null;

    const referralCode = formData.get('referralCode') as string;

    const supabaseAdmin = await createSupabaseAdminClient();



    if (referralCode) {

      console.log('🔍 Checking referral code:', referralCode);

      const { data: referrer } = await supabaseAdmin

        .from('users')

        .select('id, referral_benefit_count')

        .eq('referral_code', referralCode)

        .single();



      if (referrer) {

        console.log('✅ Found referrer:', referrer.id);

        referrerId = referrer.id;



        // Reward the referrer if the new user is signing up as a HOST

        if (userRole === 'host') {

          console.log('🎁 Rewarding referrer with 5 bookings benefit');

          await supabaseAdmin

            .from('users')

            .update({ referral_benefit_count: (referrer.referral_benefit_count || 0) + 5 })

            .eq('id', referrer.id);

        }

      } else {

        console.warn('⚠️ Referral code not found:', referralCode);

      }

    }



    // Create public user profile immediately with correct status
    const newReferralCode = `SC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Calculate subscription expiry (1 year from now)
    const subscriptionExpiry = userRole === 'host' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;
    const subscriptionStatus = userRole === 'host' ? 'active' : 'inactive';

    const profilePayload: any = {
      id: userId,
      email: email,
      name: userName,
      role: userRole,
      status: userStatus,
      avatar_url: null,
      created_at: new Date().toISOString(),
      referred_by: referrerId,
      referral_code: newReferralCode,
      referral_commissions_remaining: (referrerId && userRole === 'host') ? 5 : 0,
      subscription_status: subscriptionStatus,
      subscription_expiry: subscriptionExpiry,
    };

    let { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError && (profileError.code === 'PGRST204' || profileError.message?.includes('subscription_expiry') || profileError.message?.includes('subscription_status'))) {
      console.warn('⚠️ subscription_expiry or subscription_status column does not exist in schema. Retrying profile creation without subscription columns...');
      delete profilePayload.subscription_status;
      delete profilePayload.subscription_expiry;
      const retryRes = await supabaseAdmin
        .from('users')
        .upsert(profilePayload, { onConflict: 'id' });
      profileError = retryRes.error;
    }

    if (profileError) {
      console.error('CRITICAL: Failed to create public profile:', profileError);
      // We don't stop the flow, but we log it. The Admin Sync will heal this later if needed.
    } else {
      console.log(`✅ Profile created for ${userId} [${userRole}] with status: ${userStatus} and referral code: ${newReferralCode}`);
    }

    // Log the activity
    await logActivity(
      'new_user',
      `New ${role} signed up (Referral: ${referralCode || 'None'}): ${name}`,
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

  // If credentials are not in .env, skip self-healing silently.
  if (!adminEmail || !adminPassword) {
    return true;
  }

  const supabaseAdmin = await createSupabaseAdminClient();

  // 1. Get all users in Auth to check if adminEmail user exists
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('Failed to list users for admin check:', error);
    return false;
  }

  const existingAdmin = users.find(u => u.email?.toLowerCase().trim() === adminEmail.toLowerCase().trim());
  let adminId: string;

  if (existingAdmin) {
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
    if (!newUser) return false;
    adminId = newUser.user.id;
  }

  // Ensure public.users table reflects admin role and status
  await supabaseAdmin
    .from('users')
    .upsert({
      id: adminId,
      email: adminEmail,
      name: 'System Admin',
      role: 'admin',
      status: 'active',
    }, { onConflict: 'id' });

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

  return true;
}

/**
 * Unified Login Function enforcing Strict Role Access.
 */
export async function login(_prevState: string | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const requestedReturnTo = formData.get('returnTo') as string | null;
  const safeReturnTo = requestedReturnTo?.startsWith('/guest-booking-flow') ? requestedReturnTo : null;

  if (!email || !password) {
    return 'Email and password are required.';
  }

  // 1. SELF-HEAL: Only if .env credentials match
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && email.toLowerCase().trim() === adminEmail.toLowerCase().trim()) {
    console.log('Admin login attempt detected. Synchronizing auth user from .env...');
    await ensureAdminUserExists();
  }

  // Attempt login for ALL users (admin, host, guest) via Supabase
  const supabase = await createSupabaseServerClient();
  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login Error:', error.message);

    // ── SELF-HEAL: DB user exists but Supabase Auth failed ──
    // Handles: OTP-only signups (no password set), manually inserted DB records,
    // or any case where auth account is out of sync with public.users.
    const supabaseAdminHeal = await createSupabaseAdminClient();
    const { data: dbUser } = await supabaseAdminHeal
      .from('users')
      .select('id, role, status, name, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (dbUser?.id) {
      console.log(`⚠️ SELF-HEAL: User exists in DB but auth failed for ${email}. Auto-fixing...`);
      try {
        // Step 1: Try updating password on existing auth user
        const { error: updateErr } = await supabaseAdminHeal.auth.admin.updateUserById(dbUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            role: dbUser.role || 'guest',
            status: dbUser.status || 'active',
            name: dbUser.name || '',
          },
        });

        if (updateErr) {
          // Step 2: Auth record doesn't exist at all — create it fresh
          console.log('⚠️ No auth user by ID, creating fresh...');
          const { error: createErr } = await supabaseAdminHeal.auth.admin.createUser({
            email: dbUser.email || email,
            password,
            email_confirm: true,
            user_metadata: {
              role: dbUser.role || 'guest',
              status: dbUser.status || 'active',
              name: dbUser.name || '',
            },
          });
          if (createErr) {
            console.error('❌ Self-heal create failed:', createErr.message);
            return 'Unable to sign in. Please use "Forgot Password" to reset your password.';
          }
        }

        // Step 3: Retry login with healed auth account
        const retryResult = await supabase.auth.signInWithPassword({ email, password });
        if (retryResult.error || !retryResult.data?.user) {
          console.error('❌ Self-heal retry failed:', retryResult.error?.message);
          return 'Invalid credentials';
        }
        console.log('✅ SELF-HEAL LOGIN SUCCESS for:', email);
        data = retryResult.data;
        error = null as any;
      } catch (healEx) {
        console.error('❌ Self-heal exception:', healEx);
        return 'Invalid credentials';
      }
    } else {
      return 'Invalid credentials';
    }
  }

  if (!data?.user) {
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
    const userStatus = metaStatus || (userRole === 'host' ? 'active' : 'active');

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

  // Enforce expected role from login portal
  const expectedRole = formData.get('expectedRole') as string;
  if (expectedRole && expectedRole.toLowerCase() !== normalizedRole) {
    await supabase.auth.signOut();
    if (expectedRole.toLowerCase() === 'host') {
      return 'This account is not registered as a Host. Please sign in using the Guest portal.';
    } else if (expectedRole.toLowerCase() === 'admin') {
      return 'This account is not registered as an Admin. Please sign in using the appropriate portal.';
    } else {
      return 'This account is registered as a Host. Please sign in using the Host portal.';
    }
  }

  // Sync-heal Auth Metadata: If the Auth metadata role/status does not match public.users, update it!
  const authUserMeta = data.user.user_metadata || {};
  if (authUserMeta.role !== normalizedRole || authUserMeta.status !== status) {
    console.log(`⚠️ SYNC HEAL: Auth metadata role/status does not match database. Syncing...`);
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...authUserMeta,
        role: normalizedRole,
        status: status
      }
    });
  }

  // 1. ADMIN FLOW
  if (normalizedRole === 'admin') {
    // Strictly enforce that only the email matching process.env.ADMIN_EMAIL can log in as admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || data.user.email?.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
      console.warn(`Blocking login for unauthorized admin user: ${data.user.email}`);
      await supabase.auth.signOut();
      return 'Invalid credentials';
    }
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

        redirect('/host-onboarding');

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

    if (status === 'approved' || status === 'approved_host' || status === 'active' || status === 'pending') {

      console.log('✅ ALLOWING: Host status is approved/active/pending');

      redirect('/host-onboarding');

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

    redirect(safeReturnTo || '/');

  }



  // Fallback for unrecognized roles

  console.error('Role not recognized during login:', { role, normalizedRole, status, userId });

  await supabase.auth.signOut();

  return `Role not recognized: ${role}. Please contact support.`;

}



// --- Mobile Authentication Actions ---



export async function signInWithMobile(_prevState: string | undefined, formData: FormData) {

  const phone = formData.get('phone') as string;

  console.log('--- signInWithMobile ---');

  console.log('Phone:', phone);



  if (!phone) {

    return 'Phone number is required.';

  }



  // Check if it is Sign Up or Sign In flow

  const isSignUp = formData.has('fullName') || formData.has('name') || formData.has('role') || formData.get('flow') === 'signup';

  const cleanPhone = phone.replace(/\D/g, '');

  const last10Digits = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

  const supabaseAdmin = await createSupabaseAdminClient();

  

  let query = supabaseAdmin.from('users').select('id');

  if (last10Digits) {

    query = query.or(`phone.eq.${phone.trim()},phone.like.%${last10Digits}`);

  } else {

    query = query.eq('phone', phone.trim());

  }

  const { data: existingUsers } = await query.limit(1);

  const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;



  if (isSignUp) {

    if (existingUser) {

      return 'An account with this mobile number already exists. Please sign in instead.';

    }

  } else {

    // If it's sign in, block if the account does not exist

    if (!existingUser && phone !== '+911111111111' && phone !== '1111111111') {

      return 'No account found with this mobile number. Please sign up first.';

    }

  }



  // MOCK OTP Mode: Allow testing with any phone number using '123456'

  if (process.env.MOCK_OTP === 'true') {

    console.log(`[MOCK OTP] MOCK OTP '123456' generated for ${phone}`);

    return { success: true, message: 'OTP sent successfully (MOCK MODE)' };

  }



  // DEVELOPMENT BYPASS: Allow testing without a working SMS provider

  if (phone === '+911111111111' || phone === '1111111111') {

    console.log('--- DEVELOPMENT BYPASS TRIGGERED for signInWithMobile ---');

    return { success: true, message: 'OTP sent successfully (DEVELOPMENT MOCK)' };

  }



  // MSG91 INTEGRATION:

  if (process.env.MSG91_AUTH_KEY) {

    const { success, error } = await sendMsg91OTP(phone);

    if (!success) {

      return `SMS Error: ${error || 'Failed to send OTP via MSG91'}`;

    }

    return { success: true, message: 'OTP sent successfully via MSG91' };

  }



  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({

    phone,

  });



  if (error) {

    console.error('Mobile Sign In Error:', error.message);

    return `Mobile Sign In Error: ${error.message}`;

  }



  return { success: true, message: 'OTP sent successfully' };

}



export async function verifyMobileOtp(_prevState: string | undefined, formData: FormData) {

  const phone = formData.get('phone') as string;

  const token = formData.get('otp') as string;

  const name = formData.get('name') as string; // Optional context for new users

  const role = formData.get('role') as string; // Check if role is present (only on signup)

  const isSignupFlow = !!role || formData.get('flow') === 'signup';



  if (!phone || !token) {

    return 'Phone number and OTP are required.';

  }



  // Pre-verification checks to ensure unique account creation and prevent unrecognized login

  const cleanPhone = phone.replace(/\D/g, '');

  const last10Digits = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

  const supabaseAdmin = await createSupabaseAdminClient();

  

  let query = supabaseAdmin.from('users').select('id');

  if (last10Digits) {

    query = query.or(`phone.eq.${phone.trim()},phone.like.%${last10Digits}`);

  } else {

    query = query.eq('phone', phone.trim());

  }

  const { data: existingUsers } = await query.limit(1);

  const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;



  if (isSignupFlow) {

    if (existingUser) {

      return 'An account with this mobile number already exists. Please sign in instead.';

    }

  } else {

    if (!existingUser && phone !== '+911111111111' && phone !== '1111111111') {

      return 'No account found with this mobile number. Please sign up first.';

    }

    // Enforce expected role for mobile login
    const expectedRole = formData.get('expectedRole') as string;
    if (expectedRole) {
      const isBypassPhone = phone === '+911111111111' || phone === '1111111111';
      let databaseRole = 'guest';
      if (existingUser) {
        const { data: dbUser } = await supabaseAdmin.from('users').select('role').eq('id', existingUser.id).single();
        databaseRole = dbUser?.role?.toLowerCase() || 'guest';
      } else if (isBypassPhone) {
        databaseRole = 'host';
      }

      if (expectedRole.toLowerCase() !== databaseRole) {
        if (expectedRole.toLowerCase() === 'host') {
          return 'This account is not registered as a Host. Please sign in using the Guest portal.';
        } else if (expectedRole.toLowerCase() === 'admin') {
          return 'This account is not registered as an Admin. Please sign in using the appropriate portal.';
        } else {
          return 'This account is registered as a Host. Please sign in using the Host portal.';
        }
      }
    }

  }



  const userRole = role?.toLowerCase() === 'host' ? 'host' : 'guest';



  const supabase = await createSupabaseServerClient();



  // DEVELOPMENT BYPASS: Allow testing without a working SMS provider

  if ((phone === '+911111111111' || phone === '1111111111') && token === '111111') {

    console.log('--- DEVELOPMENT BYPASS TRIGGERED for verifyMobileOtp ---');

    // Log in as the default host account to provide a valid session

    const { data: mockData, error: mockError } = await supabase.auth.signInWithPassword({

      email: process.env.HOST_EMAIL || 'buddi@gmail.com',

      password: process.env.HOST_PASSWORD || 'Praveen@123',

    });

    

    if (mockError) {

      console.error('Bypass Login Error:', mockError.message);

      return `Bypass Login Error: ${mockError.message}`;

    }

    

    return {

      success: true,

      message: isSignupFlow ? 'Account created successfully. Please log in.' : 'Logged in successfully.',

      role: 'host'

    };

  }



  let finalUserId: string | undefined;

  let finalUserRole = userRole;



  // MSG91 INTEGRATION / MOCK OTP:

  if (process.env.MSG91_AUTH_KEY || process.env.MOCK_OTP === 'true') {

    let verified = false;

    if (process.env.MOCK_OTP === 'true' && token === '123456') {

      verified = true;

      console.log(`[MOCK OTP] MOCK OTP verification successful for ${phone}`);

    } else if (process.env.MSG91_AUTH_KEY) {

      const { success, error: msg91Error } = await verifyMsg91OTP(phone, token);

      if (success) {

        verified = true;

      } else {

        return `OTP Verification Error: ${msg91Error || 'Invalid OTP code.'}`;

      }

    }



    if (verified) {

      const supabaseAdmin = await createSupabaseAdminClient();

    const normalizedPhone = phone.replace(/\D/g, '');

    const mobileEmail = `${normalizedPhone}@staycool.mobile`;

    

    // Deterministic password using SUPABASE_SERVICE_ROLE_KEY
    // Must satisfy Supabase password policy:
    // Requires lowercase, uppercase, digits, and special characters
    const rawHash = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .update(normalizedPhone)
      .digest('hex');
    const deterministicPassword = `St@yC00l!#${rawHash}Aa1*`;
    const oldDeterministicPassword = rawHash;

    // Check if user profile already exists
    const { data: existingProfiles } = await supabaseAdmin
      .from('users')
      .select('id, role, status')
      .eq('phone', phone);

    let userProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;
    let userId = userProfile?.id;

    if (!userId) {
      // Try to sign in first to check if they exist in auth
      let { data: signInData } = await supabase.auth.signInWithPassword({
        email: mobileEmail,
        password: deterministicPassword,
      });

      if (!signInData?.user) {
        // Also check if they exist with old password format
        const { data: oldSignInData } = await supabase.auth.signInWithPassword({
          email: mobileEmail,
          password: oldDeterministicPassword,
        });
        if (oldSignInData?.user) {
          signInData = oldSignInData;
          await supabaseAdmin.auth.admin.updateUserById(oldSignInData.user.id, {
            password: deterministicPassword,
          });
        }
      }

      if (signInData?.user) {
        userId = signInData.user.id;
      } else {
        // User does not exist in Auth, create them!
        const { data: newAuthUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email: mobileEmail,
          password: deterministicPassword,
          email_confirm: true,
          user_metadata: {
            role: finalUserRole,
            name: name || 'Mobile User',
            phone: phone,
            status: 'active',
          }
        });

        if (authCreateError) {
          console.error('Failed to create auth user for mobile:', authCreateError.message);
          return `Signup Error: ${authCreateError.message}`;
        }
        userId = newAuthUser.user.id;

        // Since we created them, now log them in to establish the session
        await supabase.auth.signInWithPassword({
          email: mobileEmail,
          password: deterministicPassword,
        });
      }
    } else {
      // User exists in profile and auth, ensure compliant password and sign in
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: mobileEmail,
        password: deterministicPassword,
      });

      if (signInError) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: deterministicPassword,
        });
        const retry = await supabase.auth.signInWithPassword({
          email: mobileEmail,
          password: deterministicPassword,
        });
        signInError = retry.error;
      }

      if (signInError) {
        console.error('Mobile signin session establishment failed:', signInError.message);
        return `Login failed after OTP verification: ${signInError.message}`;
      }
    }



    finalUserId = userId;



    if (!userProfile) {

      console.log('Mobile user profile not found, creating...');

      const userStatus = 'active'; // Hosts are auto-approved now after payment

      const userName = name || 'Mobile User';

      const newReferralCode = `SC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;



      // --- Referral Logic ---

      let referrerId = null;

      const referralCode = formData.get('referralCode') as string;



      if (referralCode) {

        console.log('🔍 Checking (Mobile) referral code:', referralCode);

        const { data: referrer } = await supabaseAdmin

          .from('users')

          .select('id, referral_benefit_count')

          .eq('referral_code', referralCode)

          .single();



        if (referrer) {

          console.log('✅ Found (Mobile) referrer:', referrer.id);

          referrerId = referrer.id;



          // Reward the referrer if the new user is signing up as a HOST

          if (finalUserRole === 'host') {

            console.log('🎁 Rewarding referrer with 5 bookings benefit');

            await supabaseAdmin

              .from('users')

              .update({ referral_benefit_count: (referrer.referral_benefit_count || 0) + 5 })

              .eq('id', referrer.id);

          }

        }

      }



      // Calculate subscription expiry

      const subscriptionExpiry = finalUserRole === 'host' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;

      const subscriptionStatus = finalUserRole === 'host' ? 'active' : 'inactive';



      const profilePayload: any = {

        id: userId,

        name: userName,

        phone: phone,

        email: mobileEmail,

        role: finalUserRole,

        status: userStatus,

        referred_by: referrerId,

        referral_code: newReferralCode,

        referral_commissions_remaining: (referrerId && finalUserRole === 'host') ? 5 : 0,

        subscription_status: subscriptionStatus,

        subscription_expiry: subscriptionExpiry,

      };



      let { data: newProfile, error: createError } = await supabaseAdmin

        .from('users')

        .upsert(profilePayload, { onConflict: 'id' })

        .select('id, role, status')

        .single();



      if (createError && (createError.code === 'PGRST204' || createError.message?.includes('subscription_expiry') || createError.message?.includes('subscription_status'))) {

        console.warn('⚠️ subscription_expiry or subscription_status column does not exist. Retrying mobile profile creation without subscription columns...');

        delete profilePayload.subscription_status;

        delete profilePayload.subscription_expiry;

        const retryRes = await supabaseAdmin

          .from('users')

          .upsert(profilePayload, { onConflict: 'id' })

          .select('id, role, status')

          .single();

        newProfile = retryRes.data;

        createError = retryRes.error;

      }



      if (createError) {

        console.error('Failed to create mobile user profile:', createError);

        return `Failed to create user profile: ${createError.message} (${createError.details || createError.code || ''})`;

      }

      userProfile = newProfile;



      // Log new user

      await logActivity(

        'new_user',

        `New ${finalUserRole} signed up via Mobile (Referral: ${referralCode || 'None'}): ${userName}`,

        userId

      );

    }



    if (userProfile) {

      finalUserRole = userProfile.role?.toLowerCase() === 'host' ? 'host' : 'guest';

      

      // Update auth metadata to ensure role and status are synced

      const { error: syncMetaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {

        user_metadata: {

          role: finalUserRole,

          status: userProfile.status,

          phone: phone,

          name: name || 'Mobile User'

        }

      });

      if (syncMetaError) {

        console.error('Failed to sync auth metadata for mobile user:', syncMetaError.message);

      } else {

        console.log(`✅ Synced Auth Metadata for user ${userId} to role=${finalUserRole}, status=${userProfile.status}`);

      }

    }



    // Now log the user in to establish a session cookie!
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: mobileEmail,
      password: deterministicPassword,
    });

    if (signInError && userId) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: deterministicPassword,
      });
      const retry = await supabase.auth.signInWithPassword({
        email: mobileEmail,
        password: deterministicPassword,
      });
      signInError = retry.error;
    }

    if (signInError) {
      console.error('Mobile signin session establishment failed:', signInError.message);
      return `Login failed after OTP verification: ${signInError.message}`;
    }

    }



  } else {

    // Standard Supabase Phone Auth Flow

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

      finalUserId = userId;

      const supabaseAdmin = await createSupabaseAdminClient();



      // Check if user profile exists

      const { data: existingProfiles } = await supabaseAdmin

        .from('users')

        .select('role, status')

        .eq('id', userId);

      

      let userProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;



      // --- Referral Logic ---

      let referrerId = null;

      const referralCode = formData.get('referralCode') as string;



      if (referralCode) {

        console.log('🔍 Checking (Mobile) referral code:', referralCode);

        const { data: referrer } = await supabaseAdmin

          .from('users')

          .select('id, referral_benefit_count')

          .eq('referral_code', referralCode)

          .single();



        if (referrer) {

          console.log('✅ Found (Mobile) referrer:', referrer.id);

          referrerId = referrer.id;



          // Reward the referrer if the new user is signing up as a HOST

          if (finalUserRole === 'host') {

            console.log('🎁 Rewarding referrer with 5 bookings benefit');

            await supabaseAdmin

              .from('users')

              .update({ referral_benefit_count: (referrer.referral_benefit_count || 0) + 5 })

              .eq('id', referrer.id);

          }

        } else {

          console.warn('⚠️ Mobile referral code not found:', referralCode);

        }

      }



      if (!userProfile) {

        // Create new profile for mobile user

        console.log('Mobile user profile not found, creating...');



        const userStatus = finalUserRole === 'host' ? 'active' : 'active'; // Hosts are auto-approved now

        const userName = name || 'Mobile User';

        const newReferralCode = `SC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;



        // Calculate subscription expiry (1 year from now)

        const subscriptionExpiry = finalUserRole === 'host' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;

        const subscriptionStatus = finalUserRole === 'host' ? 'active' : 'inactive';



        const profilePayload: any = {

          id: userId,

          name: userName,

          phone: phone,

          role: finalUserRole,

          status: userStatus,

          referred_by: referrerId,

          referral_code: newReferralCode,

          referral_commissions_remaining: (referrerId && finalUserRole === 'host') ? 5 : 0,

          subscription_status: subscriptionStatus,

          subscription_expiry: subscriptionExpiry,

        };



        let { data: newProfile, error: createError } = await supabaseAdmin

          .from('users')

          .upsert(profilePayload, { onConflict: 'id' })

          .select('role, status')

          .single();



        if (createError && (createError.code === 'PGRST204' || createError.message?.includes('subscription_expiry') || createError.message?.includes('subscription_status'))) {

          console.warn('⚠️ subscription_expiry or subscription_status column does not exist. Retrying mobile profile creation without subscription columns...');

          delete profilePayload.subscription_status;

          delete profilePayload.subscription_expiry;

          const retryRes = await supabaseAdmin

            .from('users')

            .upsert(profilePayload, { onConflict: 'id' })

            .select('role, status')

            .single();

          newProfile = retryRes.data;

          createError = retryRes.error;

        }



        if (createError) {

          console.error('Failed to create mobile user profile:', createError);

          await supabase.auth.signOut();

          return `Failed to create user profile: ${createError.message} (${createError.details || createError.code || ''})`;

        }

        userProfile = newProfile;



        // Log new user

        await logActivity(

          'new_user',

          `New ${finalUserRole} signed up via Mobile (Referral: ${referralCode || 'None'}): ${userName}`,

          userId

        );

      }



      if (userProfile) {

        finalUserRole = userProfile.role?.toLowerCase() === 'host' ? 'host' : 'guest';

        

        // Update auth metadata to ensure role and status are synced

        const authUserMeta = data.user.user_metadata || {};

        if (authUserMeta.role !== finalUserRole || authUserMeta.status !== userProfile.status) {

          console.log(`⚠️ Syncing Auth User Metadata to match profile role=${finalUserRole}, status=${userProfile.status}`);

          await supabaseAdmin.auth.admin.updateUserById(userId, {

            user_metadata: {

              ...authUserMeta,

              role: finalUserRole,

              status: userProfile.status

            }

          });

        }

      }

    }

  }



  // Common response handling

  if (finalUserId) {

    if (isSignupFlow) {

      console.log('✅ MOBILE SIGNUP COMPLETE. Session established.');



      return {

        success: true,

        message: 'Account created and logged in successfully.',

        role: finalUserRole

      };

    } else {

      console.log('✅ MOBILE LOGIN COMPLETE. Session established.');

      return {

        success: true,

        message: 'Logged in successfully.',

        role: finalUserRole

      };

    }

  }



  return 'OTP Verification failed.';

}



/**

 * Sends a password reset email to the given email address.

 */

export async function sendPasswordResetEmail(_prevState: string | undefined, formData: FormData) {

  const email = formData.get('email') as string;



  if (!email) {

    return JSON.stringify({ error: 'Email is required.' });

  }



  const supabase = await createSupabaseServerClient();

  const headersList = await headers();
  const origin = headersList.get('origin');
  const referer = headersList.get('referer');
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (origin) {
    siteUrl = origin;
  } else if (referer) {
    try {
      siteUrl = new URL(referer).origin;
    } catch (e) {
      // fallback
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {

    redirectTo: `${siteUrl}/reset-password`,

  });



  if (error) {

    console.error('Password Reset Error:', error.message);

    return JSON.stringify({ error: 'Failed to send reset email. Please try again.' });

  }



  return JSON.stringify({ success: true });

}



/**

 * Updates the user's password after they click the reset link.

 * Must be called from a page that has the Supabase session set via the reset link.

 */

export async function updatePassword(_prevState: string | undefined, formData: FormData) {

  const password = formData.get('password') as string;

  const confirmPassword = formData.get('confirmPassword') as string;



  if (!password || !confirmPassword) {

    return JSON.stringify({ error: 'Both password fields are required.' });

  }



  if (password.length < 6) {

    return JSON.stringify({ error: 'Password must be at least 6 characters.' });

  }



  if (password !== confirmPassword) {

    return JSON.stringify({ error: 'Passwords do not match.' });

  }



  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({ password });



  if (error) {

    console.error('Update Password Error:', error.message);

    return JSON.stringify({ error: 'Failed to update password. The reset link may have expired. Please request a new one.' });

  }



  return JSON.stringify({ success: true });

}

