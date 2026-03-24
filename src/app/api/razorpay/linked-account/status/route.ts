import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';

/**
 * GET /api/razorpay/linked-account/status
 *
 * Fetches the current KYC status of the host's linked account,
 * both from Razorpay and syncs it back to our DB.
 */
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the host's KYC record from DB
        const { data: kyc, error: kycError } = await supabase
            .from('host_kyc_details')
            .select('razorpay_account_id, kyc_status, razorpay_product_id, legal_business_name, email, bank_ifsc, bank_beneficiary_name')
            .eq('user_id', user.id)
            .single();

        if (kycError || !kyc) {
            return NextResponse.json({ error: 'No linked account found. Please complete banking setup.' }, { status: 404 });
        }

        if (!kyc.razorpay_account_id) {
            return NextResponse.json({
                kyc_status: 'pending',
                message: 'No Razorpay account created yet.',
            });
        }

        // Fetch live status from Razorpay
        let liveStatus = kyc.kyc_status;
        try {
            const account: any = await (razorpay as any).accounts.fetch(kyc.razorpay_account_id);
            liveStatus = account?.profile?.kyc_details?.status || kyc.kyc_status;

            // Map Razorpay statuses to our statuses
            const statusMap: Record<string, string> = {
                'created': 'under_review',
                'under_review': 'under_review',
                'activated': 'activated',
                'needs_clarification': 'needs_clarification',
                'suspended': 'suspended',
            };
            liveStatus = statusMap[liveStatus] || liveStatus;

            // Sync to DB if changed
            if (liveStatus !== kyc.kyc_status) {
                await supabase
                    .from('host_kyc_details')
                    .update({ kyc_status: liveStatus })
                    .eq('user_id', user.id);
            }
        } catch (rzpFetchErr: any) {
            console.warn('Could not fetch live Razorpay status:', rzpFetchErr?.message);
            // Return DB status as fallback
        }

        return NextResponse.json({
            razorpay_account_id: kyc.razorpay_account_id,
            kyc_status: liveStatus,
            legal_business_name: kyc.legal_business_name,
            email: kyc.email,
            bank_ifsc: kyc.bank_ifsc,
            bank_beneficiary_name: kyc.bank_beneficiary_name,
        });

    } catch (error: any) {
        console.error('Status fetch error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
