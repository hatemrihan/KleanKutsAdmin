import sgMail from '@sendgrid/mail';

// Configure SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

/**
 * Send an email notification to a new ambassador that they've been approved
 */
export async function sendAmbassadorApprovalEmail(email: string, name: string, referralCode: string) {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@elevee.com',
      subject: 'Welcome to the Elevee Ambassador Program!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Congratulations, ${name}!</h1>
            <p style="font-size: 18px; color: #666;">Your ambassador application has been approved!</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f8f8; border-radius: 5px;">
            <p style="margin-bottom: 10px;">Here are your details:</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li style="margin-bottom: 8px;"><strong>Your Name:</strong> ${name}</li>
              <li style="margin-bottom: 8px;"><strong>Your Referral Code:</strong> <span style="color: #0066cc; font-weight: bold;">${referralCode}</span></li>
            </ul>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 18px;">What's Next?</h2>
            <p>You can now start promoting Elevee products using your unique referral code. Here's how to get started:</p>
            <ol style="padding-left: 20px;">
              <li style="margin-bottom: 8px;">Login to your ambassador dashboard</li>
              <li style="margin-bottom: 8px;">Copy your unique referral link</li>
              <li style="margin-bottom: 8px;">Share it with your network</li>
              <li style="margin-bottom: 8px;">Start earning commissions on sales!</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://elevee.netlify.app/ambassador-login" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Your Dashboard</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 14px; color: #666; text-align: center;">
            <p>If you have any questions, please contact our support team at <a href="mailto:support@elevee.com" style="color: #0066cc;">support@elevee.com</a></p>
          </div>
        </div>
      `,
    };

    const result = await sgMail.send(msg);
    console.log('Ambassador approval email sent:', result[0].statusCode);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending ambassador approval email:', error);
    return { success: false, error };
  }
}

/**
 * Send a notification to an ambassador when they receive a commission
 */
export async function sendCommissionNotificationEmail(
  email: string, 
  name: string, 
  amount: number, 
  orderNumber: string
) {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@elevee.com',
      subject: 'You earned a commission!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Great news, ${name}!</h1>
            <p style="font-size: 18px; color: #666;">You've earned a commission on a new order!</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f8f8; border-radius: 5px;">
            <p style="margin-bottom: 10px;">Commission details:</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li style="margin-bottom: 8px;"><strong>Order Number:</strong> ${orderNumber}</li>
              <li style="margin-bottom: 8px;"><strong>Commission Amount:</strong> <span style="color: #0066cc; font-weight: bold;">L.E. ${amount.toFixed(2)}</span></li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://elevee.netlify.app/ambassador-login" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Earnings</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 14px; color: #666; text-align: center;">
            <p>Keep up the great work! The more you share, the more you earn.</p>
          </div>
        </div>
      `,
    };

    const result = await sgMail.send(msg);
    console.log('Commission notification email sent:', result[0].statusCode);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending commission notification email:', error);
    return { success: false, error };
  }
} 