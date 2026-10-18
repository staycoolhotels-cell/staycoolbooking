'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './data-service';
import { razorpay } from './razorpay';
import { stripe } from './stripe';

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

import { logActivity, sendTargetedNotification } from './activity-actions';
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

    console.info('Starting OCR processing for file:', file.name, file.type, file.size);

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

    console.info('Sending request to Gemini...');
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
    console.info('Gemini raw response text length:', text.length);

    // Clean up markdown
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    const data = JSON.parse(text);
    console.info('OCR Data extracted successfully:', data.idNumber);
    return { success: true, data };
  } catch (err: any) {
    console.error('OCR Error:', err);
    return { error: `OCR Error: ${err.message || 'Unknown error'}` };
  }
}
//...
export async function verifyUser(_prevState: unknown, formData: FormData) {
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

    const file = formData.get('document') as File | null;
    const fullName = (formData.get('fullName') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const ocrDataStr = formData.get('ocrData') as string;
    const ocrMetadata = ocrDataStr ? JSON.parse(ocrDataStr) : null;

    if (!fullName) {
      return { error: 'Full name is required.' };
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return { error: 'Please enter a valid 10-digit mobile number.' };
    }

    const adminSupabase = createServiceClient();

    // 1. Update user profile with full name and phone number
    const updateData: { name: string; phone: string } = {
      name: fullName,
      phone: cleanPhone.length === 10 ? cleanPhone : phone
    };

    const { error: userUpdateError } = await adminSupabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (userUpdateError) {
      console.warn('Could not update users table profile:', userUpdateError.message);
    }

    // 2. If a document file was uploaded, handle upload optionally
    let fileUrl: string | null = null;
    if (file && typeof file === 'object' && (file as any).size > 0 && (file as any).name) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const { data: fileData, error: fileError } = await adminSupabase.storage
          .from('documents')
          .upload(`${user.id}/${file.name}`, fileBuffer, { 
            upsert: true,
            contentType: file.type 
          });

        if (!fileError && fileData?.path) {
          fileUrl = fileData.path;
        }
      } catch (fErr) {
        console.warn('Optional file upload skipped:', fErr);
      }
    }

    // 3. Check if verification record exists and mark as approved
    const { data: existingVerifications } = await adminSupabase
      .from('verifications')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const existingVerification = existingVerifications?.[0];
    if (existingVerification) {
      await adminSupabase
        .from('verifications')
        .update({ 
          doc_type: fileUrl ? 'id' : 'phone', 
          ...(fileUrl ? { file_url: fileUrl } : {}),
          status: 'approved' 
        })
        .eq('user_id', user.id);
    } else {
      await adminSupabase
        .from('verifications')
        .insert([{ 
          user_id: user.id, 
          doc_type: fileUrl ? 'id' : 'phone', 
          file_url: fileUrl, 
          status: 'approved' 
        }]);
    }

    await logActivity(
      'user_verification',
      `Guest ${user.id} verified contact info (Name: ${fullName}, Phone: ${cleanPhone}).${ocrMetadata?.idNumber ? ` OCR Aadhaar: ${ocrMetadata.idNumber}` : ''}`
    );

    return { success: true, data: { success: true } };
  } catch (err: unknown) {
    console.error('VerifyUser Action Error:', err);
    return { error: `Action Error: ${err instanceof Error ? err.message : 'Unknown error'}` };
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
  bulkBookingDiscount?: number;
  selectedRoomIds?: string[];
  amenities?: Array<{ id: string; count: number; price: number; name: string }>;
  hasFreeCancellation?: boolean;
  freeCancellationFee?: number;
  serviceFee?: number;
  fullName?: string;
  phone?: string;
}, _prevState: unknown) {
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
      bulkBookingDiscount = 0,
      amenities = [], 
      selectedRoomIds = [],
      hasFreeCancellation = false,
      freeCancellationFee = 0,
      serviceFee = 0,
      fullName,
      phone
    } = bookingDetails;

    // If guest provided full name or phone during verification step, update profile immediately
    if (fullName?.trim()) {
      try {
        const adminSupabase = createServiceClient();
        const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined;
        await adminSupabase.from('users').update({
          name: fullName.trim(),
          ...(cleanPhone && cleanPhone.length >= 10 ? { phone: cleanPhone } : {})
        }).eq('id', user.id);

        await adminSupabase.auth.admin.updateUserById(user.id, {
          user_metadata: { name: fullName.trim(), full_name: fullName.trim() }
        }).catch(() => {});
      } catch (profErr) {
        console.warn('Profile sync in createBooking skipped:', profErr);
      }
    }

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
      p_bulk_booking_discount: bulkBookingDiscount,
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

    // Update guests separately since RPC doesn't take guests parameter
    if (data && guests) {
      const adminSupabase = createServiceClient();
      await adminSupabase.from('bookings').update({ guests, service_fee: serviceFee }).eq('id', data);
      if (data && amenities && amenities.length > 0) {
        await supabase.from('activities').insert({
          type: 'booking_amenities',
          description: JSON.stringify({ bookingId: data, amenities }),
          user_id: user.id
        });
      }
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

  } catch (err: unknown) {
    console.error("Booking Action Error:", err);
    return { error: `Booking Action Error: ${err instanceof Error ? err.message : 'Unknown error'}` };
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

  // 3. Sync user stats (total bookings etc.)
  const { data: bookingData } = await adminSupabase
    .from('bookings')
    .select('guest_id')
    .eq('id', bookingId)
    .single();
  
  if (bookingData?.guest_id) {
    // We can't easily import from admin-actions here due to potential circular dependencies
    // so we'll do a direct update or call a shared utility if exists.
    // For now, let's just use the direct increment as it's safe.
    const { data: guestData } = await adminSupabase
      .from('users')
      .select('total_bookings')
      .eq('id', bookingData.guest_id)
      .single();
    
    if (guestData) {
      await adminSupabase
        .from('users')
        .update({ total_bookings: (guestData.total_bookings || 0) + 1 })
        .eq('id', bookingData.guest_id);
    }
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
      await adminSupabase
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

export async function getGuestVerification(guestId: string) {
  try {
    const adminSupabase = createServiceClient();
    const { data, error } = await adminSupabase
      .from('verifications')
      .select('file_url')
      .eq('user_id', guestId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data?.file_url) return { success: true, fileUrl: null };

    // Get signed URL
    const { data: signedData, error: signedError } = await adminSupabase.storage
      .from('documents')
      .createSignedUrl(data.file_url, 3600);

    if (signedError) throw signedError;

    return { success: true, fileUrl: signedData.signedUrl };
  } catch (err: any) {
    console.error('Error fetching guest verification:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Option B: Checks whether a booking is eligible for host payout split.
 * Split process occurs on check-in day at or after 09:00 PM (21:00 IST).
 * - If check_in date is strictly before today in IST, it is past due -> eligible.
 * - If check_in date is today in IST, eligible only if current time is >= 21:00 (09:00 PM).
 * - If check_in date is in the future in IST, not eligible yet.
 */
export async function isEligibleForCheckInPayout(checkInDateStr: string): Promise<boolean> {
  const now = new Date();
  
  const istDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const istHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    }).format(now),
    10
  );

  if (checkInDateStr < istDateStr) {
    return true;
  }

  if (checkInDateStr === istDateStr) {
    return istHour >= 21;
  }

  return false;
}

export async function processCheckInAndPayout(bookingId: string, adminSupabase: any) {
  // 1. Fetch booking with property host info
  const { data: booking, error: bookingError } = await adminSupabase
    .from('bookings')
    .select('*, properties(host_id)')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    console.error('[CheckIn] Booking fetch error:', bookingError);
    return { error: 'Booking not found' };
  }

  const hostId = (booking as any).properties?.host_id;

  if (booking.status !== 'confirmed' && booking.status !== 'checked_in') {
    return { error: `Cannot check in. Booking status is: ${booking.status}` };
  }

  // If already checked in, check if the payout transfer has already been settled
  if (booking.status === 'checked_in') {
    const { data: existingTransfer } = await adminSupabase
      .from('payment_transfers')
      .select('transfer_status')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingTransfer?.transfer_status === 'settled') {
      return { success: true, message: 'Already checked in and payout already settled.' };
    }
  }

  // 2. Perform status update to 'checked_in' if not already
  if (booking.status === 'confirmed') {
    const { error: updateError } = await adminSupabase
      .from('bookings')
      .update({ status: 'checked_in' })
      .eq('id', bookingId);

    if (updateError) {
      console.error('[CheckIn] Failed to update booking status:', updateError);
      return { error: 'Failed to update booking status' };
    }

    // Automated notifications for Guest and Host upon Check-in
    try {
      const bookingRef = `#${bookingId.slice(0, 8).toUpperCase()}`;
      if (booking.guest_id) {
        await sendTargetedNotification({
          type: 'booking',
          title: '🏨 Welcome & Checked In!',
          message: `You are now checked in for reservation ${bookingRef}. Have a wonderful stay!`,
          status: 'success',
          userId: booking.guest_id,
          targetRole: 'guest',
          url: '/user-profile',
        });
      }
      if (hostId) {
        await sendTargetedNotification({
          type: 'booking',
          title: '✅ Guest Checked In',
          message: `Guest has checked in for booking ${bookingRef}. Host payout will process at 09:00 PM.`,
          status: 'info',
          userId: hostId,
          targetRole: 'host',
          url: '/host-dashboard',
        });
      }
    } catch (notifErr) {
      console.error('CheckIn notification error:', notifErr);
    }
  }

  // 3. Option B Check: Only split host payout at or after 09:00 PM on check-in day!
  const isEligible = await isEligibleForCheckInPayout(booking.check_in);
  if (!isEligible) {
    console.log(`[CheckIn] Booking ${bookingId} checked in. Payout split is scheduled for 09:00 PM IST on ${booking.check_in}.`);
    return {
      success: true,
      message: 'Checked in successfully. Host payout split will process at 09:00 PM today.',
      scheduledTime: '09:00 PM IST',
    };
  }

  // 3. Process splits
  if (booking.razorpay_payment_id) {
    // Fetch payment transfer details
    const { data: fetchedTransferDetails } = await adminSupabase
      .from('payment_transfers')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    let transferDetails = fetchedTransferDetails;

    // Robust fallback: if payment_transfers record was missing, reconstruct it immediately!
    if (!transferDetails) {
      console.warn('[CheckIn] Transfer details missing, reconstructing from booking...');
      const totalAmount = Number(booking.total_price);
      const commissionRate = 10;
      const adminCommission = Math.round(totalAmount * (commissionRate / 100));
      const hostAmount = totalAmount - adminCommission;

      const { data: newRecord } = await adminSupabase
        .from('payment_transfers')
        .upsert({
          booking_id: bookingId,
          host_id: hostId,
          razorpay_order_id: booking.razorpay_order_id,
          razorpay_payment_id: booking.razorpay_payment_id,
          total_amount: totalAmount,
          platform_commission: adminCommission,
          host_amount: hostAmount,
          commission_type: 'percentage',
          commission_value: commissionRate,
          transfer_status: 'pending'
        }, { onConflict: 'booking_id' })
        .select()
        .single();

      transferDetails = newRecord || {
        host_amount: hostAmount,
        platform_commission: adminCommission,
        transfer_status: 'pending'
      };
    }

    // If razorpay_transfer_id wasn't saved, try to fetch it directly from the Razorpay payment
    if (!transferDetails.razorpay_transfer_id && booking.razorpay_payment_id) {
      try {
        const transfersList = await razorpay.payments.fetchTransfer(booking.razorpay_payment_id);
        if (transfersList && transfersList.items && transfersList.items.length > 0) {
          const hostTransfer = transfersList.items.find((item: any) => item.notes?.type === 'host_payout') || transfersList.items[0];
          transferDetails.razorpay_transfer_id = hostTransfer.id;
          await adminSupabase
            .from('payment_transfers')
            .update({ razorpay_transfer_id: hostTransfer.id })
            .eq('booking_id', bookingId);
        }
      } catch (fetchErr) {
        console.warn('[CheckIn] Could not fetch transfers from Razorpay payment:', fetchErr);
      }
    }

    if (transferDetails && transferDetails.transfer_status !== 'settled') {
      const { data: hostKyc } = await adminSupabase
        .from('host_kyc_details')
        .select('razorpay_account_id, kyc_status')
        .eq('user_id', hostId)
        .single();

      const hostRazorpayAccountId = (hostKyc?.kyc_status === 'activated') ? hostKyc.razorpay_account_id : null;

      let referrerRazorpayAccountId = null;
      if (transferDetails.referrer_id && transferDetails.referrer_amount > 0) {
        const { data: referrerKyc } = await adminSupabase
          .from('host_kyc_details')
          .select('razorpay_account_id, kyc_status')
          .eq('user_id', transferDetails.referrer_id)
          .single();
        if (referrerKyc?.kyc_status === 'activated') {
          referrerRazorpayAccountId = referrerKyc.razorpay_account_id;
        }
      }

      const transfers = [];

      if (hostRazorpayAccountId && Number(transferDetails.host_amount) > 0) {
        transfers.push({
          account: hostRazorpayAccountId,
          amount: Math.round(Number(transferDetails.host_amount) * 100),
          currency: 'INR',
          notes: { booking_id: bookingId, type: 'host_payout', host_id: hostId }
        });
      }

      if (referrerRazorpayAccountId && Number(transferDetails.referrer_amount) > 0) {
        transfers.push({
          account: referrerRazorpayAccountId,
          amount: Math.round(Number(transferDetails.referrer_amount) * 100),
          currency: 'INR',
          notes: {
            booking_id: bookingId,
            type: 'referral_commission',
            referred_host_id: hostId,
            referrer_id: transferDetails.referrer_id
          }
        });
      }

      let holdReleased = false;
      if (transferDetails.razorpay_transfer_id) {
        try {
          console.log(`[CheckIn] Releasing Razorpay hold on transfer ${transferDetails.razorpay_transfer_id}...`);
          await razorpay.transfers.edit(transferDetails.razorpay_transfer_id, { on_hold: 0 });
          holdReleased = true;
          await adminSupabase
            .from('payment_transfers')
            .update({
              transfer_status: 'settled',
            })
            .eq('booking_id', bookingId);
          console.log('[CheckIn] Razorpay hold released successfully.');
        } catch (holdErr: any) {
          console.warn('[CheckIn] Failed to release hold directly in booking-actions, falling back to transfer:', holdErr);
        }
      }

      if (!holdReleased && transfers.length > 0) {
        try {
          const transferResult = await razorpay.payments.transfer(booking.razorpay_payment_id, { transfers });
          const returnedItems = transferResult.items || [];
          const hostTransferId = returnedItems.find((item: any) => item.notes?.type === 'host_payout')?.id || (transferResult as any).id;

          await adminSupabase
            .from('payment_transfers')
            .update({
              razorpay_transfer_id: hostTransferId,
              transfer_status: 'settled',
            })
            .eq('booking_id', bookingId);
        } catch (rpError: any) {
          console.error('[CheckIn] Razorpay transfer request failed:', rpError);
          await adminSupabase
            .from('payment_transfers')
            .update({
              transfer_status: 'failed',
              failure_reason: rpError.message || 'Razorpay transfer failed',
            })
            .eq('booking_id', bookingId);
        }
      }
    }
  } else {
    // Stripe flow
    const { data: stripePayment } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'succeeded')
      .single();

    if (stripePayment) {
      const { data: hostUser } = await adminSupabase
        .from('users')
        .select('stripe_account_id, stripe_onboarding_completed')
        .eq('id', hostId)
        .single();

      if (hostUser?.stripe_account_id && hostUser.stripe_onboarding_completed) {
        const commissionAmount = Number(stripePayment.commission_amount || 0);
        const totalPaid = Number(stripePayment.amount);
        const hostAmount = totalPaid - commissionAmount;

        if (hostAmount > 0) {
          try {
            await stripe.transfers.create({
              amount: Math.round(hostAmount),
              currency: stripePayment.currency || 'usd',
              destination: hostUser.stripe_account_id,
              transfer_group: bookingId,
            });
            await adminSupabase
              .from('payments')
              .update({ status: 'transferred' })
              .eq('id', stripePayment.id);
          } catch (stripeError: any) {
            console.error('[CheckIn] Stripe transfer failed:', stripeError);
          }
        }
      }
    }
  }

  revalidateTag(CACHE_TAGS.bookings);
  revalidatePath('/user-profile');
  revalidatePath('/host-dashboard');
  return { success: true };
}

export async function checkInBooking(bookingId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'User not authenticated' };
    }

    const adminSupabase = createServiceClient();

    // Fetch booking to verify ownership
    const { data: booking, error: bookingError } = await adminSupabase
      .from('bookings')
      .select('guest_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return { error: 'Booking not found' };
    }

    if (booking.guest_id !== user.id) {
      return { error: 'Forbidden: this is not your booking' };
    }

    return await processCheckInAndPayout(bookingId, adminSupabase);
  } catch (err: any) {
    console.error('CheckInBooking action failed:', err);
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function autoProcessCheckedInBookings() {
  try {
    const adminSupabase = createServiceClient();
    
    // Format current date in IST (Asia/Kolkata)
    const now = new Date();
    const istDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    // Find all confirmed or checked_in bookings where check_in date is today or in the past
    const { data: bookingsToCheckIn, error } = await adminSupabase
      .from('bookings')
      .select('id, check_in, status')
      .in('status', ['confirmed', 'checked_in'])
      .lte('check_in', istDateStr);

    if (error) {
      console.error('[AutoCheckIn] Error fetching bookings:', error);
      return { success: false, error };
    }

    if (!bookingsToCheckIn || bookingsToCheckIn.length === 0) {
      return { success: true, count: 0 };
    }

    // Filter by Option B: Eligible at or after 09:00 PM IST on check-in day, or past days
    const eligibleBookings: any[] = [];
    for (const b of bookingsToCheckIn) {
      if (await isEligibleForCheckInPayout(b.check_in)) {
        eligibleBookings.push(b);
      }
    }

    if (eligibleBookings.length === 0) {
      return { 
        success: true, 
        count: 0, 
        message: 'No bookings eligible for 09:00 PM payout split at this time.' 
      };
    }

    console.log(`[AutoCheckIn] Found ${eligibleBookings.length} booking(s) eligible for 09:00 PM payout split.`);

    let processedCount = 0;
    for (const b of eligibleBookings) {
      try {
        await processCheckInAndPayout(b.id, adminSupabase);
        processedCount++;
      } catch (err) {
        console.error(`[AutoCheckIn] Failed to auto process booking ${b.id}:`, err);
      }
    }
    
    return { success: true, count: processedCount };
  } catch (err: any) {
    console.error('[AutoCheckIn] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}
