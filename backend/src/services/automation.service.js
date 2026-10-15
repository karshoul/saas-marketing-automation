import automationRepository from '../repositories/automation.repository.js';
import AutomationExecution from '../models/AutomationExecution.js';
import Automation from '../models/Automation.js';
import { automationQueue } from '../queues/automation.queue.js';
import ApiError from '../utils/apiError.util.js';

class AutomationService {
  async createAutomation(tenantId, data) {
    if (!data.name || !data.name.trim()) {
      throw new ApiError(400, 'Tên kịch bản tự động hóa không được để trống.');
    }

    return await automationRepository.create({
      ...data,
      tenantId,
      status: 'DRAFT',
      steps: Array.isArray(data.steps) ? data.steps : []
    });
  }

  async getAutomations(tenantId, query) {
    const { page = 1, limit = 10, status, search } = query;
    const filter = { tenantId };

    if (status && status !== 'ALL') filter.status = status;
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(),$options: 'i' };
    }

    return await automationRepository.findAll(filter, { page, limit });
  }

  async getAutomationById(id, tenantId) {
    const automation = await automationRepository.findById(id, tenantId);
    if (!automation) throw new ApiError(404, 'Không tìm thấy kịch bản tự động.');
    return automation;
  }

  async updateAutomation(id, tenantId, updateData) {
    const automation = await automationRepository.findById(id, tenantId);
    if (!automation) throw new ApiError(404, 'Không tìm thấy kịch bản để cập nhật.');

    return await automationRepository.updateById(id, tenantId, updateData);
  }

  async toggleStatus(id, tenantId) {
    const automation = await automationRepository.findById(id, tenantId);
    if (!automation) throw new ApiError(404, 'Không tìm thấy kịch bản.');

    let nextStatus = 'ACTIVE';
    if (automation.status === 'ACTIVE') {
      nextStatus = 'PAUSED';
    } else {
      if (!automation.steps || automation.steps.length === 0) {
        throw new ApiError(400, 'Kịch bản phải có ít nhất 1 bước hành động trước khi kích hoạt.');
      }
      nextStatus = 'ACTIVE';
    }

    return await automationRepository.updateById(id, tenantId, { status: nextStatus });
  }

  async deleteAutomation(id, tenantId) {
    const automation = await automationRepository.findById(id, tenantId);
    if (!automation) throw new ApiError(404, 'Không tìm thấy kịch bản để xóa.');

    if (automation.status === 'ACTIVE') {
      throw new ApiError(400, 'Vui lòng tạm dừng (PAUSE) kịch bản trước khi xóa.');
    }

    return await automationRepository.deleteById(id, tenantId);
  }

  /**
   * Kích hoạt tự động khi có sự kiện (Tạo Contact mới, Gắn Tag, v.v.)
   */
  async triggerAutomations(tenantId, triggerType, contact) {
    try {
      const activeAutomations = await automationRepository.findActiveByTrigger(tenantId, triggerType);
      if (!activeAutomations || activeAutomations.length === 0) return;

      for (const automation of activeAutomations) {
        // Kiểm tra nếu Contact đang chạy dở kịch bản này
        const existingExecution = await AutomationExecution.findOne({
          automationId: automation._id,
          contactId: contact._id,
          status: 'IN_PROGRESS'
        });

        if (existingExecution) continue;

        // Khởi tạo Execution mới
        const execution = await AutomationExecution.create({
          tenantId,
          automationId: automation._id,
          contactId: contact._id,
          currentStepIndex: 0,
          status: 'IN_PROGRESS'
        });

        // Tăng tổng số lượng đã gia nhập phễu
        await Automation.findByIdAndUpdate(automation._id, {
          $inc: { 'stats.totalEntered': 1 }
        });

        // Đẩy job bước 1 vào Queue
        await automationQueue.add(`start-workflow-${execution._id}`, {
          executionId: execution._id.toString()
        });

        console.log(`🤖 [Automation Triggered]: Kịch bản "${automation.name}" khởi chạy cho Contact ${contact.email}`);
      }
    } catch (err) {
      console.error('❌ Lỗi trigger kịch bản tự động:', err.message);
    }
  }
}

export default new AutomationService();