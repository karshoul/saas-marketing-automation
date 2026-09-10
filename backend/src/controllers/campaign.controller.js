import campaignService from '../services/campaign.service.js';
import { success } from '../utils/response.util.js';
import Campaign from '../models/Campaign.js';

// Ảnh GIF 1x1 pixel trong suốt dùng cho Tracking Pixel
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

class CampaignController {
  async create(req, res, next) {
    try {
      const campaign = await campaignService.createCampaign(req.user.tenantId, req.body);
      return success(res, 'Tạo chiến dịch mới thành công.', campaign, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await campaignService.getCampaigns(req.user.tenantId, req.query);
      return success(res, 'Lấy danh sách chiến dịch thành công.', result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const campaign = await campaignService.getCampaignById(req.params.id, req.user.tenantId);
      return success(res, 'Lấy chi tiết chiến dịch thành công.', campaign);
    } catch (error) {
      next(error);
    }
  }

  async trigger(req, res, next) {
    try {
      const result = await campaignService.triggerCampaign(req.params.id, req.user.tenantId);
      return success(res, 'Kích hoạt phát tán chiến dịch thành công.', result);
    } catch (error) {
      next(error);
    }
  }

  async getQueueStatus(req, res, next) {
    try {
      const metrics = await campaignService.getCampaignQueueStatus(req.params.id, req.user.tenantId);
      return success(res, 'Lấy trạng thái hàng đợi chiến dịch thành công.', metrics);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 📊 PUBLIC TRACKING CONTROLLERS
  // ==========================================

  /**
   * Xử lý Tracking Pixel khi người nhận mở email
   */
  async trackOpen(req, res) {
    try {
      const { cid } = req.query;
      if (cid) {
        await Campaign.findByIdAndUpdate(cid, {
          $inc: { 'stats.openedCount': 1 }
        });
      }
    } catch (err) {
      // Bỏ qua lỗi để không làm hỏng trải nghiệm đọc thư của người dùng
    }

    // Luôn trả về ảnh GIF 1x1 và vô hiệu hóa cache
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, post-check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return res.end(TRANSPARENT_GIF);
  }

  /**
   * Xử lý đếm lượt click và redirect người nhận tới liên kết gốc
   */
  async trackClick(req, res) {
    const { cid, url } = req.query;
    try {
      if (cid) {
        await Campaign.findByIdAndUpdate(cid, {
          $inc: { 'stats.clickedCount': 1 }
        });
      }
    } catch (err) {
      // Bỏ qua lỗi
    }

    // Redirect tới URL gốc
    const targetUrl = url ? decodeURIComponent(url) : 'https://google.com';
    return res.redirect(302, targetUrl);
  }
}

export default new CampaignController();