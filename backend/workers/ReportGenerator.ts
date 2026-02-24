import { ExportFormat, PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

type ReportDashboard = {
    id: string;
    title: string;
    description: string | null;
    widgets: Array<{
        id: string;
        title: string;
        type: string;
        dataSource: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
};

export interface ReportAttachment {
    format: ExportFormat;
    filename: string;
    content: Buffer;
    contentType: string;
}

/**
 * ReportGenerator - Generates PDF reports and sends via email
 */
export class ReportGenerator {
    private prisma: PrismaClient;
    private transporter: nodemailer.Transporter;

    constructor(prisma?: PrismaClient) {
        this.prisma = prisma ?? prismaClient;
        this.transporter = this.createTransporter();
    }

    /**
     * Create nodemailer transporter
     */
    private createTransporter(): nodemailer.Transporter {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    /**
     * Generate PDF report for a dashboard using server-side HTML rendering.
     */
    async generatePDF(dashboardId: string): Promise<Buffer> {
        const dashboard = await this.getDashboardForReport(dashboardId);
        return await this.generatePDFFromDashboard(dashboard);
    }

    /**
     * Generate report attachments for the requested formats using a single DB read
     */
    async generateAttachments(
        dashboardId: string,
        formats: ExportFormat[]
    ): Promise<ReportAttachment[]> {
        const dashboard = await this.getDashboardForReport(dashboardId);
        const uniqueFormats = Array.from(new Set(formats.length > 0 ? formats : [ExportFormat.PDF]));

        return await Promise.all(
            uniqueFormats.map((format) => this.generateAttachmentFromDashboard(dashboard, format))
        );
    }

    private async getDashboardForReport(dashboardId: string): Promise<ReportDashboard> {
        const dashboard = await this.prisma.dashboard.findUnique({
            where: { id: dashboardId },
            include: {
                widgets: true,
            },
        });

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        return dashboard;
    }

    private async generateAttachmentFromDashboard(
        dashboard: ReportDashboard,
        format: ExportFormat
    ): Promise<ReportAttachment> {
        switch (format) {
            case ExportFormat.CSV:
                return {
                    format,
                    filename: `report-${dashboard.id}.csv`,
                    content: this.createCSVBuffer(dashboard),
                    contentType: 'text/csv',
                };
            case ExportFormat.XLSX:
                return {
                    format,
                    filename: `report-${dashboard.id}.xlsx`,
                    content: this.createXLSXBuffer(dashboard),
                    contentType:
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                };
            case ExportFormat.PDF:
            default:
                return {
                    format: ExportFormat.PDF,
                    filename: `report-${dashboard.id}.pdf`,
                    content: await this.generatePDFFromDashboard(dashboard),
                    contentType: 'application/pdf',
                };
        }
    }

    private async generatePDFFromDashboard(dashboard: ReportDashboard): Promise<Buffer> {
        let browser: import('playwright').Browser | null = null;

        try {
            const { chromium } = await import('playwright');
            browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
            });

            const page = await browser.newPage({
                viewport: { width: 1280, height: 800 },
            });

            await page.setContent(this.generateReportHTML(dashboard), {
                waitUntil: 'domcontentloaded',
            });
            await page.emulateMedia({ media: 'screen' });

            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '18mm',
                    right: '12mm',
                    bottom: '18mm',
                    left: '12mm',
                },
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `
                    <div style="width:100%;font-size:10px;padding:0 12mm;color:#64748b;display:flex;justify-content:space-between;">
                        <span>Dashboard Analytics</span>
                        <span><span class="pageNumber"></span>/<span class="totalPages"></span></span>
                    </div>
                `,
            });

            return Buffer.from(pdf);
        } catch (error: any) {
            // Safety net for environments without Playwright browser binaries installed.
            console.warn(
                '[ReportGenerator] Playwright PDF rendering failed, using text fallback:',
                error?.message ?? error
            );
            const reportContent = this.generateReportContent(dashboard);
            return this.createPDFBuffer(reportContent, dashboard.title);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    private generateReportHTML(dashboard: ReportDashboard): string {
        const generatedAt = new Date().toLocaleString('pt-BR');
        const safeTitle = this.escapeHtml(dashboard.title);
        const safeDescription = this.escapeHtml(dashboard.description || 'Sem descrição');

        const widgetRows =
            dashboard.widgets.length > 0
                ? dashboard.widgets
                      .map(
                          (widget, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${this.escapeHtml(widget.title)}</td>
                        <td><span class="badge">${this.escapeHtml(widget.type)}</span></td>
                        <td>${this.escapeHtml(widget.dataSource)}</td>
                        <td>${this.escapeHtml(widget.updatedAt.toLocaleString('pt-BR'))}</td>
                    </tr>
                `
                      )
                      .join('')
                : `
                    <tr>
                        <td colspan="5" class="empty">Nenhum widget cadastrado neste dashboard.</td>
                    </tr>
                `;

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <style>
        :root {
            --ink: #0f172a;
            --muted: #64748b;
            --line: #e2e8f0;
            --surface: #ffffff;
            --surface-alt: #f8fafc;
            --accent: #0ea5e9;
            --accent-soft: rgba(14, 165, 233, 0.12);
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            color: var(--ink);
            background: linear-gradient(180deg, #eef6ff 0%, #ffffff 200px);
        }

        .report {
            padding: 24px 20px 8px;
        }

        .hero {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 18px 20px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .eyebrow {
            margin: 0 0 6px;
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--accent);
            font-weight: 700;
        }

        h1 {
            margin: 0;
            font-size: 22px;
            line-height: 1.2;
        }

        .meta {
            margin-top: 8px;
            color: var(--muted);
            font-size: 12px;
        }

        .description {
            margin-top: 14px;
            padding: 12px 14px;
            border-radius: 12px;
            background: var(--surface-alt);
            border: 1px solid var(--line);
            font-size: 13px;
            color: #334155;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-top: 16px;
        }

        .card {
            border: 1px solid var(--line);
            background: linear-gradient(180deg, #ffffff, #fbfdff);
            border-radius: 12px;
            padding: 12px;
        }

        .card-label {
            margin: 0;
            color: var(--muted);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
        }

        .card-value {
            margin: 6px 0 0;
            font-size: 20px;
            font-weight: 700;
            color: var(--ink);
        }

        .section {
            margin-top: 18px;
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 16px;
            overflow: hidden;
        }

        .section-header {
            padding: 12px 16px;
            background: var(--surface-alt);
            border-bottom: 1px solid var(--line);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .section-title {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
        }

        .section-subtitle {
            margin: 0;
            font-size: 11px;
            color: var(--muted);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        thead th {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid var(--line);
            color: var(--muted);
            font-weight: 700;
            background: #fff;
        }

        tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }

        tbody tr:nth-child(even) {
            background: #fcfdff;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            background: var(--accent-soft);
            color: #0369a1;
            font-weight: 700;
            font-size: 11px;
        }

        .empty {
            text-align: center;
            color: var(--muted);
            padding: 18px 12px;
        }

        .footer-note {
            margin: 12px 2px 0;
            color: var(--muted);
            font-size: 11px;
        }
    </style>
</head>
<body>
    <main class="report">
        <section class="hero">
            <p class="eyebrow">Scheduled Report</p>
            <h1>${safeTitle}</h1>
            <p class="meta">Gerado em ${this.escapeHtml(generatedAt)} • Dashboard ID: ${this.escapeHtml(dashboard.id)}</p>
            <div class="description">${safeDescription}</div>

            <div class="stats">
                <div class="card">
                    <p class="card-label">Widgets</p>
                    <p class="card-value">${dashboard.widgets.length}</p>
                </div>
                <div class="card">
                    <p class="card-label">Tipos</p>
                    <p class="card-value">${new Set(dashboard.widgets.map((w) => w.type)).size}</p>
                </div>
                <div class="card">
                    <p class="card-label">Fontes</p>
                    <p class="card-value">${new Set(dashboard.widgets.map((w) => w.dataSource)).size}</p>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="section-header">
                <div>
                    <p class="section-title">Resumo de widgets</p>
                    <p class="section-subtitle">Visão consolidada para exportação agendada</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Fonte de dados</th>
                        <th>Última atualização</th>
                    </tr>
                </thead>
                <tbody>
                    ${widgetRows}
                </tbody>
            </table>
        </section>

        <p class="footer-note">Relatório gerado automaticamente pelo Dashboard Analytics.</p>
    </main>
</body>
</html>`;
    }

    /**
     * Generate report content
     */
    private generateReportContent(dashboard: ReportDashboard): string {
        const now = new Date().toLocaleString();
        let content = `
Dashboard Report: ${dashboard.title}
Generated: ${now}
${'='.repeat(50)}

Description: ${dashboard.description || 'N/A'}

Widgets Summary:
${'-'.repeat(30)}
`;

        for (const widget of dashboard.widgets) {
            content += `
- ${widget.title}
  Type: ${widget.type}
  Data Source: ${widget.dataSource}
`;
        }

        content += `
${'='.repeat(50)}
Total Widgets: ${dashboard.widgets.length}
Report generated automatically by Dashboard Analytics
`;

        return content;
    }

    /**
     * Legacy text-only PDF fallback for environments without Playwright binaries.
     */
    private createPDFBuffer(content: string, title: string): Buffer {
        const escapedTitle = this.escapePdfText(title);
        const escapedContent = this.escapePdfText(content).replace(/\n/g, ') Tj 0 -15 Td (');

        // Simple PDF structure (minimal valid PDF)
        // In production, use a proper PDF library like puppeteer or pdfkit
        const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${content.length + 100} >>
stream
BT
/F1 12 Tf
50 750 Td
(${escapedTitle}) Tj
0 -20 Td
(${escapedContent}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + content.length}
%%EOF`;

        return Buffer.from(pdfContent, 'utf-8');
    }

    private createCSVBuffer(dashboard: ReportDashboard): Buffer {
        const rows = [
            ['dashboardId', 'dashboardTitle', 'widgetId', 'widgetTitle', 'widgetType', 'dataSource'],
            ...dashboard.widgets.map((widget) => [
                dashboard.id,
                dashboard.title,
                widget.id,
                widget.title,
                widget.type,
                widget.dataSource,
            ]),
        ];

        const csv = rows
            .map((row) => row.map((value) => this.escapeCsvCell(String(value ?? ''))).join(','))
            .join('\n');

        return Buffer.from(csv, 'utf-8');
    }

    private createXLSXBuffer(dashboard: ReportDashboard): Buffer {
        const workbook = XLSX.utils.book_new();

        const summarySheet = XLSX.utils.json_to_sheet([
            {
                dashboardId: dashboard.id,
                title: dashboard.title,
                description: dashboard.description ?? '',
                totalWidgets: dashboard.widgets.length,
                generatedAt: new Date().toISOString(),
            },
        ]);

        const widgetsSheet = XLSX.utils.json_to_sheet(
            dashboard.widgets.map((widget) => ({
                widgetId: widget.id,
                title: widget.title,
                type: widget.type,
                dataSource: widget.dataSource,
                createdAt: widget.createdAt.toISOString(),
                updatedAt: widget.updatedAt.toISOString(),
            }))
        );

        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        XLSX.utils.book_append_sheet(workbook, widgetsSheet, 'Widgets');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    }

    private escapeCsvCell(value: string): string {
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private escapePdfText(value: string): string {
        return value
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    }

    /**
     * Send email with PDF attachment
     */
    async sendEmail(
        to: string,
        subject: string,
        pdfBuffer: Buffer,
        filename: string = 'report.pdf'
    ): Promise<void> {
        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html: this.generateEmailHTML(subject),
            attachments: [
                {
                    filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`[ReportGenerator] Email sent to: ${to}`);
        } catch (error: any) {
            console.error(`[ReportGenerator] Failed to send email to ${to}:`, error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendEmailWithAttachments(
        to: string,
        subject: string,
        attachments: ReportAttachment[]
    ): Promise<void> {
        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html: this.generateEmailHTML(subject, attachments.map((a) => a.format)),
            attachments: attachments.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType,
            })),
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`[ReportGenerator] Email sent to: ${to} (${attachments.length} attachment(s))`);
        } catch (error: any) {
            console.error(`[ReportGenerator] Failed to send email to ${to}:`, error.message);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Generate email HTML content
     */
    private generateEmailHTML(reportTitle: string, formats?: ExportFormat[]): string {
        const formatsLabel =
            formats && formats.length > 0 ? formats.join(', ') : 'PDF';
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">📊 Dashboard Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${reportTitle}</p>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Your scheduled dashboard report is ready. Please find the attachment(s) with the latest data and insights.</p>
            <p>This report was automatically generated by Dashboard Analytics.</p>
            <p style="margin-top: 20px;">
                <strong>Report Details:</strong><br>
                Generated: ${new Date().toLocaleString()}<br>
                Formats: ${formatsLabel}<br>
            </p>
        </div>
        <div class="footer">
            <p>Dashboard Analytics - Business Intelligence Platform</p>
            <p>This is an automated message. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
`;
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('[ReportGenerator] SMTP connection verified');
            return true;
        } catch (error) {
            console.error('[ReportGenerator] SMTP connection failed:', error);
            return false;
        }
    }
}

export const reportGenerator = new ReportGenerator();
