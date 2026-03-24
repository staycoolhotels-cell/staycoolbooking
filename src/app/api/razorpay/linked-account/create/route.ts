import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { razorpay } from '@/lib/razorpay';

/**
 * POST /api/razorpay/linked-account/create
 *
 * Creates a Razorpay Linked Account (Route) for a host.
 * Stores the account_id in host_kyc_details.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            legal_business_name,
            email,
            phone,
            pan_number,
            bank_account_number,
            bank_ifsc,
            bank_beneficiary_name,
        } = body;

        // Validate required fields
        const requiredFields = {
            legal_business_name,
            email,
            phone,
            pan_number,
            bank_account_number,
            bank_ifsc,
            bank_beneficiary_name,
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value || String(value).trim() === '') {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate PAN format (basic)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(pan_number.toUpperCase())) {
            return NextResponse.json({ error: 'Invalid PAN number format. Expected: ABCDE1234F' }, { status: 400 });
        }

        // Validate IFSC format (basic)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(bank_ifsc.toUpperCase())) {
            return NextResponse.json({ error: 'Invalid IFSC code format.' }, { status: 400 });
        }

        // Check if host already has a linked account
        const { data: existingKyc } = await supabase
            .from('host_kyc_details')
            .select('id, razorpay_account_id, kyc_status')
            .eq('user_id', user.id)
            .single();

        if (existingKyc?.razorpay_account_id) {
            return NextResponse.json(
                {
                    error: 'A linked account already exists for this host.',
                    account_id: existingKyc.razorpay_account_id,
                    kyc_status: existingKyc.kyc_status,
                },
                { status: 409 }
            );
        }

        // ─────────────────────────────────────────────
        // Step 1: Create the Razorpay Linked Account
        // ─────────────────────────────────────────────
        const accountPayload: any = {
            email,
            profile: {
                category: 'individual',
                subcategory: 'mutual_fund',
                addresses: {
                    registered: {
                        street1: 'N/A',
                        city: 'N/A',
                        state: 'MH',
                        postal_code: '400001',
                        country: 'IN',
                    },
                },
            },
            legal_business_name,
            business_type: 'individual',
            legal_info: {
                pan: pan_number.toUpperCase(),
            },
            contact_name: legal_business_name,
            contact_info: {
                name: legal_business_name,
                email,
                phone: {
                    primary: phone.replace(/\D/g, '').replace(/^91/, '').slice(-10),
                },
            },
        };

        let razorpayAccount: any;
        try {
            razorpayAccount = await (razorpay as any).accounts.create(accountPayload);
        } catch (rzpError: any) {
            console.error('Razorpay account creation error:', rzpError);
            const errMsg = rzpError?.error?.description || rzpError?.message || 'Failed to create Razorpay account';
            return NextResponse.json({ error: errMsg }, { status: 502 });
        }

        const razorpay_account_id = razorpayAccount.id;

        // ─────────────────────────────────────────────
        // Step 2: Add Stakeholder (PAN KYC)
        // ─────────────────────────────────────────────
        try {
            await (razorpay as any).stakeholders.create(razorpay_account_id, {
                name: legal_business_name,
                email,
                phone: {
                    primary: phone.replace(/\D/g, '').replace(/^91/, '').slice(-10),
                },
                kyc_details: {
                    pan: pan_number.toUpperCase(),
                },
                relationship: {
                    director: true,
                    executive: true,
                },
            });
        } catch (stakeholderErr: any) {
            console.warn('Stakeholder creation warning (non-fatal):', stakeholderErr?.message);
        }

        // ─────────────────────────────────────────────
        // Step 3: Request Route product for account
        // ─────────────────────────────────────────────
        let productId: string | undefined;
        try {
            const product = await (razorpay as any).products.requestProductConfiguration(
                razorpay_account_id,
                {
                    product_name: 'route',
                    tnc_accepted: true,
                }
            );
            productId = product?.id;
        } catch (productErr: any) {
            console.warn('Product request warning (non-fatal):', productErr?.message);
        }

        // ─────────────────────────────────────────────
        // Step 4: Add Bank Account
        // ─────────────────────────────────────────────
        try {
            await (razorpay as any).accounts.addBankAccount(razorpay_account_id, {
                ifsc_code: bank_ifsc.toUpperCase(),
                beneficiary_name: bank_beneficiary_name,
                account_number: bank_account_number,
            });
        } catch (bankErr: any) {
            console.warn('Bank account addition warning (non-fatal):', bankErr?.message);
        }

        // ─────────────────────────────────────────────
        // Step 5: Save to Supabase (upsert)
        // ─────────────────────────────────────────────
        const upsertPayload = {
            user_id: user.id,
            legal_business_name,
            email,
            phone,
            pan_number: pan_number.toUpperCase(),
            bank_account_number,
            bank_ifsc: bank_ifsc.toUpperCase(),
            bank_beneficiary_name,
            razorpay_account_id,
            razorpay_product_id: productId ?? null,
            kyc_status: 'under_review',
        };

        const { error: upsertError } = await supabase
            .from('host_kyc_details')
            .upsert(upsertPayload, { onConflict: 'user_id' });

        if (upsertError) {
            console.error('Supabase upsert error:', upsertError);
            return NextResponse.json({ error: 'Failed to save account details to database' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            razorpay_account_id,
            kyc_status: 'under_review',
            message: 'Linked account created. Payouts will be enabled once KYC is verified by Razorpay.',
        });

    } catch (error: any) {
        console.error('Linked account creation error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
