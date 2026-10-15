import mongoose from 'mongoose';
import Contact from '../models/Contact.js';
import Automation from '../models/Automation.js';
import AutomationExecution from '../models/AutomationExecution.js';
import Tenant from '../models/Tenant.js'; // 👈 Đã bổ sung import Tenant
import { automationQueue } from '../queues/automation.queue.js';
import contactRepository from '../repositories/contact.repository.js';
import ApiError from '../utils/apiError.util.js';

class ContactService {
  /**
   * Kích hoạt các Automation đang ACTIVE khi có Contact mới được tạo
   */
  async triggerContactCreatedAutomations(tenantId, contact) {
    try {
      const parsedTenantId = new mongoose.Types.ObjectId(tenantId.toString());

      // 1. Tìm tất cả kịch bản đang ACTIVE của Workspace
      const activeAutomations = await Automation.find({
        tenantId: parsedTenantId,
        status: 'ACTIVE'
      });

      // 2. Lọc kịch bản có trigger CONTACT_CREATED
      const matchingAutomations = activeAutomations.filter((auto) => {
        const trigType = typeof auto.trigger === 'string' ? auto.trigger : auto.trigger?.type;
        return trigType === 'CONTACT_CREATED';
      });

      console.log(`🤖 [AUTOMATION HOOK] Tìm thấy ${matchingAutomations.length} kịch bản ACTIVE cho contact: ${contact.email}`);

      for (const auto of matchingAutomations) {
        if (!auto.steps || auto.steps.length === 0) continue;

        // Tạo phiên chạy (Execution)
        const execution = await AutomationExecution.create({
          tenantId: parsedTenantId,
          automationId: auto._id,
          contactId: contact._id,
          currentStepIndex: 0,
          status: 'IN_PROGRESS'
        });

        // Tăng đếm "ĐÃ VÀO" (+1)
        await Automation.findByIdAndUpdate(auto._id, {
          $inc: { 'stats.totalEntered': 1 }
        });

        // Đẩy job khởi động vào hàng đợi BullMQ
        await automationQueue.add(`start-auto-${auto._id}-${contact._id}`, {
          executionId: execution._id.toString()
        });

        console.log(`⚡ [AUTOMATION HOOK] Đã đưa contact ${contact.email} vào kịch bản: ${auto.name}`);
      }
    } catch (err) {
      console.error('❌ [AUTOMATION HOOK ERROR]:', err.message);
    }
  }

  async createContact(tenantId, data) {
    if (!data?.email) {
      throw new ApiError(400, 'Địa chỉ email liên hệ là bắt buộc.');
    }
    const cleanEmail = data.email.trim().toLowerCase();

    const existing = await contactRepository.findByEmail(cleanEmail, tenantId);
    if (existing) {
      throw new ApiError(409, 'Email này đã tồn tại trong danh bạ Workspace của bạn.');
    }

    const newContact = await contactRepository.create({
      ...data,
      email: cleanEmail,
      tenantId
    });

    // Kích hoạt tự động hóa ngay sau khi lưu Contact thành công
    await this.triggerContactCreatedAutomations(tenantId, newContact);

    return newContact;
  }

  async getContacts(tenantId, query) {
    const { page = 1, limit = 10, status, tag, search } = query;
    const filter = { tenantId };

    if (status) filter.status = status;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { email: { $regex: search,$options: 'i' } },
        { firstName: { $regex: search,$options: 'i' } },
        { lastName: { $regex: search,$options: 'i' } }
      ];
    }

    return await contactRepository.findAll(filter, { page, limit });
  }

  async getContactById(id, tenantId) {
    const contact = await contactRepository.findById(id, tenantId);
    if (!contact) {
      throw new ApiError(404, 'Không tìm thấy thông tin khách hàng.');
    }
    return contact;
  }

  async updateContact(id, tenantId, updateData) {
    const contact = await contactRepository.updateById(id, tenantId, updateData);
    if (!contact) {
      throw new ApiError(404, 'Không tìm thấy thông tin khách hàng cần cập nhật.');
    }
    return contact;
  }

  async deleteContact(id, tenantId) {
    const contact = await contactRepository.deleteById(id, tenantId);
    if (!contact) {
      throw new ApiError(404, 'Không tìm thấy thông tin khách hàng cần xóa.');
    }
    return true;
  }

  async importContacts(tenantId, contactsList) {
    if (!Array.isArray(contactsList) || contactsList.length === 0) {
      throw new ApiError(400, 'Danh sách liên hệ import không hợp lệ.');
    }

    // 🛡️ Kiểm tra Quota giới hạn tổng số contact sau khi import
    const [tenant, currentCount] = await Promise.all([
      Tenant.findById(tenantId),
      contactRepository.countByTenant(tenantId)
    ]);

    const maxContacts = tenant?.quotas?.maxContacts || 500;
    const remainingSlots = Math.max(0, maxContacts - currentCount);

    if (currentCount + contactsList.length > maxContacts) {
      throw new ApiError(
        403, 
        `Số lượng import (${contactsList.length}) vượt quá hạn mức còn lại của gói (${remainingSlots} chỗ trống).`
      );
    }

    const result = await contactRepository.bulkUpsert(contactsList, tenantId);
    return {
      upsertedCount: result.upsertedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      matchedCount: result.matchedCount || 0
    };
  }
}

export default new ContactService();