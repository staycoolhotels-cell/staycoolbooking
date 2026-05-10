import { differenceInDays, startOfDay, isSameDay } from 'date-fns';

/**
 * Calculates the refund percentage based on timing and free cancellation status.
 * 
 * Rules:
 * 1. Within 6 hours of booking: 100% refund (Grace Period)
 * 2. Same day booking & cancellation: 100% refund
 * 3. With "Free Cancellation" (₹70): 100% refund if cancelled > 6 hours before check-in
 * 4. Standard Policy (No Free Cancellation or cancelled < 6h before check-in):
 *    - > 10 days: 100% refund
 *    - 10 to 5 days: 70% refund
 *    - 5 to 2 days: 50% refund
 *    - < 2 days: 30% refund
 */
export function getRefundPercentage(
  checkInDate: string | Date, 
  cancellationDate: string | Date, 
  bookingDate?: string | Date,
  hasFreeCancellation: any = false
): number {
  const cancellation = new Date(cancellationDate);
  const checkIn = new Date(checkInDate);
  const booking = bookingDate ? new Date(bookingDate) : null;
  
  const isFreeCancellationActive = hasFreeCancellation === true || hasFreeCancellation === 1 || hasFreeCancellation === 'true' || hasFreeCancellation === '1';

  // 1. If Free Cancellation is Active
  if (isFreeCancellationActive) {
    // A. Grace Period: Within 6 hours of booking creation
    if (booking) {
      const msSinceBooking = cancellation.getTime() - booking.getTime();
      const hoursSinceBooking = msSinceBooking / (1000 * 60 * 60);
      if (hoursSinceBooking >= 0 && hoursSinceBooking <= 6) {
          return 100;
      }
    }

    // B. Window Period: Up to 6 hours before check-in
    const msUntilCheckIn = checkIn.getTime() - cancellation.getTime();
    const hoursUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60);
    if (hoursUntilCheckIn >= 6) {
        return 100;
    }

    // C. Fallback for Free Cancellation users: If they miss the window, they follow the tiered policy
    const daysUntilCheckIn = Math.floor((checkIn.getTime() - cancellation.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilCheckIn >= 10) return 100;
    if (daysUntilCheckIn >= 5) return 70;
    if (daysUntilCheckIn >= 2) return 50;
    return 30;
  }

  // 2. Normal Booking (No Free Cancellation)
  // ALWAYS 50% Refund, regardless of timing.
  return 50;
}


/**
 * Calculates the refund distribution of the total price upon cancellation.
 * Logic:
 * 1. Platform Fee (₹70) is deducted first and kept by Admin.
 * 2. Refund is calculated on the remaining Base Price.
 * 3. Remaining penalty is split EQUALLY between Admin and Host.
 */
export function calculateRefundDistribution(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false,
  platformFee: number = 0,
  commissionRate: number = 20 // Default 20%
) {
  const isFreeCancellationActive = hasFreeCancellation === true || hasFreeCancellation === 1 || hasFreeCancellation === 'true' || hasFreeCancellation === '1';

  // 1. Deduct platform fee first (e.g. ₹70) - ONLY if it was selected
  const actualPlatformFee = isFreeCancellationActive ? platformFee : 0;
  const basePrice = Math.max(0, totalPrice - actualPlatformFee);
  
  // 2. Calculate Admin Commission (e.g. 20% of Base)
  // This is kept by Admin regardless of refund percentage
  const commissionAmount = (basePrice * commissionRate) / 100;
  
  // 3. The amount available after platform fee and commission
  const netRefundablePool = basePrice - commissionAmount;

  const guestRefundPercent = getRefundPercentage(checkInDate, cancellationDate, bookingDate, hasFreeCancellation);
  
  // Guest gets their percentage out of the net refundable pool
  const guestRefundAmount = (netRefundablePool * guestRefundPercent) / 100;
  
  // 4. Remaining penalty (from the net pool) is split between Admin and Host
  const remainingPenalty = netRefundablePool - guestRefundAmount;
  
  const hostShare = remainingPenalty / 2;
  const adminShareFromPenalty = remainingPenalty / 2;

  return {
    guestRefundAmount,
    hostShare,
    adminShare: adminShareFromPenalty + commissionAmount + actualPlatformFee,
    totalRetained: totalPrice - guestRefundAmount,
    guestRefundPercent,
    basePrice,
    platformFee: actualPlatformFee,
    commissionAmount,
    netRefundablePool,
    hostSharePercent: basePrice > 0 ? (hostShare / basePrice) * 100 : 0,
  };
}

export function calculateRefundAmount(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false,
  platformFee: number = 0,
  commissionRate: number = 20
) {
  const result = calculateRefundDistribution(
    totalPrice,
    checkInDate,
    cancellationDate,
    bookingDate,
    hasFreeCancellation,
    platformFee,
    commissionRate
  );
  return result.guestRefundAmount;
}


