const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport(emailConfig.smtp);
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.warn('Email service configuration issue:', error.message);
        } else {
          logger.info('Email service ready');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Send credentials email to new client/confirming party
   */
  async sendCredentialsEmail(recipientData) {
    try {
      const { email, name, temporaryPassword, engagementName, firmName, portalUrl } = recipientData;

      const template = emailConfig.templates.credentialsEmail;
      const htmlContent = template.getHtml({
        name,
        email,
        temporaryPassword,
        engagementName,
        firmName,
        portalUrl
      });

      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: template.subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Credentials email sent:', { 
        to: email, 
        messageId: info.messageId 
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('Failed to send credentials email:', error);
      throw new Error('Failed to send email: ' + error.message);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(recipientData) {
    try {
      const { email, name, resetUrl, firmName } = recipientData;

      const template = emailConfig.templates.passwordReset;
      const htmlContent = template.getHtml({
        name,
        resetUrl,
        firmName
      });

      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: template.subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Password reset email sent:', { 
        to: email, 
        messageId: info.messageId 
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send email: ' + error.message);
    }
  }

  /**
   * Send custom email
   */
  async sendEmail(to, subject, htmlContent, from = null) {
    try {
      const mailOptions = {
        from: from || emailConfig.from,
        to,
        subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent:', { 
        to, 
        subject,
        messageId: info.messageId 
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email: ' + error.message);
    }
  }
}

module.exports = new EmailService();

