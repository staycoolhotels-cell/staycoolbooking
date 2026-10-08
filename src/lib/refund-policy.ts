import { differenceInDays, startOfDay } from 'date-fns';

/**
 * StayCool Cancellation & Refund Policy Rules:
 *
 * 1. Free Cancellation Protection (₹70 paid):
 *    - Before check-in: 100% Full Refund of the base booking amount to the guest.
 *    - The ₹70 protection fee is 100% retained by Admin. It is NEVER split with the host.
 *    - Host receives ₹0 on free cancellation.
 *
 * 2. Standard Cancellation (₹70 NOT paid):
 *    - Before check-in: 70% Refund to the guest.
 *    - Remaining 30% penalty is split EQUALLY (50/50) between Host (15%) and Admin (15%).
 *
 * 3. StayCool No-Show / After Check-in Rule:
 *    - If the guest fails to arrive at the property on the scheduled check-in date and check-in time,
 *      it is considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool's
 *      applicable refund policy applies.
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

  const isFreeCancellationActive =
    hasFreeCancellation === true ||
    hasFreeCancellation === 1 ||
    hasFreeCancellation === 'true' ||
    hasFreeCancellation === '1';

  const daysBefore = differenceInDays(startOfDay(checkIn), startOfDay(cancellation));

  // Past check-in date / No-Show: 0% refund
  if (daysBefore < 0) {
    return { percent: 0, policy: 'No-Show / After Check-in (No Refund)', daysBefore };
  }

  // Before check-in:
  // Case 1: Guest opted for ₹70 Free Cancellation Protection → 100% Refund
  if (isFreeCancellationActive) {
    return { percent: 100, policy: 'Free Cancellation (100% Refund)', daysBefore };
  }

  // Case 2: Standard Cancellation (Without ₹70 Protection) → 70% Refund
  return { percent: 70, policy: 'Standard Cancellation (70% Refund)', daysBefore };
}


/**
 * Calculates the refund distribution upon cancellation.
 *
 * Case 1: Free Cancellation Active (₹70 paid)
 * - Guest Refund = 100% of base booking amount
 * - Host Share = ₹0
 * - Admin Share = ₹70 Protection Fee (100% retained by Admin)
 *
 * Case 2: Standard Cancellation (Without ₹70)
 * - Guest Refund = 70% of base booking amount
 * - Remaining 30% penalty is split 50/50:
 *   - Host Share = 15% (half of 30% penalty)
 *   - Admin Share = 15% (half of 30% penalty)
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
  const isFreeCancellationActive =
    hasFreeCancellation === true ||
    hasFreeCancellation === 1 ||
    hasFreeCancellation === 'true' ||
    hasFreeCancellation === '1';

  // 1. Free Cancellation protection fee (₹70) — strictly retained by Admin, NEVER split with host
  const actualProtectionFee = isFreeCancellationActive
    ? (platformFee > 0 ? platformFee : 70)
    : 0;

  // 2. Base booking amount (excluding the protection fee)
  const baseBookingAmount = Math.max(0, totalPrice - actualProtectionFee);

  const { percent: guestRefundPercent, policy: appliedPolicy, daysBefore: daysBeforeCheckIn } =
    getRefundPercentage(checkInDate, cancellationDate, bookingDate, hasFreeCancellation);

  // 3. Guest refund amount from base booking
  const guestRefundAmount = Math.round((baseBookingAmount * guestRefundPercent) / 100);

  // 4. Remaining penalty from base booking
  const remainingPenalty = Math.max(0, baseBookingAmount - guestRefundAmount);

  // 5. Penalty split:
  // - If 100% refund (Free Cancellation), remainingPenalty is 0 => Host gets 0, Admin gets ₹70 protection fee.
  // - If 70% refund, remainingPenalty is 30% => Host gets 15% (half), Admin gets 15% (half).
  const hostShare = Math.round(remainingPenalty / 2);
  const adminShareFromPenalty = remainingPenalty - hostShare;
  const adminShare = actualProtectionFee + adminShareFromPenalty;

  return {
    guestRefundAmount,
    hostShare,
    adminShare,
    totalRetained: totalPrice - guestRefundAmount,
    guestRefundPercent,
    appliedPolicy,
    daysBeforeCheckIn,
    basePrice: baseBookingAmount,
    platformFee: actualProtectionFee,
    adminPlatformFee: 0,
    hostPlatformFeeShare: 0, // Host receives ₹0 from protection fee
    commissionAmount: adminShareFromPenalty,
    netRefundablePool: baseBookingAmount,
    hostSharePercent: baseBookingAmount > 0 ? (hostShare / baseBookingAmount) * 100 : 0,
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






