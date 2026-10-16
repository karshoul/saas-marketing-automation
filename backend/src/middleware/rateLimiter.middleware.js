import rateLimit from 'express-rate-limit';

/**
 * 🛡️ Limiter chống Spam Form Lead công khai
 * Quy định: Tối đa 5 lần gửi Form từ 1 địa chỉ IP trong vòng 1 phút.
 */
export const publicContactLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5, // Tối đa 5 request / IP
  standardHeaders: true, // Trả về thông tin hạn ngạch trong HTTP Header (RateLimit-Limit, RateLimit-Remaining)
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: 'Bạn đã gửi yêu cầu quá nhiều lần liên tiếp. Vui lòng thử lại sau 1 phút!'
    });
  }
});