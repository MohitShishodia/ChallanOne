import { emailConfig, smsConfig } from '../config.js';

const brevoConfigured = Boolean(emailConfig.apiKey && emailConfig.apiKey !== 'your-brevo-api-key');

// One quiet line at startup — missing Brevo must never spam/crash the API
if (brevoConfigured) {
  console.log('📧 Email (Brevo): configured');
} else {
  console.log('📧 Email (Brevo): not configured (email OTP disabled)');
}

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

// Send OTP via Email using Brevo API
export async function sendEmailOtp(email, otp) {
  if (!brevoConfigured) {
    return { success: false, error: 'Email OTP is not configured on this server.' };
  }

  const htmlContent = getOtpEmailHtml(otp);

  console.log('📧 ==============================================');
  console.log('📧 Starting email send process via Brevo...');
  console.log('📧 From:', `${emailConfig.fromName} <${emailConfig.fromEmail}>`);
  console.log('📧 To:', email);
  console.log('📧 OTP:', otp);

  try {
    console.log('📧 Attempting to send email...');
    const startTime = Date.now();

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': emailConfig.apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: emailConfig.fromName,
          email: emailConfig.fromEmail
        },
        to: [{ email: email }],
        subject: 'Your OTP for Challan One Login',
        htmlContent: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ ==============================================');
      console.error('❌ Email sending FAILED');
      console.error('❌ Brevo error:', data);
      console.error('❌ ==============================================');
      return { success: false, error: `Email sending failed: ${data.message || JSON.stringify(data)}` };
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Email OTP sent successfully in ${duration}ms`);
    console.log('✅ Message ID:', data.messageId);
    console.log('📧 ==============================================');

    return { success: true, messageId: data.messageId, provider: 'brevo' };
  } catch (error) {
    console.error('❌ ==============================================');
    console.error('❌ Email sending FAILED');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('❌ ==============================================');

    return { success: false, error: `Email sending failed: ${error.message}` };
  }
}

// Verify email service connection (for startup check)
export async function verifyEmailConnection() {
  return brevoConfigured;
}
