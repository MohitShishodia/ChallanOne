import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { resendConfig, emailConfig, smsConfig } from '../config.js';

// Initialize Resend client
const resend = new Resend(resendConfig.apiKey);

// Create nodemailer transporter as fallback
const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  auth: emailConfig.auth
});

// Send OTP via SMS using Fast2SMS
export async function sendSmsOtp(phone, otp) {
  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': smsConfig.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: phone,
        flash: 0
      })
    });

    const data = await response.json();

    if (data.return === true) {
      console.log(`✅ SMS OTP sent successfully to ${phone}`);
      return { success: true, requestId: data.request_id };
    } else {
      console.error('❌ Fast2SMS error:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ Error sending SMS OTP:', error);
    return { success: false, error: error.message };
  }
}

// OTP email HTML template
function getOtpEmailHtml(otp) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Challan One</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your Trusted Partner for Challan Payment</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Verify Your Login</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Use the following OTP to complete your login. This code is valid for <strong>5 minutes</strong>.
          </p>
          
          <div style="background: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
            If you didn't request this OTP, please ignore this email or contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            © 2025 Challan One. All rights reserved.<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send OTP via Email using Resend (primary) with Nodemailer fallback
export async function sendEmailOtp(email, otp) {
  const htmlContent = getOtpEmailHtml(otp);

  // Try Resend first (works better on cloud platforms)
  try {
    console.log('📧 Attempting to send OTP via Resend...');
    const { data, error } = await resend.emails.send({
      from: resendConfig.from,
      to: [email],
      subject: 'Your OTP for Challan One Login',
      html: htmlContent
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(error.message);
    }

    console.log('✅ Email OTP sent successfully via Resend:', data.id);
    return { success: true, messageId: data.id, provider: 'resend' };
  } catch (resendError) {
    console.error('⚠️ Resend failed, trying Nodemailer fallback:', resendError.message);

    // Fallback to Nodemailer/Gmail
    try {
      const mailOptions = {
        from: {
          name: 'Challan One',
          address: emailConfig.auth.user
        },
        to: email,
        subject: 'Your OTP for Challan One Login',
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email OTP sent successfully via Nodemailer:', info.messageId);
      return { success: true, messageId: info.messageId, provider: 'nodemailer' };
    } catch (nodemailerError) {
      console.error('❌ Both Resend and Nodemailer failed:', nodemailerError.message);
      return { success: false, error: `Email sending failed: ${nodemailerError.message}` };
    }
  }
}

// Verify email transporter connection (for startup check)
export async function verifyEmailConnection() {
  try {
    // Test Resend connection by checking if API key is valid
    if (resendConfig.apiKey && resendConfig.apiKey.startsWith('re_')) {
      console.log('✅ Resend API key configured');
      return true;
    }

    // Fallback: verify nodemailer
    await transporter.verify();
    console.log('✅ Email transporter is ready (Nodemailer)');
    return true;
  } catch (error) {
    console.error('⚠️ Email verification warning:', error.message);
    console.log('📧 Will attempt to send emails anyway...');
    return true; // Return true to not block startup
  }
}
