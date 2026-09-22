import { differenceInDays, startOfDay, isSameDay } from 'date-fns';

/**
 * Calculates the refund percentage based on timing and free cancellation status.
 *
 * Rules:
 * 1. Same Day Exception (₹70 users only): If booking date == check-in date AND
 *    guest paid ₹70 Free Cancellation → 100% refund. ₹70 stays with Admin.
 *
 * 2. All other cancellations → Tiered Policy (regardless of ₹70 status):
 *    - ≥ 10 days before check-in : 100% refund
 *    - 5 – 9 days before check-in: 70%  refund
 *    - 2 – 4 days before check-in: 50%  refund
 *    - < 2 days before check-in  : 30%  refund
 *
 * 3. StayCool No-Show Rule:
 *    "If the guest fails to arrive at the property on the scheduled check-in date and check-in time, it will be considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool's applicable refund policy applies."
 */
export const STAYCOOL_NO_SHOW_RULE = "If the guest fails to arrive at the property on the scheduled check-in date and check-in time, it will be considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool's applicable refund policy applies.";

export function getRefundPercentage(
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false
): { percent: number; policy: string; daysBefore: number } {
  const cancellation = new Date(cancellationDate);
  const checkIn = new Date(checkInDate);
  const booking = bookingDate ? new Date(bookingDate) : null;

  const isFreeCancellationActive =
    hasFreeCancellation === true ||
    hasFreeCancellation === 1 ||
    hasFreeCancellation === 'true' ||
    hasFreeCancellation === '1';

  const daysBefore = differenceInDays(startOfDay(checkIn), startOfDay(cancellation));

  // Rule 1 — Same Day Exception: same day booking + same day check-in + ₹70 paid
  if (isFreeCancellationActive && booking && isSameDay(booking, checkIn)) {
    return { percent: 100, policy: 'Same Day Booking & Check-in (Free Cancellation)', daysBefore };
  }

  // Rule 2 — Tiered Policy (all other cases, ₹70 paid or not)
  if (daysBefore >= 10) return { percent: 100, policy: 'Standard (10+ Days Before)', daysBefore };
  if (daysBefore >= 5)  return { percent: 70,  policy: 'Standard (5-10 Days Before)', daysBefore };
  if (daysBefore >= 2)  return { percent: 50,  policy: 'Standard (2-5 Days Before)', daysBefore };
  return                       { percent: 30,  policy: 'Standard (< 2 Days Before)', daysBefore };
}


/**
 * Calculates the refund distribution of the total price upon cancellation.
 *
 * Money Flow on Cancellation:
 * Total Price (e.g. ₹1,100) = Accommodation (₹1,000) + 10% Platform Service Fee (₹100) + Free Cancellation Fee (₹70 if paid)
 * 1. Free Cancellation Fee (₹70 if paid) → always Admin's. Non-refundable.
 * 2. Platform Service Fee (10% = ₹100) → always Admin's platform fee.
 * 3. Base Accommodation Pool (₹1,000) → Refundable pool subject to cancellation policy.
 * 4. Guest Refund = Pool × Refund % (100%: ₹1,000, 70%: ₹700, 50%: ₹500, 30%: ₹300).
 * 5. Remaining penalty (₹1,000 − Refund) is split EQUALLY (50/50) between Host and Admin.
 */
export function calculateRefundDistribution(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false,
  platformFee: number = 0,
  explicitServiceFee?: number
) {
  const isFreeCancellationActive = hasFreeCancellation === true || hasFreeCancellation === 1 || hasFreeCancellation === 'true' || hasFreeCancellation === '1';

  // 1. Free Cancellation protection fee (e.g. ₹70) — stays with Admin always (non-refundable)
  const actualProtectionFee = isFreeCancellationActive ? platformFee : 0;
  const priceExcludingProtection = Math.max(0, totalPrice - actualProtectionFee);

  // 2. Platform Service Fee (10%) — 100% Retained by Admin. NEVER shared with host (host gets ₹0).
  const adminPlatformFee = (explicitServiceFee !== undefined && explicitServiceFee > 0)
    ? explicitServiceFee
    : Math.round((priceExcludingProtection * 0.1) / 1.1);

  // 3. Base accommodation pool (strictly excluding platform service fee and protection fee)
  const baseAccommodation = Math.max(0, priceExcludingProtection - adminPlatformFee);
  const netRefundablePool = baseAccommodation;

  const { percent: guestRefundPercent, policy: appliedPolicy, daysBefore: daysBeforeCheckIn } =
    getRefundPercentage(checkInDate, cancellationDate, bookingDate, hasFreeCancellation);

  // 4. Guest refund from accommodation pool
  const guestRefundAmount = Math.round((netRefundablePool * guestRefundPercent) / 100);

  // 5. Remaining penalty split equally between Admin and Host
  const remainingPenalty = netRefundablePool - guestRefundAmount;
  const hostShare = Math.round(remainingPenalty / 2);
  const adminShareFromPenalty = remainingPenalty - hostShare;

  return {
    guestRefundAmount,
    hostShare,
    adminShare: adminPlatformFee + adminShareFromPenalty + actualProtectionFee,
    totalRetained: totalPrice - guestRefundAmount,
    guestRefundPercent,
    appliedPolicy,
    daysBeforeCheckIn,
    basePrice: baseAccommodation,
    platformFee: adminPlatformFee + actualProtectionFee,
    adminPlatformFee,
    hostPlatformFeeShare: 0, // Explicit guarantee that host receives ₹0 from platform fee
    commissionAmount: adminPlatformFee,
    netRefundablePool,
    hostSharePercent: baseAccommodation > 0 ? (hostShare / baseAccommodation) * 100 : 0,
  };
}


export function calculateRefundAmount(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false,
  platformFee: number = 0
) {
  const result = calculateRefundDistribution(
    totalPrice,
    checkInDate,
    cancellationDate,
    bookingDate,
    hasFreeCancellation,
    platformFee
  );
  return result.guestRefundAmount;
}






