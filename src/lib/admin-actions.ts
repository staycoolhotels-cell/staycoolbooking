'use server';

import { createClient } from '@supabase/supabase-js';
import { logActivity, createNotification } from './activity-actions';
import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS } from './data-service';

type Profile = {
  id: string;
  role: 'guest' | 'host' | 'admin';
  status: 'pending' | 'active' | 'rejected' | 'suspended' | 'approved_host';
  created_at: string;
  updated_at: string;
};

/**
 * Creates a Supabase client with service_role privileges for server-side admin actions.
 * USES @supabase/supabase-js to ensure NO cookies/user sessions are involved, strictly server-side admin.
 */
export const createAdminSupabaseClient = async () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

export async function getUsersData() {
  const supabase = await createAdminSupabaseClient();
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return users;
}

/**
 * Updates a user's status and role in the database using service_role privileges.
 */
export async function updateUserStatusAndRoleAsAdmin(
  userId: string,
  status: Profile['status'],
  role: Profile['role']
) {
  const supabase = await createAdminSupabaseClient();

  // SINGLE-ADMIN ENFORCEMENT: Block promoting any user to 'admin' role
  if (role === 'admin') {
    // Check if another admin already exists
    const { data: existingAdmins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');
    const otherAdmin = existingAdmins?.find(a => a.id !== userId);
    if (otherAdmin) {
      return { success: false, error: 'Only one admin is allowed. Another admin already exists.' };
    }
    return { success: false, error: 'Admin role cannot be assigned via User Management. Use the admin-init setup.' };
  }

  const updatePayload: Partial<Profile> = { status, role };

  const { data, error } = await supabase.from('users').update(updatePayload).eq('id', userId);

  if (error) {
    console.error('Error updating user status/role as admin:', error);
    return { success: false, error: `Database Error: ${error.message}` };
  }

  await logActivity('user_action', `User ${userId} status changed to ${status} and role to ${role}`, userId, 'User Updated', 'info');

  // Sync-heal Auth Metadata: Keep auth metadata in sync so the UI/middleware reflects the new role/status instantly
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role, status }
  });
  if (authError) {
    console.warn('updateUserStatusAndRoleAsAdmin: Failed to update auth metadata:', authError.message);
  }

  return { success: true, data };

}

/**
 * Deletes a user from the auth schema using service_role privileges.
 * Performs a comprehensive cascade delete of all user-related data in public tables
 * to prevent database constraint violations.
 */
export async function deleteUserAsAdmin(userId: string) {
  const supabase = await createAdminSupabaseClient();

  try {
    // 1. Fetch properties owned by the user (if host) to clean up properties & rooms & blocks
    const { data: userProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('host_id', userId);
    
    const propertyIds = userProperties?.map(p => p.id) || [];

    // 2. Clean up child references first to avoid FK constraints violations
    if (propertyIds.length > 0) {
      // Clean up reviews on these properties
      await supabase.from('reviews').delete().in('property_id', propertyIds);
      
      // Clean up booking rooms & bookings on these properties
      const { data: bookings } = await supabase.from('bookings').select('id').in('property_id', propertyIds);
      const bookingIds = bookings?.map(b => b.id) || [];
      if (bookingIds.length > 0) {
        await supabase.from('booking_rooms').delete().in('booking_id', bookingIds);
      }
      await supabase.from('bookings').delete().in('property_id', propertyIds);
      
      // Clean up blocked dates & rooms & properties
      await supabase.from('blocked_dates').delete().in('property_id', propertyIds);
      await supabase.from('rooms').delete().in('property_id', propertyIds);
      await supabase.from('properties').delete().in('id', propertyIds);
    }

    // 3. Clean up user's own bookings & personal records
    await supabase.from('bookings').delete().eq('guest_id', userId);
    await supabase.from('user_personal_info').delete().eq('user_id', userId);
    await supabase.from('host_kyc_details').delete().eq('user_id', userId);
    await supabase.from('verifications').delete().eq('user_id', userId);
    await supabase.from('reviews').delete().eq('guest_id', userId);
    await supabase.from('activities').delete().eq('user_id', userId);
    
    // Attempt deleting notifications if table exists
    const { error: notifError } = await supabase.from('notifications').delete().eq('user_id', userId);
    if (notifError) {
      // Fallback in case columns differ
      await supabase.from('notifications').delete().eq('recipient_id', userId);
    }

    // 4. Delete the profile from public.users table
    const { error: dbError } = await supabase.from('users').delete().eq('id', userId);
    if (dbError) {
      console.warn('DB delete public.users warning:', dbError.message);
    }

    // 5. Finally, delete the Auth User
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      const isNotFound = authError.message?.toLowerCase().includes('not found') || authError.status === 404;
      if (!isNotFound) {
        console.error('Error deleting user from Auth:', authError);
        return { success: false, error: `Auth Error: ${authError.message}` };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in deleteUserAsAdmin:', err);
    return { success: false, error: err.message || 'Unexpected delete error' };
  }
}

/**
 * General update for a user in the database using service_role privileges.
 */
export async function updateUserDetailsAsAdmin(userId: string, updatedFields: Partial<Profile>) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from('users').update(updatedFields).eq('id', userId);

  if (error) {
    console.error('Error updating user details as admin:', error);
    return { success: false, error: `Database Error: ${error.message}` };
  }
  await logActivity('user_action', `User ${userId} details have been updated.`, userId, 'User Updated', 'info');

  // Sync auth metadata if role or status is updated
  if (updatedFields.role || updatedFields.status) {
    const metaUpdate: Record<string, any> = {};
    if (updatedFields.role) metaUpdate.role = updatedFields.role;
    if (updatedFields.status) metaUpdate.status = updatedFields.status;
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metaUpdate
    });
  }

  return { success: true, data };

}

/**
 * Approves a host in the database using service_role privileges.
 * Uses a multi-layer approach to ensure the status is permanently set to 'active'.
 */
export async function approveHost(userId: string) {
  const supabase = await createAdminSupabaseClient();

  // LAYER 1: Try RPC function first (SECURITY DEFINER — bypasses all RLS)
  // Requires DEFINITIVE_APPROVE_HOST_FIX.sql to have been run in Supabase.
  const { error: rpcError } = await supabase.rpc('approve_host', { p_user_id: userId });

  if (rpcError) {
    console.warn('approveHost: RPC failed (will fallback to direct update):', rpcError.message);
  }

  // LAYER 2: Direct table update (always run, regardless of RPC result)
  const { data, error: updateError } = await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', userId)
    .select('id, status, role');

  if (updateError) {
    console.error('approveHost: Direct update failed:', updateError);
    // Try upsert as last resort (if row doesn't exist yet)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user) {
      const { error: upsertError } = await supabase.from('users').upsert({
        id: userId,
        email: authUser.user.email,
        name: authUser.user.user_metadata?.name || 'Host',
        role: 'host',
        status: 'active',
      }, { onConflict: 'id' });
      if (upsertError) {
        return { success: false, error: 'DB update and upsert both failed: ' + upsertError.message };
      }
    } else {
      return { success: false, error: 'DB update failed: ' + updateError.message };
    }
  }

  // LAYER 3: Update auth metadata — so login sync-heal also works as backup
  const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { status: 'active', role: 'host' }
  });
  if (metaError) {
    console.warn('approveHost: Failed to update auth metadata (non-fatal):', metaError.message);
  }

  // LAYER 4: VERIFY — Read back the status to confirm it was saved
  const { data: verifyData, error: verifyError } = await supabase
    .from('users')
    .select('status')
    .eq('id', userId)
    .single();

  if (verifyError || !verifyData) {
    console.error('approveHost: Verification read failed:', verifyError);
    // Still return success if updates didn't error — verification might fail due to RLS
  } else if (verifyData.status !== 'active') {
    console.error('approveHost: CRITICAL — status is still:', verifyData.status, 'for user:', userId);
    // Try one more direct update with no conditions
    await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId);
  } else {
    console.info('✅ approveHost: Verified status=active for user:', userId);
  }

  await logActivity('host_approval', `Host ${userId} has been approved.`, userId, 'Host Approved', 'success');
  await createNotification(
    'host_approval',
    '🎉 Host Account Approved!',
    'Congratulations! Your StayCool Host application has been approved by admin. You can now list properties and accept guests.',
    'success',
    userId,
    'host',
    '/host-dashboard'
  );
  return { success: true, data };
}




/**
 * Rejects a host in the database using service_role privileges.
 */
export async function rejectHost(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .update({ status: 'rejected' })
    .eq('id', userId);

  if (error) {
    console.error('Error rejecting host as admin:', error);
    return { success: false, error: `Database Error: ${error.message}` };
  }
  await logActivity('host_approval', `Host ${userId} has been rejected.`, userId, 'Host Rejected', 'error');
  return { success: true, data };
}

/**
 * Rejects a host with a reason in the database using service_role privileges.
 */
// Rejects a host with a reason in the database using service_role privileges.
export async function rejectHostWithReason(userId: string, reason: string) {
  const supabase = await createAdminSupabaseClient();

  // 1. Try to save reason to Auth Metadata (Safe fallback)
  const { error: metaError } = await supabase.auth.admin.updateUserById(
    userId,
    { user_metadata: { rejection_reason: reason } }
  );
  if (metaError) {
    console.warn('Failed to update rejection reason in metadata:', metaError);
  }

  // 2. Try updating public profile WITH column
  const { data, error } = await supabase
    .from('users')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', userId);

  if (error) {
    // Check if error is due to missing column (Postgres code 42703 usually, but message check is safer here)
    if (error.message?.includes('column') && error.message?.includes('rejection_reason')) {
      console.warn('rejection_reason column missing, falling back to status-only update.');

      // 3. Fallback: Update ONLY status
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', userId);

      if (fallbackError) {
        console.error('Error rejecting host (fallback status-only):', fallbackError);
        return { success: false, error: `Database Error (Fallback): ${fallbackError.message}` };
      }
      return { success: true, data: fallbackData };
    }

    console.error('Error rejecting host with reason as admin:', error);
    return { success: false, error: `Database Error: ${error.message}` };
  }

  await logActivity('host_approval', `Host ${userId} has been rejected. Reason: ${reason}`, userId, 'Host Rejected', 'error');
  await createNotification(
    'host_approval',
    'Host Application Update',
    `Your host application was not approved. Reason: ${reason}`,
    'error',
    userId,
    'host',
    '/host-dashboard'
  );
  return { success: true, data };
}


/**
 * Suspends a user in the database using service_role privileges.
 */
export async function suspendUserAsAdmin(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .update({ status: 'suspended' })
    .eq('id', userId);

  if (error) {
    console.error('Error suspending user as admin:', error);
    return { success: false, error: `Database Error: ${error.message}` };
  }
  await logActivity('user_action', `User ${userId} has been suspended.`, userId, 'User Suspended', 'warning');
  return { success: true, data };
}

/**
 * Approves a guest in the database using service_role privileges.
 */
export async function autoApproveGuest(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', userId);

  if (error) {
    console.error('Error approving guest as admin:', error);
    return { success: false, error: `Database Error: ${error.message}` };
  }
  await logActivity('user_action', `Guest ${userId} has been approved.`, userId, 'Guest Approved', 'success');
  return { success: true, data };
}


/**
 * Updates a property's status in the database using service_role privileges.
 */
export async function updatePropertyStatusAsAdmin(propertyId: string, status: 'pending' | 'active' | 'rejected') {
  const supabase = await createAdminSupabaseClient();

  let targetStatus: string = status;
  let isKycActive = true;
  if (status === 'active') {
    // 1. Fetch host_id
    const { data: prop } = await supabase
      .from('properties')
      .select('host_id')
      .eq('id', propertyId)
      .single();

    if (prop) {
      // 2. Fetch KYC status
      const { data: kycDetails } = await supabase
        .from('host_kyc_details')
        .select('kyc_status')
        .eq('user_id', prop.host_id)
        .maybeSingle();

      isKycActive = !!(kycDetails && kycDetails.kyc_status === 'activated');
      if (!isKycActive) {
        targetStatus = 'offline';
      }
    }
  }

  const { data, error } = await supabase
    .from('properties')
    .update({ status: targetStatus, updated_at: new Date().toISOString() }) // updated_at column exists
    .eq('id', propertyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating property status as admin:', error);
    return { success: false, error: `Database Error: ${error.message}` };
  }

  // Log activity
  await logActivity('property_review', `Property ${propertyId} status changed to ${targetStatus}`, undefined, `Property ${targetStatus === 'active' ? 'Activated' : targetStatus === 'offline' ? 'Placed Offline (Pending KYC)' : 'Rejected'}`, targetStatus === 'active' ? 'success' : targetStatus === 'offline' ? 'warning' : 'error');

  // Invalidate caches
  revalidateTag(CACHE_TAGS.properties);
  revalidatePath('/homepage', 'page');
  revalidatePath('/', 'layout');
  revalidatePath('/property-listing/[id]', 'page');

  return { success: true, data: data ? { ...data, kycPending: !isKycActive } : null };
}

export const approveProperty = async (propertyId: string) => {
  const supabase = await createAdminSupabaseClient();

  // 1. Fetch host_id
  const { data: prop, error: fetchError } = await supabase
    .from('properties')
    .select('host_id')
    .eq('id', propertyId)
    .single();

  if (fetchError || !prop) {
    console.error('Error fetching property to approve:', fetchError);
    return null;
  }

  // 2. Fetch KYC status
  const { data: kycDetails } = await supabase
    .from('host_kyc_details')
    .select('kyc_status')
    .eq('user_id', prop.host_id)
    .maybeSingle();

  const isKycActive = kycDetails && kycDetails.kyc_status === 'activated';
  const targetStatus = isKycActive ? 'active' : 'offline';

  const { data, error } = await supabase
    .from('properties')
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq('id', propertyId)
    .select()
    .single();

  if (error) {
    console.error('Error approving property:', error);
    return null;
  }

  // Log activity
  await logActivity(
    'property_review', 
    `Property ${propertyId} has been approved. Target status set to: ${targetStatus}`, 
    undefined, 
    targetStatus === 'active' ? 'Property Approved & Active' : 'Property Approved & Offline (KYC Pending)', 
    targetStatus === 'active' ? 'success' : 'warning'
  );

  // Invalidate caches
  revalidateTag(CACHE_TAGS.properties);
  revalidatePath('/homepage', 'page');
  revalidatePath('/', 'layout');
  revalidatePath('/property-listing/[id]', 'page');

  if (prop?.host_id) {
    await createNotification(
      'property_review',
      '🏡 Property Approved!',
      `Your property "${data?.title || 'Listing'}" has been approved by admin. Status: ${targetStatus}.`,
      'success',
      prop.host_id,
      'host',
      '/host-dashboard'
    );
  }

  return data ? { ...data, kycPending: !isKycActive } : null;
};


export const rejectProperty = async (propertyId: string, rejectionReason: string) => {
  const supabase = await createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'rejected', rejection_reason: rejectionReason, updated_at: new Date().toISOString() })
    .eq('id', propertyId)
    .select('host_id, title')
    .maybeSingle();

  if (error) {
    console.error('Error rejecting property:', error);
    return null;
  }

  // Log activity
  await logActivity('property_review', `Property ${propertyId} has been rejected. Reason: ${rejectionReason}`, undefined, 'Property Rejected', 'error');

  if (data?.host_id) {
    await createNotification(
      'property_review',
      'Property Application Update',
      `Your property "${data.title || 'Listing'}" was rejected. Reason: ${rejectionReason}`,
      'error',
      data.host_id,
      'host',
      '/host-dashboard'
    );
  }

  // Invalidate caches
  revalidateTag(CACHE_TAGS.properties);
  revalidatePath('/homepage', 'page');
  revalidatePath('/', 'layout');
  revalidatePath('/property-listing/[id]', 'page');

  return data || true;
};

/**
 * Recalculates and updates statistics for a specific user in the public.users table.
 * Metrics include: total_bookings, completion_percentage, and cancellation_count.
 */
export async function recalculateUserStats(userId: string) {
  const supabase = await createAdminSupabaseClient();

  // 1. Fetch data for calculation
  const [
    { count: totalBookings },
    { count: guestCancellations },
    { data: userProfile },
    { data: personalInfo },
    { data: verification }
  ] = await Promise.all([
    // Total Confirmed/Completed Bookings
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', userId)
      .in('status', ['confirmed', 'completed']),
    
    // Total Cancelled Bookings (where user was the guest)
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_id', userId)
      .eq('status', 'cancelled'),

    // User Profile
    supabase.from('users').select('name, email, avatar_url, phone').eq('id', userId).single(),

    // Personal Info
    supabase.from('user_personal_info').select('*').eq('user_id', userId).maybeSingle(),

    // Verification status
    supabase.from('verifications').select('status').eq('user_id', userId).eq('status', 'approved').maybeSingle()
  ]);

  // 2. Calculate Completion Percentage
  // Weights: Name(10), Email(10), Avatar(10), Phone(10), Bio(10), Location(10), DOB(10), Gender(10), KYC(20)
  let completion = 0;
  if (userProfile?.name) completion += 10;
  if (userProfile?.email) completion += 10;
  if (userProfile?.avatar_url) completion += 10;
  if (userProfile?.phone) completion += 10;
  
  if (personalInfo?.bio) completion += 10;
  if (personalInfo?.location) completion += 10;
  if (personalInfo?.date_of_birth || (personalInfo as any)?.dateOfBirth) completion += 10;
  if (personalInfo?.gender) completion += 10;
  
  if (verification) completion += 20;

  // 3. Update the Users Table
  const { error } = await supabase
    .from('users')
    .update({
      total_bookings: totalBookings || 0,
      completion_percentage: completion,
      // We don't overwrite cancellation_count here if it's primarily used for host penalties,
      // but we could store guest cancellations if needed. 
      // For now, let's just sync what's requested.
    })
    .eq('id', userId);

  if (error) {
    console.error(`Failed to update stats for user ${userId}:`, error);
  }
}

/**
 * Updates stats for all users in the database.
 */
export async function updateAllUserStats() {
  const supabase = await createAdminSupabaseClient();
  const { data: users } = await supabase.from('users').select('id');
  
  if (!users) return;

  console.log(`Starting batch update for ${users.length} users...`);
  for (const user of users) {
    await recalculateUserStats(user.id);
  }
  console.info('Batch update complete.');
}

/**
 * Fetches all users from public.users, but first ensures that any user in auth.users
 * also exists in public.users. This "heals" any missing trigger executions.
 */
export async function syncAndFetchUsers() {
  const supabase = await createAdminSupabaseClient();

  // 1. Fetch all Auth Users (Source of Truth for existence)
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
    // Fallback to just returning public users if auth fetch fails
    const { data: publicUsers } = await supabase.from('users').select('*');
    return publicUsers || [];
  }

  // 2. Fetch all Public Users
  const { data: publicUsers, error: publicError } = await supabase.from('users').select('*');

  if (publicError) {
    console.error('Error fetching public users:', publicError);
    return [];
  }

  // 3. Find users in Auth but missing in Public
  const missingUsers = authUsers.filter(au => !publicUsers?.some(pu => pu.id === au.id));

  if (missingUsers.length > 0) {
    console.info(`Found ${missingUsers.length} users missing in public.users. Syncing...`);

    // 4. Create profiles for missing users
    for (const user of missingUsers) {
      const role = user.user_metadata?.role || 'guest';
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const status = user.user_metadata?.status || 'active';

      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: name,
        role: role,
        status: status,
        avatar_url: user.user_metadata?.avatar_url || null
      }, { onConflict: 'id' });
    }
  }

  // 5. Fetch final list of public users
  const { data: finalPublicUsers } = await supabase.from('users').select('*');

  // 6. Enrich with metadata for rejection_reason (fallback)
  const enrichedUsers = (finalPublicUsers || []).map(user => {
    const authUser = authUsers.find(au => au.id === user.id);
    return {
      ...user,
      rejection_reason: user.rejection_reason || authUser?.user_metadata?.rejection_reason
    };
  });

  return enrichedUsers;
}



/**
 * Updates admin credentials (email/password/photo) in Supabase Auth.
 * Pre-ensures the admin record exists in public.users to avoid trigger INSERT failures.
 */
export async function updateAdminCredentials(userId: string, newEmail?: string, newPassword?: string, newAvatarUrl?: string) {
  const supabase = await createAdminSupabaseClient();

  // 1. Fetch current auth user
  const { data: { user: currentUser }, error: fetchError } = await supabase.auth.admin.getUserById(userId);
  if (fetchError || !currentUser) {
    console.error('[updateAdminCredentials] getUserById failed:', fetchError);
    return { success: false, error: 'Could not look up admin user. Check your service role key.' };
  }

  const emailChanged = !!newEmail && newEmail.trim() !== currentUser.email;

  // 2. Nothing to do?
  if (!emailChanged && !newPassword && !newAvatarUrl) {
    return { success: false, error: 'No changes detected. Enter a new email, password, or photo.' };
  }

  // 3. If email is changing, verify it's not already taken by another user
  if (emailChanged) {
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const conflict = allUsers?.find(u => u.email === newEmail!.trim() && u.id !== userId);
    if (conflict) {
      return { success: false, error: `The email "${newEmail!.trim()}" is already in use by another account. Please choose a different email.` };
    }
  }

  // 4. PRE-ENSURE admin record exists in public.users (so trigger takes ON CONFLICT UPDATE path)
  await supabase.from('users').upsert({
    id: userId,
    email: currentUser.email,
    name: currentUser.user_metadata?.name || 'Admin',
    role: 'admin',
    status: 'active',
    avatar_url: currentUser.user_metadata?.avatar_url || null,
  }, { onConflict: 'id' });

  // 5. Build minimal auth update (never include user_metadata — avoids trigger edge cases)
  const authUpdate: Record<string, string | boolean> = {};
  if (emailChanged) {
    authUpdate.email = newEmail!.trim();
    authUpdate.email_confirm = true;
  }
  if (newPassword) {
    authUpdate.password = newPassword;
  }

  // 6. Call Supabase Auth Admin API
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, authUpdate);
  if (authError) {
    console.error('[updateAdminCredentials] updateUserById failed:', JSON.stringify(authError));
    if (authError.status === 500 || authError.code === 'unexpected_failure') {
      return { success: false, error: 'Database error during update. Please run FIX_ADMIN_UPDATE_TRIGGER.sql in your Supabase SQL Editor, then try again.' };
    }
    return { success: false, error: `Update failed: ${authError.message}` };
  }

  // 7. Sync public.users
  const profileUpdate: Record<string, string> = {};
  if (emailChanged) profileUpdate.email = newEmail!.trim();
  if (newAvatarUrl) profileUpdate.avatar_url = newAvatarUrl;

  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from('users').update(profileUpdate).eq('id', userId);
  }

  // 8. Log activity
  await supabase.from('activities').insert({
    type: 'user_action',
    description: 'Admin updated their profile/credentials.',
    user_id: userId,
    title: 'Profile Updated',
    status: 'warning',
  });

  return { success: true };
}

/**
 * Updates a dispute's status in the database using service_role privileges.
 */
export async function updateDisputeStatusAsAdmin(disputeId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('disputes')
      .update({ status }) // Removed manual timestamp updates to avoid schema column errors; db triggers should handle it.
      .eq('id', disputeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating dispute status as admin:', error);
      return { success: false, error: `Database Error: ${error.message}` };
    }

    // Log activity
    await logActivity('user_action', `Dispute ${data?.case_number || data?.caseNumber || disputeId} status changed to ${status}`, undefined, `Dispute Updated`, 'info');

    // DO NOT return `data` to the client components. Supabase payload often contains non-serializable structures or Dates.
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in updateDisputeStatusAsAdmin:', err);
    return { success: false, error: `Unexpected Error: ${err.message || 'Unknown error'}` };
  }
}


/**
 * Fetches the KYC record for a specific host by their user_id.
 * Used in the property details page to show host KYC inline.
 */
export async function fetchHostKycByUserId(userId: string) {
  const supabase = await createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('host_kyc_details')
    .select(`
      id,
      user_id,
      legal_business_name,
      email,
      phone,
      pan_number,
      bank_account_number,
      bank_ifsc,
      bank_beneficiary_name,
      razorpay_account_id,
      razorpay_product_id,
      kyc_status,
      kyc_error_message,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('fetchHostKycByUserId error:', error);
    return null;
  }

  if (!data) return null;

  // Fetch host profile name
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .maybeSingle();

  return {
    ...data,
    host_name: user?.name || 'Unknown Host',
    host_email: user?.email || data.email,
  };
}

/**
 * Fetches all host KYC records joined with user profiles for the admin KYC Management page.
 */
export async function fetchHostKycList() {
  const supabase = await createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('host_kyc_details')
    .select(`
      id,
      user_id,
      legal_business_name,
      email,
      phone,
      pan_number,
      bank_account_number,
      bank_ifsc,
      bank_beneficiary_name,
      razorpay_account_id,
      razorpay_product_id,
      kyc_status,
      kyc_error_message,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchHostKycList error:', error);
    return [];
  }

  const userIds = (data || []).map((r: any) => r.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds);

  const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));

  return (data || []).map((record: any) => ({
    ...record,
    host_name: userMap[record.user_id]?.name || 'Unknown Host',
    host_email: userMap[record.user_id]?.email || record.email,
  }));
}

/**
 * Appends an admin message to the dispute description field, formatted as "ADMIN_MSG: message"
 */
export async function sendAdminMessageToHost(disputeId: string, message: string) {
  const supabase = await createAdminSupabaseClient();
  
  const { data: dispute, error: fetchError } = await supabase
    .from('disputes')
    .select('description')
    .eq('id', disputeId)
    .single();
    
  if (fetchError || !dispute) {
    return { success: false, error: 'Dispute not found' };
  }
  
  const parts = (dispute.description || '').split(' ||| ');
  const guestStatement = parts[0] || ' ';
  const hostResponse = parts[1] || ' ';
  
  // Ensure we have at least guest and host parts before appending admin
  let newDescription = `${guestStatement} ||| ${hostResponse}`;
  if (parts.length > 2) {
      newDescription += ' ||| ' + parts.slice(2).join(' ||| ');
  }
  newDescription += ` ||| ADMIN_MSG: ${message}`;
  
  const { error: updateError } = await supabase
    .from('disputes')
    .update({ 
        description: newDescription,
        "lastUpdate": new Date().toISOString()
    })
    .eq('id', disputeId);
    
  if (updateError) {
    return { success: false, error: updateError.message };
  }
  
  // Also log activity
  await logActivity('user_action', `Sent message to host on Dispute ${disputeId}`, undefined, 'Admin Message Sent', 'info');
  return { success: true };
}

/**
 * Fetches single booking details using service_role to bypass RLS.
 * Used for real-time updates in the Admin Panel Financials.
 */
export async function fetchBookingDetailsAsAdmin(bookingId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      guest:users!guest_id ( name, email ),
      property:properties!property_id ( 
        title,
        room_type_prices,
        host:users!host_id ( name )
      ),
      booking_rooms(rooms(room_type))
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('fetchBookingDetailsAsAdmin error:', error);
    return null;
  }

  // Also fetch guest location
  if (data?.guest_id) {
    const { data: personalInfo } = await supabase
      .from('user_personal_info')
      .select('location')
      .eq('user_id', data.guest_id)
      .maybeSingle();
    if (personalInfo?.location) {
      (data as any).guestLocation = personalInfo.location;
    }
  }

  return data;
}

/**
 * Fetches all support messages and user details using service_role.
 * Used for the Admin Panel Inbox to bypass RLS.
 */
export async function getAdminThreads() {
  const supabase = await createAdminSupabaseClient();
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*, sender:sender_id(id, name, role), receiver:receiver_id(id, name, role)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin threads:', error);
    return [];
  }

  return messages;
}

export async function renewHostSubscriptionAction(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Layer 1: Update users table
  const { data, error: updateError } = await supabase
    .from('users')
    .update({ 
      subscription_status: 'active',
      subscription_expiry: newExpiry
    })
    .eq('id', userId)
    .select('id, subscription_status, subscription_expiry');

  if (updateError) {
    console.error('renewHostSubscriptionAction: Direct update failed:', updateError);
    return { success: false, error: 'Database update failed: ' + updateError.message };
  }

  // Layer 2: Update auth user metadata
  const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { subscription_status: 'active', subscription_expiry: newExpiry }
  });
  if (metaError) {
    console.warn('renewHostSubscriptionAction: Failed to update auth metadata (non-fatal):', metaError.message);
  }

  // Log activity
  await logActivity('subscription_renewal', `Host ${userId} has renewed their subscription. Expiry set to ${newExpiry}`, userId, 'Subscription Renewed', 'success');

  // Revalidate path
  revalidatePath('/host-dashboard');

  return { success: true, expiry: newExpiry, data };
}

