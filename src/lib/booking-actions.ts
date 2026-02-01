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
export async function verifyUser(prevState: null | undefined, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const file = formData.get('document') as File;
  const fullName = formData.get('fullName') as string;

  if (!file || !fullName) {
    throw new Error('Full name and document are required.');
  }

  const { data: fileData, error: fileError } = await supabase.storage
    .from('documents')
    .upload(`${user.id}/${file.name}`, file);

  if (fileError) {
    throw fileError;
  }

  const { data, error } = await supabase
    .from('verifications')
    .insert([{ user_id: user.id, doc_type: 'id', file_url: fileData.path, status: 'pending' }]);

  if (error) {
    throw error;
  }

  await logActivity('user_verification', `User ${user.id} submitted a document for verification.`);

  return data;
}

export async function createBooking(bookingDetails: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  guests: number;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  const status = profile.role === 'host' ? 'pending' : 'confirmed';

  const { propertyId, checkIn, checkOut, totalPrice, guests } = bookingDetails;

  const { data, error } = await supabase.from('bookings').insert([
    {
      guest_id: user.id,
      property_id: propertyId,
      check_in: checkIn,
      check_out: checkOut,
      total_price: totalPrice,
      guests: guests,
      status: status,
    },
  ]);

  if (error) {
    throw error;
  }

  return data;
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
