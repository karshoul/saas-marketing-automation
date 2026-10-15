import nodemailer from 'nodemailer';
import { Resend } from 'resend';

class MailService {
  constructor() {
    // 1. Khởi tạo Resend (nếu có API Key)
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.isMock = process.env.MOCK_EMAIL_TRANSPORT === 'true';
    this.baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';

    // 2. Tách và chuẩn hóa địa chỉ email thuần túy (loại bỏ ngoặc nhọn/tên trùng lặp)
    const rawFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'khuongmingo@gmail.com';
    const extractedEmail = rawFrom.match(/<([^>]+)>/);
    this.cleanFromEmail = extractedEmail ? extractedEmail[1].trim() : rawFrom.replace(/["']/g, '').trim();

    // 3. Khởi tạo kết nối Gmail SMTP Pool (Mặc định dùng cổng 587 STARTTLS)
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const isSecure = process.env.SMTP_SECURE === 'true';

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
      },
      tls: {
        rejectUnauthorized: false // Bỏ qua lỗi SSL/TLS proxy nếu có
      }
    });
  }

  /**
   * Tự động chèn Tracking Pixel (1x1 GIF) và ghi đè các link href để theo dõi lượt click
   */
  injectTracking(htmlContent, { campaignId, recipientId, tenantId }) {
    if (!htmlContent) return '';

    const trackingParams = `cid=${campaignId || ''}&rid=${recipientId || ''}&tid=${tenantId || ''}`;

    // 1. Chèn Pixel ảnh 1x1 đo Open Rate (Đã ẩn bằng CSS chuẩn opacity/size, không dùng display:none)
    const trackingPixelUrl = `${this.baseUrl}/api/campaigns/track/open?${trackingParams}`;
    const pixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" border="0" alt="" style="opacity:0; width:1px; height:1px;" />`;

    // 2. Thay thế các link <a href="..."> thành Link Redirect đo Click Rate
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

    // 2. Chèn mã tracking & tạo bản chữ thuần túy (plainText) vượt qua Spam Filter
    const trackedHtml = this.injectTracking(html, { campaignId, recipientId, tenantId });
    const displayName = fromName || process.env.EMAIL_FROM_NAME || 'VERDIO Platform';
    const senderDisplay = `"${displayName}" <${this.cleanFromEmail}>`;
    const plainText = html ? html.replace(/<[^>]*>/g, '').trim() : subject;

    // 3. Ưu tiên gửi bằng Gmail SMTP (Vì bạn dùng đuôi @gmail.com)
    const isGmail = this.cleanFromEmail.toLowerCase().includes('@gmail.com');

    if (isGmail || !this.resend) {
      try {
        const info = await this.transporter.sendMail({
          from: senderDisplay,
          to,
          subject,
          text: plainText, // Bản chữ thuần túy chống bị nhận diện thư rác
          html: trackedHtml,
          headers: {
            'X-Mailer': 'VERDIO SaaS Platform Mailer',
            'Precedence': 'bulk'
          }
        });
        console.log(`✉️ [Gmail SMTP Thành Công!]: Message ID: ${info.messageId} -> ${to}`);
        return { success: true, messageId: info.messageId, provider: 'GMAIL_SMTP' };
      } catch (err) {
        console.error(`❌ [Gmail SMTP Lỗi]: Không thể gửi tới ${to}:`, err.message);
        throw err;
      }
    }

    // 4. Dự phòng qua Resend API khi có domain riêng
    const response = await this.resend.emails.send({
      from: senderDisplay,
      to: [to],
      subject,
      text: plainText,
      html: trackedHtml
    });

    if (response.error) {
      throw new Error(`Resend API Error: ${response.error.message}`);
    }

    return { success: true, messageId: response.data?.id, provider: 'RESEND' };
  }
}

export default new MailService();