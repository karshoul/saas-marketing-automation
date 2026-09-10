import Tenant from '../models/Tenant.js';
import Order from '../models/Order.js';

// Cấu hình định mức gói cước SaaS VERDIO
export const PLAN_CONFIGS = {
  FREE: {
    name: 'Free Starter',
    amount: 0,
    maxContacts: 500,
    monthlyEmailLimit: 3000,
    maxAutomations: 1,
    tierWeight: 0
  },
  PRO: {
    name: 'Pro Automation',
    amount: 590000, // 590,000 VND / tháng
    maxContacts: 10000,
    monthlyEmailLimit: 50000,
    maxAutomations: 10,
    tierWeight: 5
  },
  ENTERPRISE: {
    name: 'Enterprise Ultra',
    amount: 1890000, // 1,890,000 VND / tháng
    maxContacts: 100000,
    monthlyEmailLimit: 500000,
    maxAutomations: 100,
    tierWeight: 10
  }
};

// Cấu hình nhận thanh toán VietQR ngân hàng (Bạn có thể đổi STK của bạn ở đây)
const BANK_CONFIG = {
  BANK_ID: 'MB', // MBBank, VCB, ACB, TPBank, ICB,...
  ACCOUNT_NO: '0388999999', // Số tài khoản ngân hàng nhận tiền
  ACCOUNT_NAME: 'CONG TY VERDIO SAAS'
};

class BillingService {
  /**
   * Tạo yêu cầu thanh toán gói cước
   */
  async createSubscriptionOrder(tenantId, userId, targetPlan) {
    const config = PLAN_CONFIGS[targetPlan];
    if (!config || targetPlan === 'FREE') {
      throw new Error('Gói cước nâng cấp không hợp lệ.');
    }

    // Sinh mã đơn hàng ngẫu nhiên duy nhất
    const orderCode = `VDO-${Date.now().toString().slice(-6)}`;

    const order = await Order.create({
      tenantId,
      userId,
      orderCode,
      plan: targetPlan,
      amount: config.amount,
      status: 'PENDING'
    });

    // Tạo link ảnh VietQR động chuẩn format QuickLink (VietQR.io)
    const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.BANK_ID}-${BANK_CONFIG.ACCOUNT_NO}-compact2.png?amount=${order.amount}&addInfo=${order.orderCode}&accountName=${encodeURIComponent(BANK_CONFIG.ACCOUNT_NAME)}`;

    return {
      orderId: order._id,
      orderCode: order.orderCode,
      plan: targetPlan,
      amount: order.amount,
      bankInfo: BANK_CONFIG,
      qrUrl,
      status: order.status
    };
  }

  /**
   * Kiểm tra trạng thái đơn hàng (Polling từ Frontend)
   */
  async checkOrderStatus(orderId, tenantId) {
    const order = await Order.findOne({ _id: orderId, tenantId });
    if (!order) throw new Error('Không tìm thấy đơn hàng.');
    return order;
  }

  /**
   * Kích hoạt nâng cấp gói cho Tenant (Gọi khi Webhook thanh toán gửi về, hoặc bấm Xác Nhận Test)
   */
  async activatePlan(orderCode) {
    const order = await Order.findOne({ orderCode, status: 'PENDING' });
    if (!order) {
      throw new Error('Đơn hàng không tồn tại hoặc đã được xử lý.');
    }

    const planInfo = PLAN_CONFIGS[order.plan];
    if (!planInfo) {
      throw new Error('Cấu hình gói không hợp lệ.');
    }

    // 1. Đánh dấu đơn hàng đã thanh toán
    order.status = 'PAID';
    order.paidAt = new Date();
    await order.save();

    // 2. Tìm Tenant và cập nhật trực tiếp object
    const tenant = await Tenant.findById(order.tenantId);
    if (!tenant) {
      throw new Error('Không tìm thấy Tenant liên kết với đơn hàng.');
    }

    const nextExpire = new Date();
    nextExpire.setDate(nextExpire.getDate() + 30);

    tenant.plan = order.plan;
    tenant.subscriptionPlan = order.plan;
    tenant.planExpiresAt = nextExpire;
    
    // Ghi đè trực tiếp toàn bộ object quotas
    tenant.quotas = {
      maxContacts: planInfo.maxContacts,
      monthlyEmailLimit: planInfo.monthlyEmailLimit,
      maxAutomations: planInfo.maxAutomations
    };

    // Đánh dấu Mongoose nhận biết object quotas đã bị biến đổi
    tenant.markModified('quotas');
    await tenant.save();

    console.log(`🎉 [Billing Success]: Đã kích hoạt gói ${order.plan} cho Tenant: ${tenant.name} (${tenant._id}) - Quota mới: ${tenant.quotas.monthlyEmailLimit} emails`);

    return { 
      success: true, 
      plan: tenant.plan,
      quotas: tenant.quotas 
    };
  }
}

export default new BillingService();