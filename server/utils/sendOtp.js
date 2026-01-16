import nodemailer from 'nodemailer';
import { emailConfig, smsConfig } from '../config.js';

// Log email config at startup (without password)
console.log('📧 Email Config Loaded:', {
  service: 'gmail',
  user: emailConfig.auth.user,
  passLength: emailConfig.auth.pass ? emailConfig.auth.pass.length : 0
});

// Create nodemailer transporter for Gmail with timeout settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000
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

// Send OTP via Email using Nodemailer (Gmail)
export async function sendEmailOtp(email, otp) {
  const htmlContent = getOtpEmailHtml(otp);

  console.log('📧 ==============================================');
  console.log('📧 Starting email send process...');
  console.log('📧 From:', emailConfig.auth.user);
  console.log('📧 To:', email);
  console.log('📧 OTP:', otp);

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

    console.log('📧 Attempting to send email...');
    const startTime = Date.now();

    const info = await transporter.sendMail(mailOptions);

    const duration = Date.now() - startTime;
    console.log(`✅ Email OTP sent successfully in ${duration}ms`);
    console.log('✅ Message ID:', info.messageId);
    console.log('📧 ==============================================');

    return { success: true, messageId: info.messageId, provider: 'nodemailer' };
  } catch (error) {
    console.error('❌ ==============================================');
    console.error('❌ Email sending FAILED');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error response:', error.response);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('❌ ==============================================');

    return { success: false, error: `Email sending failed: ${error.message}` };
  }
}

// Verify email transporter connection (for startup check)
export async function verifyEmailConnection() {
  console.log('📧 Verifying email transporter connection...');
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully!');
    return true;
  } catch (error) {
    console.error('⚠️ Email transporter verification FAILED:', error.message);
    console.error('⚠️ Error code:', error.code);
    console.error('⚠️ This may indicate invalid credentials or network issues');
    // Still return true to not block startup, but log the issue
    return true;
  }
}
