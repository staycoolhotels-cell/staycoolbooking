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
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
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

export async function addProperty(prevState: unknown, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  console.info("Is Authenticated:", !!session);
  console.info("User ID:", session?.user?.id);

  if (!session?.user) {
    return { error: 'User not authenticated.' };
  }

  const host_id = session.user.id;

  // Extract property data from FormData
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;
  const tier = (formData.get('tier') || formData.get('type')) as string;
  const description = formData.get('description') as string;
  const price_per_night = parseFloat(formData.get('price_per_night') as string || formData.get('price') as string) || 0;
  const weekend_price_per_night = parseFloat(formData.get('weekendPrice') as string) || parseFloat(formData.get('weekend_price_per_night') as string) || 0;
  const room_type = (formData.get('room_type') || formData.get('type')) as string || '';
  const bedrooms = parseInt(formData.get('bedrooms') as string) || 0;
  const bathrooms = parseFloat(formData.get('bathrooms') as string) || 0;
  const max_guests = parseInt(formData.get('max_guests') as string) || parseInt(formData.get('capacity') as string) || 0;
  const cancellation_policy = (formData.get('cancellation_policy') || formData.get('cancellationPolicy')) as string || 'Flexible';
  const amenities = JSON.parse(formData.get('amenities') as string || '[]'); // Assuming amenities come as a JSON string
  const rules = JSON.parse(formData.get('rules') as string || '[]'); // Assuming rules come as a JSON string

  // Handle images
  const imageFiles = formData.getAll('images') as File[];
  const imageUrls: Array<{ url: string; alt: string }> = [];
  const imageUploadErrors: string[] = [];
  const safePropertyName = (name || 'property')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'property';

  for (const imageFile of imageFiles) {
    if (imageFile.size > 0) {
      const cleanImgName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const filePath = `${host_id}/${safePropertyName}/images/${Date.now()}-${cleanImgName}`;
      // Use supabaseAdmin for storage upload to bypass RLS
      const arrayBuffer = await imageFile.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabaseAdmin.storage
        .from('images')
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
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
  const aadharFile = formData.get('aadhar') as File;
  const panFile = formData.get('pan') as File;
  const nocFile = formData.get('noc') as File;

  let license_url = '';
  let tax_bill_url = '';
  let current_bill_url = '';
  let aadhar_url = '';
  let pan_url = '';
  let noc_url = '';
  const documentUploadErrors: string[] = [];

  const uploadDocument = async (file: File, folder: string): Promise<string> => {
    if (file && file.size > 0) {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const filePath = `${host_id}/${safePropertyName}/documents/${folder}/${Date.now()}-${cleanFileName}`;
      // Use supabaseAdmin for storage upload to bypass RLS
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
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
  aadhar_url = await uploadDocument(aadharFile, 'aadhar');
  pan_url = await uploadDocument(panFile, 'pan');
  noc_url = await uploadDocument(nocFile, 'noc');


  if (imageUploadErrors.length > 0 || documentUploadErrors.length > 0) {
    return { error: 'Failed to upload some files. Please try again.', imageUploadErrors, documentUploadErrors };
  }

  const { data, error } = await supabase
    .from('properties')
    .insert([
      {
        host_id,
        name,
        title: name,
        location,
        tier,
        description,
        price_per_night,
        weekend_price_per_night,
        room_type,
        bedrooms,
        bathrooms,
        max_guests,
        cancellation_policy,
        amenities,
        rules,
        license_url,
        tax_bill_url,
        current_bill_url,
        aadhar_url,
        pan_url,
        noc_url,
        images: imageUrls,
        standard_price: price_per_night,
        // Host listings are automatically approved and immediately available.
        status: 'active'
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
      '🏡 Property Published',
      `Your property "${name}" has been published and is now live!`,
      'success',
      host_id,
      'host',
      '/host-dashboard'
    );
    await createNotification(
      'new_property',
      '📋 New Property Listed',
      `Host added a new property "${name}".`,
      'info',
      null,
      'admin',
      '/admin-panel'
    );

    // Invalidate caches
    revalidateTag(CACHE_TAGS.properties);
    revalidateTag(CACHE_TAGS.host_properties(host_id));
    revalidatePath('/homepage', 'page');
    revalidatePath('/', 'layout');
    revalidatePath('/property-listing/[id]', 'page');

    // Keep new hosts in the onboarding panel until Banking & KYC is complete.
    redirect('/host-onboarding?property-created=1');
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
        standard_price: propertyData.price_per_night || propertyData.price,
        // Keep this alternate creation path consistent with the API route.
        status: 'active',
      },
    ])
    .select();

  if (error) {
    console.error('Error creating property:', error);
    return null;
  }

  await createNotification(
    'new_property',
    '🏡 Property Published',
    `Your new property was published and is now live!`,
    'success',
    user.id,
    'host',
    '/host-dashboard'
  );
  await createNotification(
    'new_property',
    '📋 New Property Listed',
    `A new property was listed by host.`,
    'info',
    null,
    'admin',
    '/admin-panel'
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

export const updatePropertyRoomTypePrice = async (propertyId: string, roomType: string, suggestedPrice: number) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // 1. Manually verify ownership
  const { data: propData, error: propError } = await supabaseAdmin
    .from('properties')
    .select('host_id, room_types, room_type_prices')
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

  // 2. Perform the update using admin client to update the room type price
  const currentPrices = propData.room_type_prices || {};
  const updatedPrices = {
    ...currentPrices,
    [roomType]: suggestedPrice.toString()
  };

  // Find minimum price of active room types to update price_per_night and standard_price
  const propRoomTypes = (propData as any).room_types;
  const activeRoomTypes = Array.isArray(propRoomTypes) && propRoomTypes.length > 0
    ? propRoomTypes
    : Object.keys(updatedPrices);
  const pricesList = activeRoomTypes
    .map((rt: string) => parseFloat(String(updatedPrices[rt])) || 0)
    .filter((p: number) => p > 0);
  const minPrice = pricesList.length > 0 ? Math.min(...pricesList) : 0;

  const updateFields: any = {
    room_type_prices: updatedPrices
  };

  if (minPrice > 0) {
    updateFields.price_per_night = minPrice;
    updateFields.standard_price = minPrice;
  }

  const { data, error } = await supabaseAdmin
    .from('properties')
    .update(updateFields)
    .eq('id', propertyId)
    .select();

  if (error) {
    console.error('Error updating property room type price via admin:', error);
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


export const deleteProperty = async (propertyId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Use admin client to bypass restrictive RLS or ensure host_id matches
  // We first verify ownership
  const { data: propData, error: propError } = await supabaseAdmin
    .from('properties')
    .select('host_id')
    .eq('id', propertyId)
    .single();

  if (propError || !propData) {
    return { success: false, error: 'Property not found' };
  }

  if (propData.host_id !== user.id) {
    return { success: false, error: 'Unauthorized deletion attempt' };
  }

  // Delete the property
  const { error } = await supabaseAdmin
    .from('properties')
    .delete()
    .eq('id', propertyId);

  if (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: error.message };
  }

  // Invalidate caches
  revalidateTag(CACHE_TAGS.properties);
  if (user.id) revalidateTag(CACHE_TAGS.host_properties(user.id));
  revalidatePath('/homepage', 'page');
  revalidatePath('/', 'layout');
  revalidatePath('/property-listing/[id]', 'page');

  return { success: true };
};
