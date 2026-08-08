import { Resend } from 'resend';
import { env } from '../config/env.js';

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    // Khi chưa verify domain riêng, BẮT BỘC dùng sender mặc định này của Resend
    this.fromEmail = 'VERDIO <onboarding@resend.dev>';
  }

  /**
   * Gửi email chứa link đặt lại mật khẩu khẩn cấp
   */
  async sendPasswordResetEmail({ email, name, token }) {
    // Tạo đường dẫn Reset Password hướng về giao diện Frontend
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: '🔒 [VERDIO] Yêu cầu đặt lại mật khẩu tài khoản',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1a365d; text-align: center;">Khôi phục Mật khẩu VERDIO</h2>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với hòm thư này.</p>
            <p>Vui lòng nhấn vào nút bên dưới để tiến hành thiết lập mật khẩu mới (Liên kết có hiệu lực trong <strong>15 phút</strong>):</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Đặt Lại Mật Khẩu</a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ để bảo đảm an toàn.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 11px; text-align: center;">Đây là email tự động, vui lòng không phản hồi trực tiếp thư này.</p>
          </div>
        `
      });

      console.log(`✉️ [Email Service]: Đã gửi thành công mail reset password tới ${email}. Message ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error(`❌ [Email Service Error]: Lỗi khi gửi mail qua Resend tới ${email}:`, error.message);
      // Không throw error ra ngoài làm bẻ gãy main execution flow
    }
  }

  /**
   * Phát tán email kích hoạt tài khoản
   */
 async sendVerificationEmail({ email, name, token }) {
    const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${token}`;

    try {
      const apiKey = process.env.RESEND_API_KEY;

      // Nếu không có API Key hợp lệ -> In link verify ra Terminal để test ngay ở Dev Mode
      if (!apiKey || apiKey.startsWith('re_123456')) {
        console.log(`\n==================================================`);
        console.log(`⚠️ [DEV MODE] Link kích hoạt cho <${email}>:`);
        console.log(`👉 ${verifyUrl}`);
        console.log(`==================================================\n`);
        return;
      }

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: '🔑 [VERDIO] Kích hoạt tài khoản Workspace của bạn',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Xin chào ${name},</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại VERDIO.</p>
            <p>Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:</p>
            <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Kích Hoạt Tài Khoản</a>
            <p style="margin-top: 15px; color: #666;">Hoặc copy đường link này vào trình duyệt: <br>${verifyUrl}</p>
          </div>
        `
      });

      if (error) {
        console.error(`❌ [Resend Error]:`, error.message);
        console.log(`👉 Link kích hoạt dự phòng (Dev): ${verifyUrl}`);
        return;
      }

      console.log(`✉️ [Resend Success]: Đã gửi mail kích hoạt tới ${email}. ID: ${data?.id}`);
      return data;
    } catch (err) {
      console.error(`❌ [Email Service Exception]:`, err.message);
      console.log(`👉 Link kích hoạt dự phòng (Dev): ${verifyUrl}`);
    }
  }

  /**
   * Phát tán email khôi phục mật khẩu
   */
  async sendResetPasswordEmail({ email, name, token }) {
    const resetLink = `${env.app.frontendUrl}/reset-password?token=${token}`;
    console.log(`✉️ [Email Service Background]: Gửi mail khôi phục mật khẩu đến <${email}>`);
    console.log(`🔗 Link đặt lại mật khẩu (Hết hạn sau 15p): ${resetLink}`);
    return true;
  }
}

export default new EmailService();