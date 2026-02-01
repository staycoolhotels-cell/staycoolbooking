'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logActivity } from './activity-actions';

type Profile = {
  id: string;
  role: 'guest' | 'host' | 'admin';
  status: 'pending' | 'active' | 'rejected' | 'suspended' | 'approved_host';
  created_at: string;
  updated_at: string;
};

/**
 * Creates a Supabase client with service_role privileges for server-side admin actions.
 */
const createAdminSupabaseClient = async () => {
  const cookieStore = await cookies(); // Needed for createServerClient, though service_role bypasses user context
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service_role key for admin actions
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
  const updatePayload: Partial<Profile> = { status, role };

  const { data, error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);

  if (error) {
    console.error('Error updating user status/role as admin:', error);
    return { success: false, error: error.message };
  }

  await logActivity('user_updated', `User ${userId} status changed to ${status} and role to ${role}`, userId);
  return { success: true, data };
}

/**
 * Deletes a user from the auth schema using service_role privileges.
 * WARNING: This performs a hard delete and will cascade to the profiles table.
 */
export async function deleteUserAsAdmin(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Error deleting user as admin:', error);
    return { success: false, error: error.message };
  }
  await logActivity('user_deleted', `User ${userId} has been deleted.`, userId);
  return { success: true };
}

/**
 * General update for a user in the database using service_role privileges.
 */
export async function updateUserDetailsAsAdmin(userId: string, updatedFields: Partial<Profile>) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from('profiles').update(updatedFields).eq('id', userId);

  if (error) {
    console.error('Error updating user details as admin:', error);
    return { success: false, error: error.message };
  }
  await logActivity('user_updated', `User ${userId} details have been updated.`, userId);
  return { success: true, data };
}

/**
 * Approves a host in the database using service_role privileges.
 */
export async function approveHost(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', userId);

  if (error) {
    console.error('Error approving host as admin:', error);
    return { success: false, error: error.message };
  }
  await logActivity('host_approved', `Host ${userId} has been approved.`, userId);
  return { success: true, data };
}

/**
 * Rejects a host in the database using service_role privileges.
 */
export async function rejectHost(userId: string) {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'rejected' })
      .eq('id', userId);
  
    if (error) {
      console.error('Error rejecting host as admin:', error);
      return { success: false, error: error.message };
    }
    await logActivity('host_rejected', `Host ${userId} has been rejected.`, userId);
    return { success: true, data };
  }

/**
 * Suspends a user in the database using service_role privileges.
 */
export async function suspendUserAsAdmin(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'suspended' })
    .eq('id', userId);

  if (error) {
    console.error('Error suspending user as admin:', error);
    return { success: false, error: error.message };
  }
  await logActivity('user_suspended', `User ${userId} has been suspended.`, userId);
  return { success: true, data };
}

/**
 * Approves a guest in the database using service_role privileges.
 */
export async function autoApproveGuest(userId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', userId);

  if (error) {
    console.error('Error approving guest as admin:', error);
    return { success: false, error: error.message };
  }
  await logActivity('guest_approved', `Guest ${userId} has been approved.`, userId);
  return { success: true, data };
}
  

/**
 * Updates a property's status in the database using service_role privileges.
 */
export async function updatePropertyStatusAsAdmin(propertyId: string, status: 'pending' | 'active' | 'rejected') {
  const supabase = await createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('properties')
    .update({ status: status, updated_at: new Date().toISOString() }) // updated_at column exists
    .eq('id', propertyId);

  if (error) {
    console.error('Error updating property status as admin:', error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity('property_status_update', `Property ${propertyId} status changed to ${status}`, null);

  return { success: true, data };
}

export const approveProperty = async (propertyId: string) => {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'active' })
    .eq('id', propertyId)
    .select();

  if (error) {
    console.error('Error approving property:', error);
    return null;
  }

  return data;
};

export const rejectProperty = async (propertyId: string, rejectionReason: string) => {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'rejected', rejection_reason: rejectionReason })
    .eq('id', propertyId)
    .select();

  if (error) {
    console.error('Error rejecting property:', error);
    return null;
  }

  return data;
};

