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
 */
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
  platformFee: number = 0
) {
  const isFreeCancellationActive = hasFreeCancellation === true || hasFreeCancellation === 1 || hasFreeCancellation === 'true' || hasFreeCancellation === '1';

  // 1. Free Cancellation fee (₹70) — stays with Admin always
  const actualPlatformFee = isFreeCancellationActive ? platformFee : 0;
  const priceExcludingProtection = Math.max(0, totalPrice - actualPlatformFee);

  // 2. Extract base accommodation from total (total = accommodation * 1.1)
  // E.g. ₹1,100 / 1.1 = ₹1,000 accommodation, ₹100 platform fee
  const baseAccommodation = Math.round(priceExcludingProtection / 1.1);
  const adminPlatformFee = priceExcludingProtection - baseAccommodation; // exactly ₹100

  // 3. Net Refundable Pool = base accommodation (₹1,000)
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
    adminShare: adminPlatformFee + adminShareFromPenalty + actualPlatformFee,
    totalRetained: totalPrice - guestRefundAmount,
    guestRefundPercent,
    appliedPolicy,
    daysBeforeCheckIn,
    basePrice: baseAccommodation,
    platformFee: adminPlatformFee + actualPlatformFee,
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






