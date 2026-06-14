import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Insert subscriber into database
    const { data, error } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .insert([{ email }])
      .select()
      .single();

    if (error) {
      console.error('Database insertion error:', error);
      // Check for unique constraint violation (code '23505' or duplicate message)
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send notification email using Nodemailer
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('⚠️ SMTP credentials are not configured. Mocking newsletter notification email.');
      console.log('\n================== MOCKED NEWSLETTER SUBSCRIPTION ==================');
      console.log(`NEW SUBSCRIBER: ${email}`);
      console.log('====================================================================\n');
    } else {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      const mailOptions = {
        from: `"StayCool Newsletter" <${user}>`,
        to: 'staycoolhotels@gmail.com',
        subject: `New Newsletter Subscription: ${email}`,
        text: `You have a new newsletter subscriber!\n\nEmail Address: ${email}\nSubscribed at: ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
            <h2 style="color: #0ea5e9; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-top: 0; font-family: system-ui, -apple-system, sans-serif;">New Newsletter Subscriber</h2>
            <p style="font-size: 14px; color: #4b5563;">Congratulations! A new user has subscribed to the StayCool newsletter.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 0; font-weight: bold; color: #4b5563; width: 120px;">Email Address:</td>
                <td style="padding: 10px 0; color: #0ea5e9; font-weight: bold;">${email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Subscribed At:</td>
                <td style="padding: 10px 0; color: #1f2937;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 25px 0;" />
            <p style="font-size: 11px; color: #9ca3af; margin-bottom: 0; text-align: center;">
              This notification was generated automatically from the StayCool Homepage.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error: Failed to subscribe:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
