import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';

/**
 * GET /api/admin/settlements
 * Fetches recent ondemand & regular settlements from Razorpay
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createServiceClient();
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Fetch recent on-demand settlements
        let ondemandSettlements: any[] = [];
        try {
            const ondemandRes = await razorpay.settlements.fetchAllOndemandSettlement({ count: 10 });
            ondemandSettlements = ondemandRes.items || [];
        } catch (e: any) {
            console.warn('[AdminSettlements] fetchAllOndemandSettlement error:', e?.message || e);
        }

        // Fetch recent regular settlements
        let regularSettlements: any[] = [];
        try {
            const regularRes = await razorpay.settlements.all({ count: 10 });
            regularSettlements = regularRes.items || [];
        } catch (e: any) {
            console.warn('[AdminSettlements] settlements.all error:', e?.message || e);
        }

        return NextResponse.json({
            success: true,
            ondemand: ondemandSettlements,
            regular: regularSettlements,
        });
    } catch (err: any) {
        console.error('[AdminSettlements] GET error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/settlements
 * Triggers an on-demand settlement of Admin revenue to the registered bank account.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createServiceClient();
        const { data: userProfile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { amount, settleFullBalance = true, description = 'Admin platform revenue settlement' } = body;

        const settlementPayload: any = {
            description,
        };

        if (amount && Number(amount) > 0 && !settleFullBalance) {
            settlementPayload.amount = Math.round(Number(amount) * 100); // paise
            settlementPayload.settle_full_balance = false;
        } else {
            settlementPayload.settle_full_balance = true;
        }

        console.log('[AdminSettlements] Initiating ondemand settlement with payload:', settlementPayload);

        const result = await razorpay.settlements.createOndemandSettlement(settlementPayload);
        console.log('[AdminSettlements] Settlement initiated successfully:', result);

        return NextResponse.json({
            success: true,
            message: 'Transfer to bank initiated successfully!',
            settlement: result,
        });

    } catch (error: any) {
        console.error('[AdminSettlements] POST error:', error);
        
        const errorDetails = error?.error || error;
        let userMessage = errorDetails?.description || error?.message || 'Failed to initiate bank transfer.';

        if (errorDetails?.code === 'BAD_REQUEST_ERROR' && errorDetails?.reason === 'insufficient_balance') {
            userMessage = 'Razorpay available balance is currently ₹0.00. Funds have already been settled or no new unsettled payments are available in Razorpay balance.';
        }

        return NextResponse.json({ 
            error: userMessage, 
            details: errorDetails 
        }, { status: error.statusCode || 400 });
    }
}
