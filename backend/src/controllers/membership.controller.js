import membershipService from '../services/membership.service.js';
import { success } from '../utils/response.util.js';

class MembershipController {
  async getMembers(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const members = await membershipService.getWorkspaceMembers(tenantId);
      return success(res, 'Lấy danh sách thành viên thành công.', members);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const actorId = req.user.id;
      const { userId } = req.params;
      const { role } = req.body;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      const result = await membershipService.updateMemberRole(tenantId, userId, role, actorId, context);
      return success(res, 'Cập nhật vai trò thành viên thành công.', result);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const actorId = req.user.id;
      const { userId } = req.params;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      await membershipService.removeMember(tenantId, userId, actorId, context);
      return success(res, 'Đã xóa thành viên khỏi Workspace.');
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const actorId = req.user.id;
      const { email, role } = req.body;

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown Agent'
      };

      const result = await membershipService.inviteMember(tenantId, email, role, actorId, context);
      return success(res, 'Mời thành viên vào Workspace thành công.', result);
    } catch (error) {
      next(error);
    }
  }

  async getPendingInvitations(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const invitations = await membershipService.getPendingInvitations(userId);
      return success(res, 'Lấy danh sách lời mời thành công.', invitations);
    } catch (error) {
      next(error);
    }
  }

  async respondInvitation(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { id } = req.params; // membership ID
      const { action } = req.body; // 'ACCEPT' hoặc 'REJECT'

      const context = {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ua: req.headers['user-agent'] || 'Unknown'
      };

      const result = await membershipService.respondInvitation(id, userId, action, context);
      return success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new MembershipController();