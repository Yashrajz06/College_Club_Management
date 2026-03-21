import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Uses Ethereal as a no-config test SMTP server.
    // Replace with real SMTP credentials in .env for production.
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      auth: {
        user: process.env.MAIL_USER || 'your@gmail.com',
        pass: process.env.MAIL_PASS || 'password',
      },
    });
  }

  async sendInviteEmail(email: string, name: string, inviteLink: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to CampusClubs, ${name}!</h2>
        <p>You have been invited to join the platform as a Faculty Coordinator.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Set Your Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">If the button doesn't work, copy and paste this link into your browser: <br/>${inviteLink}</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || '"Club Management System" <no-reply@campusclubs.edu>',
        to: email,
        subject: 'You are invited to join CampusClubs as a Coordinator',
        text: `Hi ${name}, you have been added as a Faculty Coordinator. Please set your password here: ${inviteLink} (Expires in 24 hours)`,
        html,
      });
      this.logger.log(`Invite email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send invite email: ${err.message}`);
    }
  }

  async sendGuestRegistrationConfirmation(opts: {
    guestEmail: string;
    guestName: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    clubName: string;
  }) {
    const html = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">You're In! 🎉</h1>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px;">Hi <strong>${opts.guestName}</strong>,</p>
          <p>You have successfully registered for:</p>
          <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 16px 0;">
            <h2 style="margin: 0 0 8px; color: #4f46e5;">${opts.eventTitle}</h2>
            <p style="margin: 4px 0; color: #64748b;">📅 ${new Date(opts.eventDate).toLocaleString()}</p>
            <p style="margin: 4px 0; color: #64748b;">📍 ${opts.eventVenue}</p>
            <p style="margin: 4px 0; color: #64748b;">🏢 Organized by ${opts.clubName}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">We look forward to seeing you there!</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: '"CampusClubs" <no-reply@campusclubs.edu>',
        to: opts.guestEmail,
        subject: `Registration Confirmed: ${opts.eventTitle}`,
        html,
      });
      this.logger.log(`Guest confirmation email sent to ${opts.guestEmail}`);
    } catch (err) {
      // Non-fatal: log but don't throw, so registration still succeeds
      this.logger.warn(`Failed to send email: ${err.message}`);
    }
  }

  async sendEventReminder(opts: { recipientEmail: string; recipientName: string; eventTitle: string; eventDate: string; }) {
    try {
      await this.transporter.sendMail({
        from: '"CampusClubs" <no-reply@campusclubs.edu>',
        to: opts.recipientEmail,
        subject: `Reminder: ${opts.eventTitle} is tomorrow!`,
        html: `<p>Hi ${opts.recipientName}, just a reminder that <strong>${opts.eventTitle}</strong> is happening on ${new Date(opts.eventDate).toLocaleString()}. See you there!</p>`,
      });
    } catch (err) {
      this.logger.warn(`Reminder email failed: ${err.message}`);
    }
  }
}
