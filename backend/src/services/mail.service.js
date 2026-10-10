import nodemailer from 'nodemailer';
import { Resend } from 'resend';

class MailService {
  constructor() {
    // 1. Khởi tạo Resend (nếu có API Key)
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.isMock = process.env.MOCK_EMAIL_TRANSPORT === 'true';
    this.baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';

    // 2. Chuẩn hóa địa chỉ email người gửi sạch (loại bỏ tên và ngoặc nhọn nếu có)
    const rawFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'khuongmingo@gmail.com';
    const extractedEmail = rawFrom.match(/<([^>]+)>/);
    this.cleanFromEmail = extractedEmail ? extractedEmail[1].trim() : rawFrom.replace(/["']/g, '').trim();

    // 3. Khởi tạo kết nối Gmail SMTP Pool
    // Đổi cấu hình sang cổng 587 và tắt secure mặc định để dùng STARTTLS
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const isSecure = process.env.SMTP_SECURE === 'true'; // Cổng 587 bắt buộc secure = false

this.transporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: isSecure, // false cho cổng 587
  auth: {
    user: process.env.SMTP_USER || 'khuongmingo@gmail.com',
    pass: process.env.SMTP_PASS || 'dtcdypasfxzmfvcl'
  },
  tls: {
    rejectUnauthorized: false // Bỏ qua lỗi bắt tay TLS trên hạ tầng proxy Render
  }
});
  }

  /**
   * Tự động chèn Tracking Pixel (1x1 GIF) và ghi đè các link href
   */
  injectTracking(htmlContent, { campaignId, recipientId, tenantId }) {
    if (!htmlContent) return '';

    const trackingParams = `cid=${campaignId || ''}&rid=${recipientId || ''}&tid=${tenantId || ''}`;

    const trackingPixelUrl = `${this.baseUrl}/api/campaigns/track/open?${trackingParams}`;
    const pixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none !important;" alt="" />`;

    const trackingRedirectUrl = `${this.baseUrl}/api/campaigns/track/click?${trackingParams}&url=`;
    let modifiedHtml = htmlContent.replace(/href=["'](http[^"']+)["']/gi, (match, originalUrl) => {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `href="${trackingRedirectUrl}${encodedUrl}"`;
    });

    return `${modifiedHtml}${pixelTag}`;
  }

  /**
   * Gửi email chính thức
   */
  async send({ to, subject, html, campaignId, recipientId, tenantId, fromName, isMock = false }) {
    if (this.isMock || isMock) {
      const simulatedDelay = Math.floor(Math.random() * 100) + 50;
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    const trackedHtml = this.injectTracking(html, { campaignId, recipientId, tenantId });
    
    // Ghép định dạng chuẩn: "Tên Hiển Thị" <email@domain.com>
    const displayName = fromName || process.env.EMAIL_FROM_NAME || 'VERDIO Platform';
    const senderDisplay = `"${displayName}" <${this.cleanFromEmail}>`;

    // Ưu tiên gửi qua Gmail SMTP nếu dùng tài khoản @gmail.com hoặc không cấu hình Resend
    const isGmail = this.cleanFromEmail.toLowerCase().includes('@gmail.com');

    if (isGmail || !this.resend) {
      try {
        const info = await this.transporter.sendMail({
          from: senderDisplay,
          to,
          subject,
          html: trackedHtml
        });
        console.log(`✉️ [Gmail SMTP Thành Công!]: Message ID: ${info.messageId} -> ${to}`);
        return { success: true, messageId: info.messageId, provider: 'GMAIL_SMTP' };
      } catch (err) {
        console.error(`❌ [Gmail SMTP Lỗi]: Không thể gửi tới ${to}:`, err.message);
        throw err;
      }
    }

    // Dự phòng qua Resend khi có domain riêng
    const response = await this.resend.emails.send({
      from: senderDisplay,
      to: [to],
      subject,
      html: trackedHtml
    });

    if (response.error) {
      throw new Error(`Resend API Error: ${response.error.message}`);
    }

    return { success: true, messageId: response.data?.id, provider: 'RESEND' };
  }
}

export default new MailService();