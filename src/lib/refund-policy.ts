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
  // If they have free cancellation, they get 100% as long as it's before check-in
  if (isFreeCancellationActive) {
    return 100;
  }

  // 4. Standard Tiered Policy (Calculated based on days until check-in)
  // Use startOfDay to compare full calendar days
  const daysUntilCheckIn = differenceInDays(startOfDay(checkIn), startOfDay(cancellation));

  if (daysUntilCheckIn >= 10) return 100;
  if (daysUntilCheckIn >= 5) return 70;
  if (daysUntilCheckIn >= 2) return 50;
  
  // 2 days before or less
  return 30;
}


/**
 * Calculates the refund amount based on total price and cancellation timing.
 * Note: Platform fee (10%) is deducted first, then refund percentage is applied.
 */
export function calculateRefundAmount(
  totalPrice: number,
  checkInDate: string | Date,
  cancellationDate: string | Date,
  bookingDate?: string | Date,
  hasFreeCancellation: any = false
): number {
  const percent = getRefundPercentage(checkInDate, cancellationDate, bookingDate, hasFreeCancellation);

  // Deduct 10% platform fee first
  const platformFee = totalPrice * 0.10;
  const refundableBase = totalPrice - platformFee;

  return (refundableBase * percent) / 100;
}
