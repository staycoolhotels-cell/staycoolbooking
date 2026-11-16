import { differenceInDays, startOfDay } from 'date-fns';

/**
 * StayCool Cancellation & Refund Policy Rules:
 *
 * POLICY 1: Standard Policy (Flat 70% Refund)
 * - Free Cancellation Protection (₹70 paid):
 *    - Before check-in: 100% Full Refund of the base booking amount to the guest.
 *    - The ₹70 protection fee is 100% retained by Admin. It is NEVER split with the host.
 *    - Host receives ₹0 on free cancellation.
 * - Standard Cancellation (₹70 NOT paid):
 *    - Before check-in: 70% Refund to the guest.
 *    - Remaining 30% penalty is split EQUALLY (50/50) between Host (15%) and Admin (15%).
 *
 * POLICY 2: Tiered Policy (Time-Based Refund)
 * - Free Cancellation Protection (₹70 paid):
 *    - Before check-in: 100% Full Refund of the base booking amount to the guest.
 *    - The ₹70 protection fee is 100% retained by Admin.
 *    - Host receives ₹0 on free cancellation.
 * - Tiered Schedule (₹70 NOT paid):
 *    - ≥ 10 days before check-in: 100% Full Refund (0% penalty)
 *    - 5 – 9 days before check-in: 70% Refund (30% penalty split 50/50 between Host & Admin)
 *    - 2 – 4 days before check-in: 50% Refund (50% penalty split 50/50 between Host & Admin)
 *    - < 2 days before check-in: 30% Refund (70% penalty split 50/50 between Host & Admin)
 *
 * COMMON RULE: StayCool No-Show / After Check-in Rule
 * - If the guest fails to arrive at the property on the scheduled check-in date and check-in time,
 *   it is considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool's
 *   applicable refund policy applies.
 */
export const STAYCOOL_NO_SHOW_RULE = "If the guest fails to arrive at the property on the scheduled check-in date and check-in time, it will be considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool's applicable refund policy applies.";

export function getRefundPercentage(
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false,
  cancellationPolicyType: string = 'Standard'
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

  // Case 2: Tiered Policy (Time-Based)
  const isTiered = typeof cancellationPolicyType === 'string' && cancellationPolicyType.toLowerCase().includes('tier');

  if (isTiered) {
    if (daysBefore >= 10) {
      return { percent: 100, policy: 'Tiered Policy (10+ Days: 100% Refund)', daysBefore };
    } else if (daysBefore >= 5) {
      return { percent: 70, policy: 'Tiered Policy (5-9 Days: 70% Refund)', daysBefore };
    } else if (daysBefore >= 2) {
      return { percent: 50, policy: 'Tiered Policy (2-4 Days: 50% Refund)', daysBefore };
    } else {
      return { percent: 30, policy: 'Tiered Policy (< 2 Days: 30% Refund)', daysBefore };
    }
  }

  // Case 3: Standard Cancellation (Without ₹70 Protection) → 70% Refund
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
 * Case 2: Standard or Tiered Cancellation (Without ₹70)
 * - Guest Refund = calculated % of base booking amount (e.g. 70%, 100%, 50%, 30%)
 * - Remaining penalty is split EQUALLY (50/50) between Host and Admin.
 */
export function calculateRefundDistribution(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false,
  platformFee: number = 0,
  explicitServiceFee?: number,
  cancellationPolicyType: string = 'Standard'
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
    getRefundPercentage(checkInDate, cancellationDate, bookingDate, hasFreeCancellation, cancellationPolicyType);

  // 3. Guest refund amount from base booking
  const guestRefundAmount = Math.round((baseBookingAmount * guestRefundPercent) / 100);

  // 4. Remaining penalty from base booking
  const remainingPenalty = Math.max(0, baseBookingAmount - guestRefundAmount);

  // 5. Penalty split:
  // - If 100% refund (Free Cancellation), remainingPenalty is 0 => Host gets 0, Admin gets ₹70 protection fee.
  // - If remaining penalty exists, split 50/50 between Host and Admin.
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
  platformFee: number = 0,
  explicitServiceFee?: number,
  cancellationPolicyType: string = 'Standard'
) {
  const result = calculateRefundDistribution(
    totalPrice,
    checkInDate,
    cancellationDate,
    bookingDate,
    hasFreeCancellation,
    platformFee,
    explicitServiceFee,
    cancellationPolicyType
  );
  return result.guestRefundAmount;
}
