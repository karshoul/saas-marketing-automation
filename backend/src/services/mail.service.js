import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import ApiError from '../utils/apiError.util.js';

class MailService {
  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.isMock = process.env.MOCK_EMAIL_TRANSPORT === 'true';
    
    // 💡 SỬA 1: Đổi mặc định từ port 5000 sang 10000
    this.baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:10000';

    const rawFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'khuongmingo@gmail.com';
    const extractedEmail = rawFrom.match(/<([^>]+)>/);
    this.cleanFromEmail = extractedEmail ? extractedEmail[1].trim() : rawFrom.replace(/["']/g, '').trim();

    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const isSecure = process.env.SMTP_SECURE === 'true';

    // Transporter mặc định của Hệ Thống VERDIO
    this.defaultTransporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER || 'khuongmingo@gmail.com',
        pass: process.env.SMTP_PASS || 'dtcdypasfxzmfvcl'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Helper: Khởi tạo Transporter riêng nếu Tenant dùng Custom SMTP
   */
  getTransporter(customSmtp) {
    if (customSmtp && customSmtp.host && customSmtp.user && customSmtp.pass) {
      return nodemailer.createTransport({
        host: customSmtp.host,
        port: Number(customSmtp.port) || 465,
        secure: Number(customSmtp.port) === 465,
        auth: {
          user: customSmtp.user,
          pass: customSmtp.pass
        },
        tls: { rejectUnauthorized: false }
      });
    }
    return this.defaultTransporter;
  }

  /**
   * 💡 SỬA 2: Bổ sung `jobId` vào Tracking Pixel để liên kết với `EmailJob.js`
   */
  injectTracking(htmlContent, { campaignId, recipientId, tenantId, jobId }) {
    if (!htmlContent) return '';

    const trackingParams = `cid=${campaignId || ''}&rid=${recipientId || ''}&tid=${tenantId || ''}&jobId=${jobId || ''}`;

    // 1. Chèn Pixel ảnh 1x1 đo Open Rate
    const trackingPixelUrl = `${this.baseUrl}/api/v1/public/track/open?${trackingParams}`;
    const pixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" border="0" alt="" style="opacity:0; width:1px; height:1px;" />`;

    // 2. Thay thế các link <a href="..."> thành Link Redirect đo Click Rate
    const trackingRedirectUrl = `${this.baseUrl}/api/v1/public/track/click?${trackingParams}&url=`;
    let modifiedHtml = htmlContent.replace(/href=["'](http[^"']+)["']/gi, (match, originalUrl) => {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `href="${trackingRedirectUrl}${encodedUrl}"`;
    });

    return `${modifiedHtml}${pixelTag}`;
  }

  /**
   * 💡 SỬA 3: Hàm Kiểm Tra Kết Nối SMTP (Dùng cho API Test SMTP ở Tab 3)
   */
  async verifySmtpConnection(smtpConfig) {
    const testTransporter = this.getTransporter(smtpConfig);
    try {
      await testTransporter.verify();
      return true;
    } catch (error) {
      throw new ApiError(400, `Kết nối SMTP thất bại: ${error.message}`);
    }
  }

  /**
   * Gửi email chính thức
   */
  async send({ to, subject, html, campaignId, recipientId, tenantId, jobId, fromName, customSmtp, isMock = false }) {
    if (this.isMock || isMock) {
      const simulatedDelay = Math.floor(Math.random() * 100) + 50;
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // Chèn mã tracking
    const trackedHtml = this.injectTracking(html, { campaignId, recipientId, tenantId, jobId });
    const displayName = fromName || process.env.EMAIL_FROM_NAME || 'VERDIO Platform';
    const senderDisplay = `"${displayName}" <${customSmtp?.senderEmail || this.cleanFromEmail}>`;
    const plainText = html ? html.replace(/<[^>]*>/g, '').trim() : subject;

    // Lấy Transporter tương ứng (Nếu tenant có customSmtp thì dùng, không thì dùng hệ thống)
    const activeTransporter = this.getTransporter(customSmtp);

    try {
      const info = await activeTransporter.sendMail({
        from: senderDisplay,
        to,
        subject,
        text: plainText,
        html: trackedHtml,
        headers: {
          'X-Mailer': 'VERDIO SaaS Platform Mailer',
          'Precedence': 'bulk'
        }
      });
      console.log(`✉️ [SMTP Thành Công!]: Message ID: ${info.messageId} -> ${to}`);
      return { success: true, messageId: info.messageId, provider: customSmtp ? 'CUSTOM_SMTP' : 'SYSTEM_SMTP' };
    } catch (err) {
      console.error(`❌ [SMTP Lỗi]: Không thể gửi tới ${to}:`, err.message);
      throw err;
    }
  }
}

export default new MailService();