module.exports = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  from: process.env.EMAIL_FROM || 'noreply@auditfirm.com',
  templates: {
    credentialsEmail: {
      subject: 'Login Credentials for Audit Confirmation Portal',
      getHtml: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #003366; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .credentials { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #003366; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 10px 20px; background-color: #003366; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${data.firmName}</h2>
            </div>
            <div class="content">
              <p>Dear ${data.name},</p>
              ${data.engagementName && data.engagementName !== 'N/A' 
                ? `<p>You have been granted access to the audit confirmation portal for <strong>${data.engagementName}</strong>.</p>`
                : `<p>You have been granted access to the audit confirmation portal.</p>`
              }
              
              <div class="credentials">
                <p><strong>Login URL:</strong> ${data.portalUrl}</p>
                <p><strong>Username:</strong> ${data.email}</p>
                <p><strong>Temporary Password:</strong> <code>${data.temporaryPassword}</code></p>
              </div>
              
              <p><strong>Important:</strong> For security reasons, you will be required to change your password upon first login.</p>
              
              <a href="${data.portalUrl}" class="button">Access Portal</a>
              
              <p>If you have any questions or did not expect to receive this email, please contact us immediately.</p>
              
              <p>Best regards,<br>${data.firmName}</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    passwordReset: {
      subject: 'Password Reset Request',
      getHtml: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #003366; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background-color: #003366; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request</h2>
            </div>
            <div class="content">
              <p>Dear ${data.name},</p>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              
              <a href="${data.resetUrl}" class="button">Reset Password</a>
              
              <p>This link will expire in 1 hour.</p>
              
              <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
              
              <p>Best regards,<br>${data.firmName}</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }
};

