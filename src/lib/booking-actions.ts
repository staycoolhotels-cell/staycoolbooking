'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
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

import { logActivity } from './activity-actions';
//...
export async function verifyUser(prevState: any, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'User not authenticated', redirect: '/auth' };
    }

    const file = formData.get('document') as File;
    const fullName = formData.get('fullName') as string;

    if (!file || !fullName) {
      return { error: 'Full name and document are required.' };
    }

    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .upload(`${user.id}/${file.name}`, file, { upsert: true });

    if (fileError) {
      return { error: fileError.message };
    }

    // Check if verification record exists
    const { data: existingVerification } = await supabase
      .from('verifications')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let error;

    if (existingVerification) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('verifications')
        .update({ doc_type: 'id', file_url: fileData.path, status: 'pending' })
        .eq('user_id', user.id);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('verifications')
        .insert([{ user_id: user.id, doc_type: 'id', file_url: fileData.path, status: 'pending' }]);
      error = insertError;
    }

    if (error) {
      return { error: error.message };
    }

    // Return success with simplified data (since we didn't select * in update/insert consistently)
    const data = { success: true };

    await logActivity('user_verification', `User ${user.id} submitted a document for verification.`);

    return { success: true, data };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function createBooking(bookingDetails: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  guests: number;
  bookingType?: 'single' | 'bulk';
  roomCount?: number;
}, prevState: any) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'User not authenticated', redirect: '/auth' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { error: profileError.message };
    }

    const { propertyId, checkIn, checkOut, totalPrice, guests, bookingType = 'single', roomCount = 1 } = bookingDetails;

    // Use RPC to create booking and assign rooms atomically
    const { data, error } = await supabase.rpc('create_bulk_booking', {
      p_booking_type: bookingType,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guest_id: user.id,
      p_property_id: propertyId,
      p_room_count: roomCount,
      p_total_price: totalPrice,
    });

    if (error) {
      console.error("Booking RPC Error:", error);
      return { error: error.message };
    }

    // RPC returns booking UUID
    return { success: true, data: [{ id: data }] };

  } catch (err: any) {
    console.error("Booking Action Error:", err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function approveBooking(bookingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId);

  if (error) {
    throw error;
  }
  revalidatePath('/host-dashboard');
  return data;
}
