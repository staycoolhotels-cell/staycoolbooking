'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logActivity, createNotification } from './activity-actions';
import { createClient } from '@supabase/supabase-js'; // Import createClient for admin client
import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS, getHostProperties } from './data-service';
import { Property } from './types';

const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// Temporarily create an admin client to bypass RLS for storage uploads for debugging.
// WARNING: Do NOT use this in production without careful consideration of security implications.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function addProperty(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  console.log("Is Authenticated:", !!session);
  console.log("User ID:", session?.user?.id);

  if (!session?.user) {
    return { error: 'User not authenticated.' };
  }

  const host_id = session.user.id;

  // Extract property data from FormData
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;
  const tier = formData.get('tier') as string;
  const description = formData.get('description') as string;
  const price_per_night = parseFloat(formData.get('price_per_night') as string);
  const weekendPrice = parseFloat(formData.get('weekendPrice') as string);
  const type = formData.get('type') as string;
  const capacity = parseInt(formData.get('capacity') as string);
  const bedrooms = parseInt(formData.get('bedrooms') as string);
  const bathrooms = parseInt(formData.get('bathrooms') as string);
  const max_guests = parseInt(formData.get('max_guests') as string);
  const cancellationPolicy = formData.get('cancellationPolicy') as string;
  const amenities = JSON.parse(formData.get('amenities') as string || '[]'); // Assuming amenities come as a JSON string
  const rules = JSON.parse(formData.get('rules') as string || '[]'); // Assuming rules come as a JSON string

  // Handle images
  const imageFiles = formData.getAll('images') as File[];
  const imageUrls: Array<{ url: string; alt: string }> = [];
  const imageUploadErrors: string[] = [];

  for (const imageFile of imageFiles) {
    if (imageFile.size > 0) {
      const filePath = `${host_id}/${name}/images/${Date.now()}-${imageFile.name}`;
      // Use supabaseAdmin for storage upload to bypass RLS
      const { data, error } = await supabaseAdmin.storage
        .from('images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        imageUploadErrors.push(`Failed to upload image ${imageFile.name}: An unexpected error occurred.`);
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage.from('images').getPublicUrl(filePath);
        imageUrls.push({ url: publicUrlData.publicUrl, alt: name });
      }
    }
  }

  // Handle documents
  const licenseFile = formData.get('license_file') as File;
  const taxBillFile = formData.get('tax_bill_file') as File;
  const currentBillFile = formData.get('current_bill_file') as File;

  let license_url = '';
  let tax_bill_url = '';
  let current_bill_url = '';
  const documentUploadErrors: string[] = [];

  const uploadDocument = async (file: File, folder: string): Promise<string> => {
    if (file && file.size > 0) {
      const filePath = `${host_id}/${name}/documents/${folder}/${Date.now()}-${file.name}`;
      // Use supabaseAdmin for storage upload to bypass RLS
      const { data, error } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        documentUploadErrors.push(`Failed to upload ${folder} document: An unexpected error occurred.`);
        return '';
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage.from('documents').getPublicUrl(filePath);
        return publicUrlData.publicUrl;
      }
    }
    return '';
  };

  license_url = await uploadDocument(licenseFile, 'license');
  tax_bill_url = await uploadDocument(taxBillFile, 'tax_bill');
  current_bill_url = await uploadDocument(currentBillFile, 'current_bill');


  if (imageUploadErrors.length > 0 || documentUploadErrors.length > 0) {
    return { error: 'Failed to upload some files. Please try again.', imageUploadErrors, documentUploadErrors };
  }

  const { data, error } = await supabase
    .from('properties')
    .insert([
      {
        host_id,
        name,
        location,
        tier,
        description,
        price_per_night,
        weekendPrice,
        type,
        capacity,
        bedrooms,
        bathrooms,
        max_guests,
        cancellationPolicy,
        amenities,
        rules,
        license_url,
        tax_bill_url,
        current_bill_url,
        images: imageUrls,
        status: 'pending' // New properties start as pending
      },
    ])
    .select();

  if (error) {
    console.error('Error adding property:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  if (data && data.length > 0) {
    await logActivity('new_property', `New property added: ${name}`, host_id);
    await createNotification(
      'new_property',
      'Property Approval Request',
      `A new property "${name}" was submitted and is pending approval.`,
      'warning'
    );

    // Invalidate caches
    revalidateTag(CACHE_TAGS.properties);
    revalidateTag(CACHE_TAGS.host_properties(host_id));
    revalidatePath('/homepage', 'page');
    revalidatePath('/', 'layout');
    revalidatePath('/property-listing/[id]', 'page');

    redirect('/host-dashboard'); // Redirect to host dashboard after successful addition
  }

  return { error: 'Failed to add property.' };
}

export async function fetchHostProperties(): Promise<Property[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use the cached data service
  return getHostProperties(user.id);
}

export const createProperty = async (propertyData: Omit<Property, 'id' | 'created_at' | 'host_id' | 'status'>) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('properties')
    .insert([
      {
        ...propertyData,
        host_id: user.id,
        status: 'pending', // Explicitly set status to pending
      },
    ])
    .select();

  if (error) {
    console.error('Error creating property:', error);
    return null;
  }

  await createNotification(
    'new_property',
    'Property Approval Request',
    `A new property was created and is pending approval.`,
    'warning'
  );

  // Invalidate caches
  revalidateTag(CACHE_TAGS.properties);
  if (user.id) revalidateTag(CACHE_TAGS.host_properties(user.id));
  revalidatePath('/homepage', 'page');
  revalidatePath('/', 'layout');
  revalidatePath('/property-listing/[id]', 'page');


  return data;
};

export const updatePropertyPrice = async (propertyId: string, suggestedPrice: number) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // 1. Manually verify ownership since RLS/RPC is having issues with current schema
  const { data: propData, error: propError } = await supabaseAdmin
    .from('properties')
    .select('host_id')
    .eq('id', propertyId)
    .single();

  if (propError || !propData) {
    console.error('Error verifying property ownership:', propError);
    throw new Error('Property not found or unauthorized access');
  }

  if (propData.host_id !== user.id) {
    console.error('Unauthorized price update attempt:', { userId: user.id, hostId: propData.host_id });
    throw new Error('Unauthorized: You do not own this property');
  }

  // 2. Perform the update using admin client to bypass restrictive/buggy RLS
  const { data, error } = await supabaseAdmin
    .from('properties')
    .update({ price_per_night: suggestedPrice })
    .eq('id', propertyId)
    .select();

  if (error) {
    console.error('Error updating property price via admin:', error);
    throw new Error('An unexpected error occurred. Please try again.');
  }

  // Invalidate caches
  revalidateTag(CACHE_TAGS.properties);
  if (user.id) revalidateTag(CACHE_TAGS.host_properties(user.id));
  revalidatePath('/homepage', 'page');
  revalidatePath('/', 'layout');
  revalidatePath('/property-listing/[id]', 'page');


  return { success: true, data };
};