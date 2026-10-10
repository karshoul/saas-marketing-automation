import nodemailer from 'nodemailer';
import { Resend } from 'resend';

class EmailService {
  constructor() {
    // 1. Khởi tạo Resend Client (nếu có key)
    this.resendClient = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;

    // 2. Cấu hình cổng và giao thức bảo mật SMTP
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const isSecure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : smtpPort === 465;

    // 3. Khởi tạo Nodemailer Connection Pool
    this.transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'khuongmingo@gmail.com';
  }

  /**
   * Phát tán email (Tự động điều phối giữa Gmail SMTP và Resend API)
   */
  async send({ to, subject, html, fromName }) {
    const senderDisplay = `"${fromName || 'VERDIO System'}" <${this.fromEmail}>`;
    const isGmailAddress = this.fromEmail.toLowerCase().includes('@gmail.com');

    // 👉 TRƯỜNG HỢP 1: Gửi từ Gmail (@gmail.com) -> BẮT BUỘC dùng Nodemailer SMTP Pool
    // Resend cấm tuyệt đối việc mạo danh đuôi @gmail.com
    if (isGmailAddress || !this.resendClient) {
      const mailOptions = {
        from: senderDisplay,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✉️ [Gmail SMTP Real Dispatched]: Message ID: ${info.messageId} -> ${to}`);
      return {
        success: true,
        messageId: info.messageId,
        provider: 'NODEMAILER_GMAIL_SMTP'
      };
    }

    // 👉 TRƯỜNG HỢP 2: Tên miền riêng doanh nghiệp -> Chạy qua Resend HTTP REST API
    try {
      const { data, error } = await this.resendClient.emails.send({
        from: senderDisplay,
        to: [to],
        subject,
        html
      });

      if (error) throw new Error(error.message);

      return {
        success: true,
        messageId: data.id,
        provider: 'RESEND'
      };
    } catch (resendErr) {
      console.warn(`⚠️ [Resend Failed]: ${resendErr.message}. Tự động chuyển hướng sang Gmail SMTP dự phòng...`);

      // Fallback an toàn: Nếu Resend lỗi, tự động dùng Nodemailer gửi tiếp
      const info = await this.transporter.sendMail({
        from: `"${fromName || 'VERDIO System'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'FALLBACK_NODEMAILER'
      };
    }
  }

  /**
   * Gửi email khôi phục mật khẩu tài khoản
   */
  async sendPasswordResetEmail({ email, name, token }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; margin: 0; padding: 20px; }
          .email-container { max-width: 560px; margin: 20px auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; color: #f8fafc; }
          .header { background: #020617; padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; }
          .header h1 { color: #38bdf8; margin: 0; font-size: 18px; letter-spacing: 2px; font-weight: 800; }
          .content { padding: 32px; color: #cbd5e1; line-height: 1.6; font-size: 14px; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { background: linear-gradient(135deg, #6366f1, #38bdf8); color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
          .footer { background: #020617; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>VERDIO // SECURITY</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${name || 'Quý khách'}</strong>,</p>
            <p>Hệ thống nhận được yêu cầu thiết lập lại mật khẩu tài khoản VERDIO.</p>
            <p>Vui lòng bấm vào nút bên dưới để tiến hành đặt mật khẩu mới (Hiệu lực trong <strong>15 phút</strong>):</p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Đặt Lại Mật Khẩu Ngay →</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">
              Hoặc mở đường dẫn này:<br>
              <a href="${resetUrl}" style="color: #38bdf8; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} VERDIO SaaS Engine. Thư gửi tự động từ hệ thống.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.send({
      to: email,
      subject: '🔒 [VERDIO] Yêu cầu thiết lập lại mật khẩu tài khoản',
      html: htmlContent,
      fromName: 'VERDIO Security'
    });
  }

  async sendResetPasswordEmail(params) {
    return this.sendPasswordResetEmail(params);
  }
}

export default new EmailService();