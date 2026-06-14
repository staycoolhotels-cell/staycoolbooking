import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
    const dbUrl = `postgresql://postgres:2bFZKr8g15GBpfng@db.dlislsrlwovcxsuqdlvy.supabase.co:5432/postgres`;
    const config = {
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    };

    const client = new Client(config);
    try {
        await client.connect();
        await client.query(`
            ALTER TABLE public.properties 
            ADD COLUMN IF NOT EXISTS standard_price INTEGER;

            UPDATE public.properties 
            SET standard_price = price_per_night 
            WHERE standard_price IS NULL;

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
