import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
    const dbUrl = `postgresql://postgres.dlislsrlwovcxsuqdlvy:2bFZKr8g15GBpfng@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
    const config = {
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    };

    const client = new Client(config);
    try {
        await client.connect();
        await client.query(`
            ALTER TABLE public.payment_transfers 
            ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id);

            ALTER TABLE public.payment_transfers 
            ADD COLUMN IF NOT EXISTS referrer_amount NUMERIC(12, 2) DEFAULT 0;

            NOTIFY pgrst, 'reload schema';
        `);
        await client.end();
        return NextResponse.json({ success: true, message: 'Migration executed successfully!' });
    } catch (err: any) {
        try {
            await client.end();
        } catch (e) {
            // Ignore error ending client if connection already closed
        }
        return NextResponse.json({ success: false, error: err.message });
    }
}
