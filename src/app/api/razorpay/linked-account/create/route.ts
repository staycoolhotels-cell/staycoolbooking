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
        const reference_id = `h_${user.id.substring(0, 8)}_${Date.now()}`.substring(0, 20);
        const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
        
        const authString = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        const rzpHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authString}`
        };

        // Step 1: Create Linked Account
        const accountPayload = {
            email,
            phone: cleanPhone,
            type: 'route',
            reference_id,
            legal_business_name,
            business_type: 'individual',
            contact_name: legal_business_name,
            profile: {
                category: 'healthcare',
                subcategory: 'clinic',
                addresses: {
                    registered: {
                        street1: '123 Main St',
                        street2: 'Apt 4B',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        postal_code: '400001',
                        country: 'IN'
                    }
                }
            }
        };

        console.log('DEBUG - Step 1: Attempting Razorpay Linked Account Creation');

        const accountRes = await fetch('https://api.razorpay.com/v2/accounts', {
            method: 'POST',
            headers: rzpHeaders,
            body: JSON.stringify(accountPayload)
        });

        const accountData = await accountRes.json();

        if (!accountRes.ok) {
            console.error('Razorpay Step 1 Failure:', accountData);
            const errMsg = accountData?.error?.description || 'Failed to create Razorpay account';
            if (errMsg === 'Access Denied') {
                return NextResponse.json({ 
                    error: 'Access Denied: Please check if your Razorpay account is in LIVE mode or if Route needs additional KYC on their dashboard.' 
                }, { status: 502 });
            }
            return NextResponse.json({ error: errMsg }, { status: 502 });
        }

        const razorpay_account_id = accountData.id;
        console.log('DEBUG - Razorpay Account Created Successfully:', razorpay_account_id);

        // ─────────────────────────────────────────────
        // Step 2: Add Stakeholder (PAN KYC)
        // ─────────────────────────────────────────────
        console.log('DEBUG - Step 2: Adding Stakeholder (PAN)');
        const stakeholderPayload = {
            name: legal_business_name,
            email,
            phone: {
                primary: cleanPhone
            },
            relationship: {
                director: false,
                executive: true
            },
            kyc: {
                pan: pan_number.trim().toUpperCase()
            }
        };

        const stakeholderRes = await fetch(`https://api.razorpay.com/v2/accounts/${razorpay_account_id}/stakeholders`, {
            method: 'POST',
            headers: rzpHeaders,
            body: JSON.stringify(stakeholderPayload)
        });

        const stakeholderData = await stakeholderRes.json();
        if (!stakeholderRes.ok) {
            console.error('Razorpay Step 2 Failure (Stakeholder):', stakeholderData);
            return NextResponse.json({ 
                error: stakeholderData?.error?.description || 'Failed to add stakeholder details' 
            }, { status: 502 });
        }
        console.log('DEBUG - Stakeholder Added Successfully');

        // ─────────────────────────────────────────────
        // Step 3: Configure Route Product (Add Bank Account)
        // ─────────────────────────────────────────────
        console.log('DEBUG - Step 3: Adding Bank Account via Product Config');
        
        // 3a. Request Product Configuration
        const postPayload = {
            product_name: 'route',
            tnc_accepted: true
        };

        const prodRes = await fetch(`https://api.razorpay.com/v2/accounts/${razorpay_account_id}/products`, {
            method: 'POST',
            headers: rzpHeaders,
            body: JSON.stringify(postPayload)
        });

        const prodData = await prodRes.json();

        if (!prodRes.ok) {
            console.error('Razorpay Step 3 Failure (Product Request):', prodData);
            const errorDesc = prodData?.error?.description || prodData?.message;
            return NextResponse.json({ 
                error: errorDesc ? `Product Error: ${errorDesc}` : `Raw Product Error: ${JSON.stringify(prodData).substring(0, 150)}`
            }, { status: 502 });
        }

        const productId = prodData.id;
        console.log('DEBUG - Product Requested Successfully, ID:', productId);

        // 3b. Update Product Configuration with Bank Details
        const patchPayload = {
            tnc_accepted: true,
            settlements: {
                beneficiary_name: bank_beneficiary_name,
                account_number: bank_account_number,
                ifsc_code: bank_ifsc.toUpperCase()
            }
        };

        const bankRes = await fetch(`https://api.razorpay.com/v2/accounts/${razorpay_account_id}/products/${productId}`, {
            method: 'PATCH',
            headers: rzpHeaders,
            body: JSON.stringify(patchPayload)
        });

        const bankData = await bankRes.json();

        if (!bankRes.ok) {
            console.error('Razorpay Step 3 Failure (Bank Patch):', bankData);
            const errorDesc = bankData?.error?.description || bankData?.message;
            return NextResponse.json({ 
                error: errorDesc ? `Bank Error: ${errorDesc}` : `Raw Bank Error: ${JSON.stringify(bankData).substring(0, 150)}`
            }, { status: 502 });
        }
        console.log('DEBUG - Bank Account Configured Successfully');
        
        
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
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
