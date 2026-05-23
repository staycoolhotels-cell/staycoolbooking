/**
 * MSG91 OTP Integration Library for StayCool Booking
 */

// Helper to normalize phone number to MSG91 format (digits only, e.g. 91XXXXXXXXXX)
export function normalizePhoneForMsg91(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Default to India country code (+91) if number is exactly 10 digits
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

/**
 * Sends OTP to the specified mobile number via MSG91
 * @param phone Mobile number (e.g. +91XXXXXXXXXX or 91XXXXXXXXXX)
 */
export async function sendMsg91OTP(phone: string): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    console.error('❌ MSG91 Config Error: MSG91_AUTH_KEY or MSG91_TEMPLATE_ID environment variables are missing.');
    return { success: false, error: 'MSG91 service is not fully configured.' };
  }

  const normalizedPhone = normalizePhoneForMsg91(phone);
  console.log(`[MSG91] Initiating OTP send to: ${normalizedPhone}`);

  try {
    // MSG91 v5 OTP Send API
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(normalizedPhone)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body is sufficient for standard OTP templates
    });

    const data = await response.json();
    console.log('[MSG91] Send Response:', data);

    if (data.type === 'success' || data.success === true) {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Failed to send OTP' };
    }
  } catch (error: any) {
    console.error('[MSG91] Error sending OTP:', error);
    return { success: false, error: error?.message || 'Server error while sending OTP' };
  }
}

/**
 * Verifies the OTP submitted by the user via MSG91
 * @param phone Mobile number
 * @param otp 4 or 6 digit OTP token
 */
export async function verifyMsg91OTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey) {
    console.error('❌ MSG91 Config Error: MSG91_AUTH_KEY environment variable is missing.');
    return { success: false, error: 'MSG91 service is not fully configured.' };
  }

  const normalizedPhone = normalizePhoneForMsg91(phone);
  console.log(`[MSG91] Verifying OTP for: ${normalizedPhone}`);

  try {
    // MSG91 v5 OTP Verify API
    const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=${encodeURIComponent(normalizedPhone)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'authkey': authKey
      }
    });

    const data = await response.json();
    console.log('[MSG91] Verify Response:', data);

    if (data.type === 'success' || data.success === true || data.message === 'OTP verified successfully') {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Invalid OTP code' };
    }
  } catch (error: any) {
    console.error('[MSG91] Error verifying OTP:', error);
    return { success: false, error: error?.message || 'Server error during OTP verification' };
  }
}
