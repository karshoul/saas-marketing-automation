import nodemailer from 'nodemailer';
import { Resend } from 'resend';

class MailService {
  constructor() {
    // 1. Khởi tạo Resend (nếu sau này có domain riêng)
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.isMock = process.env.MOCK_EMAIL_TRANSPORT === 'true';
    this.baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';

    // 2. Khởi tạo kết nối Gmail SMTP bằng Nodemailer Pool (Chống nghẽn socket)
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    this.transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER || 'khuongmingo@gmail.com',
        pass: process.env.SMTP_PASS || 'dtcdypasfxzmfvcl'
      }
    });

    this.fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'khuongmingo@gmail.com';
  }

  /**
   * Tự động chèn Tracking Pixel (1x1 GIF) và ghi đè các link href để theo dõi lượt click
   */
  injectTracking(htmlContent, { campaignId, recipientId, tenantId }) {
    if (!htmlContent) return '';

    const trackingParams = `cid=${campaignId || ''}&rid=${recipientId || ''}&tid=${tenantId || ''}`;

    // 1. Chèn Pixel ảnh 1x1 ở cuối email để đo Open Rate
    const trackingPixelUrl = `${this.baseUrl}/api/campaigns/track/open?${trackingParams}`;
    const pixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none !important;" alt="" />`;

    // 2. Thay thế các link <a href="..."> thành Link Redirect để đo Click Rate
    const trackingRedirectUrl = `${this.baseUrl}/api/campaigns/track/click?${trackingParams}&url=`;
    let modifiedHtml = htmlContent.replace(/href=["'](http[^"']+)["']/gi, (match, originalUrl) => {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `href="${trackingRedirectUrl}${encodedUrl}"`;
    });

    return `${modifiedHtml}${pixelTag}`;
  }

  /**
   * Gửi email chính thức (BullMQ Worker gọi vào đây)
   */
  async send({ to, subject, html, campaignId, recipientId, tenantId, fromName, isMock = false }) {
    // 1. Kiểm tra chế độ giả lập Mock
    if (this.isMock || isMock) {
      const simulatedDelay = Math.floor(Math.random() * 100) + 50;
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // 2. Chèn mã theo dõi Tracking Pixel
    const trackedHtml = this.injectTracking(html, { campaignId, recipientId, tenantId });
    const senderDisplay = `"${fromName || 'VERDIO System'}" <${this.fromEmail}>`;

    // 3. Ưu tiên gửi bằng Gmail SMTP (Vì bạn dùng đuôi @gmail.com)
    // Điều này giúp tránh hoàn toàn lỗi "domain is not verified" của Resend!
    const isGmail = this.fromEmail.toLowerCase().includes('@gmail.com');

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

    // 4. Dự phòng khi bạn có domain riêng xịn qua Resend
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