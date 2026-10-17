import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailVerificationData {
  email: string;
  code: string;
  name?: string;
}

export interface EmailData {
  subject: string;
  text: string;
  html: string;
}

export async function sendVerificationCode(data: EmailVerificationData) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: data.email,
      subject: 'Your verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Welcome to Travel Project!</h2>
          
          <p>Hi ${data.name || 'there'},</p>
          
          <p>Thank you for creating an account. Please use the verification code below to complete your registration:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; display: inline-block;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 8px; font-family: monospace;">
                ${data.code}
              </h1>
            </div>
          </div>
          
          <p>Enter this code on the verification page to complete your registration.</p>
          
          <p>This code will expire in 10 minutes.</p>
          
          <p>If you didn't create an account, you can safely ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Travel Project Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending verification code:', error);
      throw new Error('Failed to send verification code');
    }

    console.log('Verification code sent successfully:', emailData);
    return { success: true, data: emailData };
    
  } catch (error) {
    console.error('Error in sendVerificationCode:', error);
    throw new Error('Failed to send verification code');
  }
}

export async function sendEmail(to: string, emailData: EmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw new Error('Failed to send email');
  }
}
