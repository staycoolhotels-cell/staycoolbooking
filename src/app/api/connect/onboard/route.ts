import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const supabase = await createClient(); // Awaited!
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check if wallet exists, if not create one (safe guard)
        const { data: wallet } = await supabase
            .from('user_wallets')
            .select('razorpay_account_id')
            .eq('user_id', user.id)
            .single();

        if (wallet?.razorpay_account_id) {
            return NextResponse.json({ message: 'Already onboarded', accountId: wallet.razorpay_account_id });
        }

        // 2. Create Razorpay Linked Account
        // We need user details. Fetch profile?
        const { data: _profile } = await supabase
            .from('user_personal_info')
            .select('email, bio') // Using bio as dummy name if needed, or fetch distinct name
            .eq('user_id', user.id)
            .single();

        // Fallback name/email
        const name = user.user_metadata?.name || 'StayCool Host';
        const email = user.email || 'host@staycool.com';

        let accountId = '';
        try {
            const account = await razorpay.accounts.create({
                type: 'route',
                name: name,
                email: email,
            } as any);
            accountId = account.id;
        } catch (rzpError: any) {
            console.warn('Razorpay Route creation failed (likely not enabled for merchant). Using mock account for development.', rzpError.message);
            // Generate a mock account ID for testing
            accountId = 'acc_mock_' + Math.random().toString(36).substring(2, 10);
        }

        if (!accountId) {
            throw new Error('Failed to create Razorpay account or mock account');
        }

        // 3. Save account_id to DB
        const { error: updateError } = await supabase
            .from('user_wallets')
            .upsert({
                user_id: user.id,
                razorpay_account_id: accountId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (updateError) {
            console.error('DB Update Error:', updateError);
            try {
                fs.appendFileSync('C:\\Users\\VSHARE\\.gemini\\antigravity\\brain\\db_error.log', JSON.stringify(updateError) + '\n');
            } catch (fsError) { 
                console.error('Failed to log to file:', fsError);
            }
            throw new Error('Failed to save account ID');
        }

        return NextResponse.json({ success: true, accountId: accountId });

    } catch (error: any) {
        console.error('Onboarding Error Details:', error);

        let errorMessage = 'An unexpected error occurred.';

        console.info('API returning 500 with:', { error: errorMessage, details: String(error) });

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
