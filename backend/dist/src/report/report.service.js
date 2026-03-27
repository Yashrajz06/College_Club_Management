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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const puppeteer = __importStar(require("puppeteer"));
let ReportService = class ReportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateEventSummary(eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                club: true,
                registrations: { include: { user: true } },
                transactions: true,
                tasks: {
                    include: {
                        assignee: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const totalRegistrations = event.registrations.length;
        const members = event.registrations.filter(r => r.user.role !== 'GUEST').length;
        const guests = event.registrations.filter(r => r.user.role === 'GUEST').length;
        const attended = event.registrations.filter(r => r.attended).length;
        const memberAttendance = event.registrations.filter((r) => r.user.role !== 'GUEST' && r.attended).length;
        const guestAttendance = event.registrations.filter((r) => r.user.role === 'GUEST' && r.attended).length;
        const attendanceRate = totalRegistrations > 0 ? ((attended / totalRegistrations) * 100).toFixed(1) : '0';
        const completedTasks = event.tasks.filter((task) => task.status === 'DONE').length;
        const openTasks = event.tasks.length - completedTasks;
        const totalSpent = event.transactions
            .filter(t => t.type === 'DEBIT')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalSponsorship = event.transactions
            .filter(t => t.type === 'CREDIT' && t.sponsorId)
            .reduce((sum, t) => sum + t.amount, 0);
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; color: #1e293b; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #4f46e5; margin: 0; font-size: 28px; }
          .header p { color: #64748b; margin: 5px 0 0; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-bold; border-left: 4px solid #4f46e5; padding-left: 10px; margin-bottom: 15px; color: #334155; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          .stat-value { font-size: 20px; font-weight: bold; color: #1e293b; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; color: #475569; font-size: 13px; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EVENT SUMMARY REPORT</h1>
          <p>${event.club.name} • ${event.title}</p>
        </div>

        <div class="section">
          <div class="section-title">Overview</div>
          <div class="grid">
            <div class="stat-card">
              <div class="stat-label">Date & Time</div>
              <div class="stat-value">${new Date(event.date).toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Venue</div>
              <div class="stat-value">${event.venue}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Attendance Metrics</div>
          <div class="grid" style="grid-template-cols: 1fr 1fr 1fr 1fr;">
            <div class="stat-card">
              <div class="stat-label">Total Registered</div>
              <div class="stat-value">${totalRegistrations}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Actual Attendance</div>
              <div class="stat-value">${attended}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Attendance Rate</div>
              <div class="stat-value">${attendanceRate}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Guest Count</div>
              <div class="stat-value">${guests}</div>
            </div>
          </div>
          <div class="grid" style="margin-top: 20px;">
            <div class="stat-card">
              <div class="stat-label">Member Attendance</div>
              <div class="stat-value">${memberAttendance} / ${members}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Guest Attendance</div>
              <div class="stat-value">${guestAttendance} / ${guests}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Financial Summary</div>
          <div class="grid">
            <div class="stat-card">
              <div class="stat-label">Total Budget Allocation</div>
              <div class="stat-value">₹${event.budget.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Expenditure</div>
              <div class="stat-value">₹${totalSpent.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Sponsor Credits</div>
              <div class="stat-value">₹${totalSponsorship.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Task Summary</div>
          <div class="grid">
            <div class="stat-card">
              <div class="stat-label">Total Tasks</div>
              <div class="stat-value">${event.tasks.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Completed</div>
              <div class="stat-value">${completedTasks}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Open</div>
              <div class="stat-value">${openTasks}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Club Status</div>
              <div class="stat-value">${event.club.status}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              ${event.tasks.map(task => `
                <tr>
                  <td>${task.title}</td>
                  <td>${task.assignee?.name || 'Unassigned'}</td>
                  <td>${task.status}</td>
                  <td>${task.priority}</td>
                  <td>${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
              ${event.tasks.length === 0 ? '<tr><td colspan="5" style="text-align: center;">No tasks recorded for this event.</td></tr>' : ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Itemized Transactions</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${event.transactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString()}</td>
                  <td>${t.description}</td>
                  <td style="color: ${t.type === 'CREDIT' ? '#059669' : '#dc2626'}">${t.type}</td>
                  <td>₹${t.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${event.transactions.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No transactions recorded.</td></tr>' : ''}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Auto-generated by CampusClubs Management System • ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        });
        await browser.close();
        return Buffer.from(pdfBuffer);
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportService);
//# sourceMappingURL=report.service.js.map