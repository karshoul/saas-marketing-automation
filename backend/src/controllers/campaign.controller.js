import campaignService from '../services/campaign.service.js';
import { success, created } from '../utils/response.util.js';
import Campaign from '../models/Campaign.js';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

class CampaignController {
  async create(req, res, next) {
    try {
      const campaign = await campaignService.createCampaign(req.user.tenantId, req.body);
      return created(res, 'Tạo chiến dịch mới thành công.', campaign);
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

  async update(req, res, next) {
    try {
      const updated = await campaignService.updateCampaign(req.params.id, req.user.tenantId, req.body);
      return success(res, 'Cập nhật chiến dịch thành công.', updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await campaignService.deleteCampaign(req.params.id, req.user.tenantId);
      return success(res, 'Xóa chiến dịch thành công.');
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

  async trackOpen(req, res) {
    try {
      const { cid } = req.query;
      if (cid) {
        await Campaign.findByIdAndUpdate(cid, {
          $inc: { 'stats.openedCount': 1 }
        });
      }
    } catch (err) {}

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return res.end(TRANSPARENT_GIF);
  }

  async trackClick(req, res) {
    const { cid, url } = req.query;
    try {
      if (cid) {
        await Campaign.findByIdAndUpdate(cid, {
          $inc: { 'stats.clickedCount': 1 }
        });
      }
    } catch (err) {}

    const targetUrl = url ? decodeURIComponent(url) : 'https://google.com';
    return res.redirect(302, targetUrl);
  }
}

export default new CampaignController();