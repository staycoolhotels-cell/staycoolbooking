'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './data-service';

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
import { createServiceClient } from './supabase-server';
import { getGeminiModel } from './gemini';

export async function processIdDocument(formData: FormData) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('OCR Error: GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables.');
      return { error: 'Verification service is currently unavailable.' };
    }

    const file = formData.get('document') as File;
    if (!file) {
      return { error: 'No document file provided.' };
    }

    console.log('Starting OCR processing for file:', file.name, file.type, file.size);

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;

    const model = getGeminiModel('gemini-1.5-flash'); 
    
    const prompt = `
      You are an expert OCR and identity verification assistant. 
      CRITICAL TASK: First, determine if the attached image is actually a government-issued ID card (specifically an Indian Aadhaar card).
      
      If the image is NOT an ID card (e.g., it is a hotel, a building, a landscape, food, a random person, or any non-document object), you MUST set "isValidId" to false.

      If it IS a valid ID card, extract:
      - "fullName": The full name of the person.
      - "idNumber": The Aadhaar number (12 digits, often formatted as XXXX XXXX XXXX).
      - "isBlurry": Boolean, true if the image is too blurry to read clearly.
      - "isFakeSuspected": Boolean, true if the document looks suspicious, edited, or is not an official ID.
      - "isValidId": Boolean, true ONLY if it is clearly a government ID card.
      - "confidence": Number between 0 and 1.

      Return the data in JSON format only.
    `;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    let text = response.text();
    console.log('Gemini raw response text length:', text.length);

    // Clean up markdown
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    const data = JSON.parse(text);
    console.log('OCR Data extracted successfully:', data.idNumber);
    return { success: true, data };
  } catch (err: any) {
    console.error('OCR Error:', err);
    return { error: `OCR Error: ${err.message || 'Unknown error'}` };
  }
}
//...
export async function verifyUser(_prevState: any, formData: FormData) {
  try {
    if (!formData) {
      console.error('VerifyUser Error: No FormData received.');
      return { error: 'No data received from the form.' };
    }
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'User not authenticated', redirect: '/auth' };
    }

    const file = formData.get('document') as File;
    const fullName = formData.get('fullName') as string;
    const ocrDataStr = formData.get('ocrData') as string;
    const ocrMetadata = ocrDataStr ? JSON.parse(ocrDataStr) : null;

    if (!file || !fullName) {
      return { error: 'Full name and document are required.' };
    }

    const adminSupabase = createServiceClient();

    // Convert file to ArrayBuffer for more reliable upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { data: fileData, error: fileError } = await adminSupabase.storage
      .from('documents')
      .upload(`${user.id}/${file.name}`, fileBuffer, { 
        upsert: true,
        contentType: file.type 
      });

    if (fileError) {
      console.error('Storage Upload Error:', fileError);
      return { error: `Storage Error: ${fileError.message}` };
    }

    // Check if verification record exists
    const { data: existingVerifications, error: fetchError } = await adminSupabase
      .from('verifications')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (fetchError) {
      console.error('Fetch Verification Error:', fetchError);
      return { error: `Database Error: ${fetchError.message}` };
    }

    const existingVerification = existingVerifications?.[0];

    let error;

    if (existingVerification) {
      // Update existing record
      const { error: updateError } = await adminSupabase
        .from('verifications')
        .update({ doc_type: 'id', file_url: fileData.path, status: 'pending' })
        .eq('user_id', user.id);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await adminSupabase
        .from('verifications')
        .insert([{ user_id: user.id, doc_type: 'id', file_url: fileData.path, status: 'pending' }]);
      error = insertError;
    }

    if (error) {
      console.error('Database Operation Error:', error);
      return { error: `Database Operation Error: ${error.message}` };
    }

    // Return success with simplified data
    const data = { success: true };

    await logActivity('user_verification', `User ${user.id} submitted a document for verification.${ocrMetadata?.idNumber ? ` OCR detected Aadhaar: ${ocrMetadata.idNumber}` : ''}`);

    return { success: true, data };
  } catch (err: any) {
    console.error('VerifyUser Action Error:', err);
    return { error: `Action Error: ${err.message || 'Unknown error'}` };
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
  selectedRoomIds?: string[];
  amenities?: Array<{ id: string; count: number; price: number; name: string }>;
  hasFreeCancellation?: boolean;
  freeCancellationFee?: number;
}, _prevState: any) {
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

    const { 
      propertyId, 
      checkIn, 
      checkOut, 
      totalPrice, 
      guests, 
      bookingType = 'single', 
      roomCount = 1, 
      amenities = [], 
      selectedRoomIds = [],
      hasFreeCancellation = false,
      freeCancellationFee = 0
    } = bookingDetails;

    // Use RPC to create booking and assign rooms atomically
    const rpcName = (selectedRoomIds && selectedRoomIds.length > 0) 
      ? 'create_booking_with_rooms' 
      : 'create_bulk_booking';

    const baseParams = {
      p_booking_type: bookingType,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guest_id: user.id,
      p_property_id: propertyId,
      p_total_price: totalPrice,
      p_has_free_cancellation: hasFreeCancellation,
      p_free_cancellation_fee: freeCancellationFee,
    };

    const rpcParams = (selectedRoomIds && selectedRoomIds.length > 0)
      ? {
          ...baseParams,
          p_room_ids: selectedRoomIds,
        }
      : {
          ...baseParams,
          p_room_count: roomCount,
        };

    const { data, error } = await supabase.rpc(rpcName, rpcParams);


    if (error) {
      console.error("Booking RPC Error:", error);
      return { error: `Booking Error: ${error.message}` };
    }

    // Process amenities for tracking
    if (amenities && amenities.length > 0) {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      for (const amenity of amenities) {
        // Try to find existing tracking record for this month
        const { data: existingTracking } = await supabase
          .from('amenity_tracking')
          .select('*')
          .eq('amenity_id', amenity.id)
          .eq('month', currentMonth)
          .maybeSingle();

        const addedRevenue = amenity.price * amenity.count;

        if (existingTracking) {
          // Update
          await supabase
            .from('amenity_tracking')
            .update({
              booking_count: (existingTracking.booking_count || 0) + amenity.count,
              revenue_generated: Number(existingTracking.revenue_generated || 0) + addedRevenue
            })
            .eq('id', existingTracking.id);
        } else {
          // Insert
          await supabase
            .from('amenity_tracking')
            .insert({
              amenity_id: amenity.id,
              booking_count: amenity.count,
              revenue_generated: addedRevenue,
              month: currentMonth
            });
        }
      }
    }

    // RPC returns booking UUID
    return { success: true, data: [{ id: data }] };

  } catch (err: any) {
    console.error("Booking Action Error:", err);
    return { error: `Booking Action Error: ${err.message || 'Unknown error'}` };
  }
}

export async function approveBooking(bookingId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // 1. Fetch booking and property to check ownership
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('property_id, properties!property_id(host_id)')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error('Booking not found');
  }

  if ((booking as any).properties?.host_id !== user.id) {
    throw new Error('Unauthorized: You are not the host of this property');
  }

  // 2. Perform the update with service client to bypass RLS hurdles
  const adminSupabase = await createServiceClient();
  const { data, error } = await adminSupabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId);

  if (error) {
    console.error('Approve booking error:', error);
    throw error;
  }
  revalidateTag(CACHE_TAGS.bookings);
  revalidatePath('/host-dashboard');
  return data;
}

export async function rejectBooking(bookingId: string) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Fetch booking to get host_id and ensure authorization
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, properties(host_id)')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error('Booking not found');
  }

  // Ensure user is authenticated and IS the host
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (booking as any).properties?.host_id !== user.id) {
    throw new Error('Unauthorized: You are not the host of this property');
  }

  // 2. Update booking status using service client
  const adminSupabase = await createServiceClient();
  const { error: updateError } = await adminSupabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (updateError) {
    throw updateError;
  }

  // 3. Increment host's cancellation count
  const hostId = (booking as any).properties?.host_id;
  if (hostId) {
    // We use a raw SQL increment because we don't want race conditions, 
    // but with RPC it's better. For now, since we might not have RPC, we'll do:
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('cancellation_count')
      .eq('id', hostId)
      .single();

    if (!userFetchError) {
      const currentCount = userData?.cancellation_count || 0;
      await supabase
        .from('users')
        .update({ cancellation_count: currentCount + 1 })
        .eq('id', hostId);
    }
  }

  revalidateTag(CACHE_TAGS.bookings);
  revalidatePath('/host-dashboard');
  return { success: true };
}

export async function resetCancellationPenalty() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('users')
    .update({ cancellation_count: 0 })
    .eq('id', user.id);

  if (error) {
    throw error;
  }

  revalidatePath('/host-dashboard');
  return { success: true };
}
