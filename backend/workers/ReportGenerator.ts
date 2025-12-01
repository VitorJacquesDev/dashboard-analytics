import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

/**
 * ReportGenerator - Generates PDF reports and sends via email
 */
export class ReportGenerator {
    private prisma: PrismaClient;
    private transporter: nodemailer.Transporter;

    constructor(prisma?: PrismaClient) {
        this.prisma = prisma || new PrismaClient();
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
     * Generate PDF report for a dashboard
     * Note: Server-side PDF generation requires puppeteer or similar
     * This is a simplified version that generates a basic PDF
     */
    async generatePDF(dashboardId: string): Promise<Buffer> {
        // Fetch dashboard with widgets
        const dashboard = await this.prisma.dashboard.findUnique({
            where: { id: dashboardId },
            include: {
                widgets: true,
            },
        });

        if (!dashboard) {
            throw new Error('Dashboard not found');
        }

        // For server-side PDF generation, we create a simple text-based report
        // In production, you would use puppeteer to render the actual dashboard
        const reportContent = this.generateReportContent(dashboard);
        
        // Convert to PDF using a simple approach
        // In production, use puppeteer or jsPDF with server-side rendering
        const pdfBuffer = await this.createPDFBuffer(reportContent, dashboard.title);
        
        return pdfBuffer;
    }

    /**
     * Generate report content
     */
    private generateReportContent(dashboard: any): string {
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
     * Create PDF buffer from content
     * Simplified version - in production use puppeteer
     */
    private async createPDFBuffer(content: string, title: string): Promise<Buffer> {
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
(${title}) Tj
0 -20 Td
(${content.replace(/\n/g, ') Tj 0 -15 Td (')}) Tj
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

    /**
     * Generate email HTML content
     */
    private generateEmailHTML(reportTitle: string): string {
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
            <p>Your scheduled dashboard report is ready. Please find the PDF attachment with the latest data and insights.</p>
            <p>This report was automatically generated by Dashboard Analytics.</p>
            <p style="margin-top: 20px;">
                <strong>Report Details:</strong><br>
                Generated: ${new Date().toLocaleString()}<br>
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
