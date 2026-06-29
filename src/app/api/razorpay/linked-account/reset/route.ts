import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/razorpay/linked-account/reset
 *
 * Resets the host's KYC & linked account details, unlinking their
 * Razorpay Route account in the database and resetting onboarding status
 * so they can register and test onboarding from scratch.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Delete or reset KYC record in host_kyc_details
        const { error: kycError } = await supabase
            .from('host_kyc_details')
            .delete()
            .eq('user_id', user.id);

        if (kycError) {
            console.error('Failed to reset host_kyc_details:', kycError);
            return NextResponse.json({ error: 'Failed to reset KYC details.' }, { status: 500 });
        }

        // 2. Reset host details in public.users table (Stripe columns, KYC status)
        const { error: userError } = await supabase
            .from('users')
            .update({
                stripe_account_id: null,
                stripe_onboarding_completed: false,
                kyc_status: 'not_verified'
            })
            .eq('id', user.id);

        if (userError) {
            console.error('Failed to reset public.users details:', userError);
            return NextResponse.json({ error: 'Failed to reset host user onboarding status.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Payout details reset successfully.' });

    } catch (error: any) {
        console.error('Reset linked account error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
