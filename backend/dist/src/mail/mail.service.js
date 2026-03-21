"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    logger = new common_1.Logger(MailService_1.name);
    transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.MAIL_PORT || '587'),
            auth: {
                user: process.env.MAIL_USER || 'your@gmail.com',
                pass: process.env.MAIL_PASS || 'password',
            },
        });
    }
    async sendInviteEmail(email, name, inviteLink) {
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
        }
        catch (err) {
            this.logger.error(`Failed to send invite email: ${err.message}`);
        }
    }
    async sendGuestRegistrationConfirmation(opts) {
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
        }
        catch (err) {
            this.logger.warn(`Failed to send email: ${err.message}`);
        }
    }
    async sendEventReminder(opts) {
        try {
            await this.transporter.sendMail({
                from: '"CampusClubs" <no-reply@campusclubs.edu>',
                to: opts.recipientEmail,
                subject: `Reminder: ${opts.eventTitle} is tomorrow!`,
                html: `<p>Hi ${opts.recipientName}, just a reminder that <strong>${opts.eventTitle}</strong> is happening on ${new Date(opts.eventDate).toLocaleString()}. See you there!</p>`,
            });
        }
        catch (err) {
            this.logger.warn(`Reminder email failed: ${err.message}`);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map