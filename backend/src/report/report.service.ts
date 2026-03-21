import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async generateEventSummary(eventId: string): Promise<Buffer> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: true,
        registrations: { include: { user: true } },
        transactions: true,
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    const totalRegistrations = event.registrations.length;
    const members = event.registrations.filter(r => r.user.role !== 'GUEST').length;
    const guests = event.registrations.filter(r => r.user.role === 'GUEST').length;
    const attended = event.registrations.filter(r => r.attended).length;
    const attendanceRate = totalRegistrations > 0 ? ((attended / totalRegistrations) * 100).toFixed(1) : '0';

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
          </div>
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
}
