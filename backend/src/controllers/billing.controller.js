import billingService, { PLAN_CONFIGS } from '../services/billing.service.js';
import { success } from '../utils/response.util.js';

class BillingController {
  // Lấy danh sách bảng giá các gói
  async getPlans(req, res, next) {
    try {
      return success(res, 'Lấy danh sách gói cước thành công.', PLAN_CONFIGS);
    } catch (err) {
      next(err);
    }
  }

  // Khởi tạo thanh toán mua gói
  async subscribe(req, res, next) {
    try {
      const { plan } = req.body;
      const result = await billingService.createSubscriptionOrder(
        req.user.tenantId,
        req.user.id || req.user._id,
        plan
      );
      return success(res, 'Khởi tạo đơn hàng thanh toán thành công.', result, 201);
    } catch (err) {
      next(err);
    }
  }

  // Kiểm tra trạng thái đơn hàng
  async checkOrder(req, res, next) {
    try {
      const order = await billingService.checkOrderStatus(req.params.orderId, req.user.tenantId);
      return success(res, 'Trạng thái đơn hàng.', order);
    } catch (err) {
      next(err);
    }
  }

  // Webhook hoặc endpoint xác nhận thanh toán (Mock/Production)
  async confirmPayment(req, res, next) {
    try {
      const { orderCode } = req.body;
      const result = await billingService.activatePlan(orderCode);
      return success(res, 'Kích hoạt gói cước thành công.', result);
    } catch (err) {
      next(err);
    }
  }
}

export default new BillingController();