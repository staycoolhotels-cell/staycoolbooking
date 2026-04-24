import { differenceInDays, startOfDay } from 'date-fns';

/**
 * Calculates the refund percentage based on how many days before check-in the cancellation occurred.
 * 
 * Policy:
 * - 7+ days: 100% refund
 * - 5-6 days: 70% refund
 * - 2-4 days: 30% refund
 * - < 2 days: 0% refund
 */
export function getRefundPercentage(checkInDate: string | Date, cancellationDate: string | Date): number {
  const cancellation = startOfDay(new Date(cancellationDate));
  const checkIn = startOfDay(new Date(checkInDate));
  const daysUntilCheckIn = differenceInDays(checkIn, cancellation);

  if (daysUntilCheckIn >= 7) return 100;
  if (daysUntilCheckIn >= 5) return 70;
  if (daysUntilCheckIn >= 2) return 30;
  return 0;
}

/**
 * Calculates the refund amount based on total price and cancellation timing.
 */
export function calculateRefundAmount(totalPrice: number, checkInDate: string | Date, cancellationDate: string | Date): number {
  const percent = getRefundPercentage(checkInDate, cancellationDate);
  return (totalPrice * percent) / 100;
}
