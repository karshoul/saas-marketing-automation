import Membership from '../models/Membership.js';
import User from '../models/User.js';
import ApiError from '../utils/apiError.util.js';
import auditLogRepository from '../repositories/auditLog.repository.js';
import { AUDIT_ACTIONS } from '../constants/audit/actions.js';
import { AUDIT_STATUS } from '../constants/audit/status.js';

class MembershipService {
  /**
   * Lấy danh sách thành viên trong Workspace
   */
  async getWorkspaceMembers(tenantId) {
    const memberships = await Membership.find({ tenantId })
      .populate('userId', 'name email avatar createdAt')
      .sort({ createdAt: -1 });

    return memberships.map(m => ({
      id: m._id,
      userId: m.userId?._id,
      name: m.userId?.name,
      email: m.userId?.email,
      avatar: m.userId?.avatar,
      role: m.role, // 'OWNER' | 'ADMIN' | 'MEMBER'
      status: m.status,
      joinedAt: m.joinedAt
    }));
  }

  /**
   * Cập nhật vai trò thành viên (Thăng cấp Admin hoặc hạ cấp Member)
   */
  async updateMemberRole(tenantId, targetUserId, newRole, actorId, context) {
    if (!['ADMIN', 'MEMBER'].includes(newRole)) {
      throw new ApiError(400, 'Vai trò không hợp lệ. Chỉ chấp nhận ADMIN hoặc MEMBER.');
    }

    // Tìm membership của người cần đổi quyền
    const targetMembership = await Membership.findOne({ tenantId, userId: targetUserId });
    if (!targetMembership) {
      throw new ApiError(404, 'Không tìm thấy thành viên này trong Workspace.');
    }

    // Không cho phép tự đổi quyền hoặc đổi quyền của chính Chủ sở hữu (OWNER) qua API này
    if (targetMembership.role === 'OWNER') {
      throw new ApiError(403, 'Không thể thay đổi vai trò của Chủ sở hữu (OWNER) thông qua thao tác này.');
    }

    const oldRole = targetMembership.role;
    targetMembership.role = newRole;
    await targetMembership.save();

    // Ghi nhận Audit Log an ninh
    await auditLogRepository.createLog({
      tenantId,
      userId: actorId,
      action: AUDIT_ACTIONS.MEMBER_ROLE_UPDATE || 'MEMBER_ROLE_UPDATE',
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { targetUserId, oldRole, newRole }
    });

    return {
      userId: targetUserId,
      newRole: targetMembership.role
    };
  }

  /**
   * Xóa thành viên khỏi Workspace
   */
  async removeMember(tenantId, targetUserId, actorId, context) {
    const targetMembership = await Membership.findOne({ tenantId, userId: targetUserId });
    if (!targetMembership) {
      throw new ApiError(404, 'Không tìm thấy thành viên trong Workspace.');
    }

    if (targetMembership.role === 'OWNER') {
      throw new ApiError(403, 'Không thể xóa Chủ sở hữu khỏi Workspace.');
    }

    await Membership.deleteOne({ _id: targetMembership._id });

    // Ghi nhận Audit Log
    await auditLogRepository.createLog({
      tenantId,
      userId: actorId,
      action: AUDIT_ACTIONS.MEMBER_REMOVED || 'MEMBER_REMOVED',
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { targetUserId }
    });

    return true;
  }

  /**
   * Mời thành viên mới vào Workspace bằng email
   */
  async inviteMember(tenantId, email, role, actorId, context) {
    if (!['ADMIN', 'MEMBER'].includes(role)) {
      throw new ApiError(400, 'Vai trò không hợp lệ. Chỉ chấp nhận ADMIN hoặc MEMBER.');
    }

    const cleanEmail = email.toLowerCase().trim();
    
    // 1. Kiểm tra xem user có tồn tại trên toàn hệ thống không
    const targetUser = await User.findOne({ email: cleanEmail });
    if (!targetUser) {
      throw new ApiError(404, 'Không tìm thấy tài khoản với email này trên hệ thống. Vui lòng yêu cầu họ đăng ký tài khoản trước.');
    }

    // 2. Kiểm tra xem user này đã thuộc Workspace chưa
    const existingMembership = await Membership.findOne({ tenantId, userId: targetUser._id });
    if (existingMembership) {
      throw new ApiError(400, 'Thành viên này đã là thành viên của Workspace hiện tại.');
    }

    // 3. Tạo bản ghi membership mới
    const newMembership = await Membership.create({
      tenantId,
      userId: targetUser._id,
      role,
      status: 'ACTIVE'
    });

    // 4. Ghi nhận Audit Log
    await auditLogRepository.createLog({
      tenantId,
      userId: actorId,
      action: 'MEMBER_INVITED',
      ipAddress: context.ip,
      userAgent: context.ua,
      status: AUDIT_STATUS.SUCCESS,
      metadata: { invitedEmail: cleanEmail, role }
    });

    return {
      userId: targetUser._id,
      email: targetUser.email,
      name: targetUser.name,
      role: newMembership.role
    };
  }

  /**
   * Lấy danh sách lời mời đang chờ (PENDING) của user hiện tại
   */
  async getPendingInvitations(userId) {
    const pendingMemberships = await Membership.find({ userId, status: 'PENDING' })
      .populate('tenantId', 'name slug status')
      .sort({ createdAt: -1 });

    return pendingMemberships.map(m => ({
      id: m._id,
      tenantId: m.tenantId?._id,
      workspaceName: m.tenantId?.name,
      slug: m.tenantId?.slug,
      role: m.role,
      invitedAt: m.createdAt
    }));
  }

  /**
   * Phản hồi lời mời: Chấp nhận (ACTIVE) hoặc Từ chối (Xóa bản ghi)
   */
  async respondInvitation(membershipId, userId, action, context) {
    const membership = await Membership.findOne({ _id: membershipId, userId, status: 'PENDING' });
    if (!membership) {
      throw new ApiError(404, 'Không tìm thấy lời mời hoặc lời mời đã hết hiệu lực.');
    }

    if (action === 'ACCEPT') {
      membership.status = 'ACTIVE';
      await membership.save();
      return { message: 'Đã chấp nhận lời mời tham gia Workspace.' };
    } else if (action === 'REJECT') {
      await Membership.deleteOne({ _id: membership._id });
      return { message: 'Đã từ chối lời mời.' };
    } else {
      throw new ApiError(400, 'Hành động không hợp lệ. Chỉ chấp nhận ACCEPT hoặc REJECT.');
    }
  }
}

export default new MembershipService();