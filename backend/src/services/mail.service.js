import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import ApiError from '../utils/apiError.util.js';
import EmailJob from '../models/EmailJob.js'; // 🔥 1. Import Model EmailJob

class MailService {
  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.isMock = process.env.MOCK_EMAIL_TRANSPORT === 'true';
    this.baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:10000';

    const rawFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'khuongmingo@gmail.com';
    const extractedEmail = rawFrom.match(/<([^>]+)>/);
    this.cleanFromEmail = extractedEmail ? extractedEmail[1].trim() : rawFrom.replace(/["']/g, '').trim();

    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const isSecure = process.env.SMTP_SECURE === 'true';

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

  injectTracking(htmlContent, { campaignId, recipientId, tenantId, jobId }) {
    if (!htmlContent) return '';

    const trackingParams = `cid=${campaignId || ''}&rid=${recipientId || ''}&tid=${tenantId || ''}&jobId=${jobId || ''}`;

    // Pixel tracking 1x1 GIF
    const trackingPixelUrl = `${this.baseUrl}/api/v1/public/track/open?${trackingParams}`;
    const pixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" border="0" alt="" style="opacity:0; width:1px; height:1px;" />`;

    // Redirect link tracking
    const trackingRedirectUrl = `${this.baseUrl}/api/v1/public/track/click?${trackingParams}&url=`;
    let modifiedHtml = htmlContent.replace(/href=["'](http[^"']+)["']/gi, (match, originalUrl) => {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `href="${trackingRedirectUrl}${encodedUrl}"`;
    });

    return `${modifiedHtml}${pixelTag}`;
  }

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
   * Gửi email chính thức & Tự động ghi nhật ký vào MongoDB (EmailJob)
   */
  async send({ to, subject, html, campaignId, recipientId, tenantId, jobId, fromName, customSmtp, isMock = false }) {
    if (this.isMock || isMock) {
      const simulatedDelay = Math.floor(Math.random() * 100) + 50;
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // 🔥 2. Tự động tạo Document EmailJob trong MongoDB nếu có thông tin tenantId
    let emailJob = null;
    if (tenantId) {
      try {
        emailJob = await EmailJob.create({
          tenantId: tenantId,
          campaignId: campaignId || null,
          jobBullId: jobId ? String(jobId) : `job_${Date.now()}`,
          recipientEmail: to,
          type: campaignId ? 'MARKETING' : 'TRANSACTIONAL',
          priority: 1,
          status: 'PROCESSING',
          dispatchedAt: new Date()
        });
      } catch (err) {
        console.error('❌ Lỗi tạo EmailJob log:', err.message);
      }
    }

    const activeJobId = emailJob ? emailJob._id : jobId;

    // 🔥 3. Chèn Pixel Tracking gắn mã activeJobId
    const trackedHtml = this.injectTracking(html, { campaignId, recipientId, tenantId, jobId: activeJobId });
    const displayName = fromName || process.env.EMAIL_FROM_NAME || 'VERDIO Platform';
    const senderDisplay = `"${displayName}" <${customSmtp?.senderEmail || this.cleanFromEmail}>`;
    const plainText = html ? html.replace(/<[^>]*>/g, '').trim() : subject;

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

      // 🔥 4. Cập nhật trạng thái EmailJob thành COMPLETED
      if (emailJob) {
        await EmailJob.findByIdAndUpdate(emailJob._id, {
          status: 'COMPLETED',
          completedAt: new Date()
        });
      }

      console.log(`✉️ [SMTP Thành Công!]: Record EmailJob #${activeJobId} -> ${to}`);
      return { success: true, messageId: info.messageId, jobId: activeJobId, provider: customSmtp ? 'CUSTOM_SMTP' : 'SYSTEM_SMTP' };
    } catch (err) {
      // 🔥 5. Nếu gửi lỗi -> Đánh dấu FAILED
      if (emailJob) {
        await EmailJob.findByIdAndUpdate(emailJob._id, {
          status: 'FAILED',
          errorMessage: err.message
        });
      }
      console.error(`❌ [SMTP Lỗi]: Không thể gửi tới ${to}:`, err.message);
      throw err;
    }
  }
}

export default new MailService();