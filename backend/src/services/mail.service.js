import { Resend } from 'resend';
import { env } from '../config/env.js';

class MailService {
  constructor() {
    const apiKey = process.env.RESEND_API_KEY || 're_mock_key';
    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.EMAIL_FROM || 'VERDIO Platform <onboarding@resend.dev>';
    this.isMock = process.env.MOCK_EMAIL_TRANSPORT === 'true';
    this.baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';
  }

  /**
   * Tự động chèn Tracking Pixel (1x1 GIF) và ghi đè các link href để theo dõi lượt click
   */
  injectTracking(htmlContent, { campaignId, recipientId, tenantId }) {
    if (!htmlContent) return '';

    const trackingParams = `cid=${campaignId}&rid=${recipientId}&tid=${tenantId}`;

    // 1. Chèn Pixel ảnh 1x1 ở cuối email để đo Open Rate
    const trackingPixelUrl = `${this.baseUrl}/api/campaigns/track/open?${trackingParams}`;
    const pixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none !important;" alt="" />`;

    // 2. Thay thế các đường link <a href="..."> thành Link Redirect để đo Click Rate
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
  async send({ to, subject, html, campaignId, recipientId, tenantId, isMock = false }) {
    // 1. Kiểm tra nếu đang chạy ở chế độ giả lập (Mock tải)
    if (this.isMock || isMock) {
      // Giả lập độ trễ mạng thực tế từ 50ms - 150ms
      const simulatedDelay = Math.floor(Math.random() * 100) + 50;
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
      return { success: true, messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}` };
    }

    // 2. Chèn mã theo dõi vào nội dung email
    const trackedHtml = this.injectTracking(html, { campaignId, recipientId, tenantId });

    // 3. Gửi thật qua Resend API
    const response = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject,
      html: trackedHtml
    });

    if (response.error) {
      throw new Error(`Resend API Error: ${response.error.message}`);
    }

    return { success: true, messageId: response.data?.id };
  }
}

export default new MailService();