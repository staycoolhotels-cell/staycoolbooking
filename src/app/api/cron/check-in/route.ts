import { NextResponse } from 'next/server';
import { autoProcessCheckedInBookings } from '@/lib/booking-actions';

/**
 * GET /api/cron/check-in
 * Executed daily to automatically check-in guests and trigger payout splits to hosts
 * when the check-in day arrives.
 */
export async function GET(request: Request) {
    try {
        // Run auto check-in background task
        const result = await autoProcessCheckedInBookings();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Automated check-ins complete. Processed ${result.count} booking(s).`
            }, { status: 200 });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[CronCheckIn] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'An unexpected error occurred.'
        }, { status: 500 });
    }
}

// Support POST requests as well for flexibility
export async function POST(request: Request) {
    return GET(request);
}
