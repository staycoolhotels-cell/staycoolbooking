import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required fields.' },
        { status: 400 }
      );
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Check if SMTP credentials are provided
    if (!user || !pass) {
      console.warn('⚠️ SMTP_USER or SMTP_PASS environment variables are missing. Mocking email delivery.');
      console.log('\n================== MOCKED EMAIL INQUIRY ==================');
      console.log(`TO: staycoolhotels@gmail.com`);
      console.log(`FROM: "${name}" <${email}>`);
      console.log(`PHONE: ${phone || 'N/A'}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`MESSAGE:\n${message}`);
      console.log('==========================================================\n');

      // Add a artificial delay to simulate real network request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message: 'Inquiry logged to console (Mocked backend - SMTP not configured).',
        mocked: true,
      });
    }

    // Configure the SMTP transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    // Email configuration
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'staycoolhotels@gmail.com',
      replyTo: email,
      subject: `StayCool Contact Inquiry: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
          <h2 style="color: #0ea5e9; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-top: 0; font-family: system-ui, -apple-system, sans-serif;">New Contact Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563; width: 120px;">Full Name:</td>
              <td style="padding: 10px 0; color: #1f2937;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Email:</td>
              <td style="padding: 10px 0; color: #1f2937;"><a href="mailto:${email}" style="color: #0ea5e9; text-decoration: none;">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Phone:</td>
              <td style="padding: 10px 0; color: #1f2937;">${phone || '<i>Not provided</i>'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Subject:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${subject}</td>
            </tr>
          </table>
          <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #0ea5e9; border-radius: 4px; font-size: 14px; color: #374151; white-space: pre-wrap; line-height: 1.5;">
            <strong>Message:</strong><br/>
            ${message}
          </div>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 25px 0;" />
          <p style="font-size: 11px; color: #9ca3af; margin-bottom: 0; text-align: center;">
            This inquiry was sent automatically from the StayCool Booking Contact Form.
          </p>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Inquiry sent successfully to staycoolhotels@gmail.com.',
    });
  } catch (error) {
    console.error('API Error: Failed to send contact email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send inquiry.' },
      { status: 500 }
    );
  }
}
