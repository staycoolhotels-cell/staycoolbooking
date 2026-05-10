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
  
  // Normalize hasFreeCancellation (handle string, number, or boolean)
  const isFreeCancellationActive = hasFreeCancellation === true || hasFreeCancellation === 1 || hasFreeCancellation === 'true' || hasFreeCancellation === '1';

  // 1. Grace Period: Within 6 hours of booking creation
  if (booking) {
    const msSinceBooking = cancellation.getTime() - booking.getTime();
    const hoursSinceBooking = msSinceBooking / (1000 * 60 * 60);
    
    // If cancelled within 6 hours of booking -> 100% refund
    if (hoursSinceBooking >= 0 && hoursSinceBooking <= 6) {
        return 100;
    }

    // 2. Same day booking & cancellation (Calendar day)
    if (isSameDay(startOfDay(booking), startOfDay(cancellation))) {
        return 100;
    }
  }

  // 3. Free Cancellation Option (Paid ₹70)
  if (isFreeCancellationActive) {
    return 100;
  }

  // 4. Standard Tiered Policy
  const daysUntilCheckIn = differenceInDays(startOfDay(checkIn), startOfDay(cancellation));

  if (daysUntilCheckIn >= 10) {
      return 100;
  } else if (daysUntilCheckIn >= 5) {
      return 70;
  } else if (daysUntilCheckIn >= 2) {
      return 50;
  } else {
      return 30;
  }
}


/**
 * Calculates the refund amount based on total price and cancellation timing.
 */
export function calculateRefundAmount(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false
): number {
  const percent = getRefundPercentage(checkInDate, cancellationDate, bookingDate, hasFreeCancellation);
  return (totalPrice * percent) / 100;
}

/**
 * Calculates the full distribution of the total price upon cancellation.
 * Split logic: 
 * 1. Guest gets tiered refund (100%, 70%, 50%, or 30%).
 * 2. Remaining penalty is split EQUALLY (50/50) between Admin and Host.
 */
export function calculateRefundDistribution(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false
) {
  const guestRefundPercent = getRefundPercentage(checkInDate, cancellationDate, bookingDate, hasFreeCancellation);
  const guestRefundAmount = (totalPrice * guestRefundPercent) / 100;
  
  const totalPenalty = totalPrice - guestRefundAmount;
  
  // Penalty is split equally between host and admin
  const hostShare = totalPenalty / 2;
  const adminShare = totalPenalty / 2;

  return {
    guestRefundAmount,
    hostShare,
    adminShare,
    totalRetained: totalPenalty,
    guestRefundPercent,
    hostSharePercent: (100 - guestRefundPercent) / 2,
    adminSharePercent: (100 - guestRefundPercent) / 2
  };
}

