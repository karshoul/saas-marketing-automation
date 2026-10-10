import templateRepository from '../repositories/template.repository.js';
import ApiError from '../utils/apiError.util.js';

class TemplateService {
  async createTemplate(tenantId, data) {
    const { name, subject, htmlContent, previewText, category, thumbnail } = data;

    if (!name || !name.trim()) {
      throw new ApiError(400, 'Tên mẫu thư không được để trống.');
    }
    if (!subject || !subject.trim()) {
      throw new ApiError(400, 'Tiêu đề email mặc định không được để trống.');
    }
    if (!htmlContent || !htmlContent.trim()) {
      throw new ApiError(400, 'Nội dung mã HTML không được để trống.');
    }

    return await templateRepository.create({
      tenantId,
      name: name.trim(),
      subject: subject.trim(),
      previewText: previewText?.trim() || '',
      htmlContent,
      category: category || 'MARKETING',
      thumbnail: thumbnail || ''
    });
  }

  async getTemplates(tenantId, query = {}) {
    const { page = 1, limit = 12, search, category } = query;
    const filter = { tenantId };

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { subject: searchRegex }
      ];
    }

    return await templateRepository.findAll(filter, { page, limit });
  }

  async getTemplateById(id, tenantId) {
    const template = await templateRepository.findById(id, tenantId);
    if (!template) {
      throw new ApiError(404, 'Không tìm thấy mẫu thư yêu cầu.');
    }
    return template;
  }

  async updateTemplate(id, tenantId, updateData) {
    const template = await templateRepository.updateById(id, tenantId, updateData);
    if (!template) {
      throw new ApiError(404, 'Không tìm thấy mẫu thư để cập nhật.');
    }
    return template;
  }

  async deleteTemplate(id, tenantId) {
    const template = await templateRepository.deleteById(id, tenantId);
    if (!template) {
      throw new ApiError(404, 'Không tìm thấy mẫu thư để xóa.');
    }
    return true;
  }

  async cloneTemplate(id, tenantId) {
    const original = await templateRepository.findById(id, tenantId);
    if (!original) {
      throw new ApiError(404, 'Không tìm thấy mẫu thư gốc để nhân bản.');
    }

    return await templateRepository.create({
      tenantId,
      name: `${original.name} (Bản sao)`,
      subject: original.subject,
      previewText: original.previewText,
      htmlContent: original.htmlContent,
      category: original.category,
      thumbnail: original.thumbnail
    });
  }
}

export default new TemplateService();