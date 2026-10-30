import XLSX from 'xlsx';
import Contact from '../models/Contact.js';
import contactService from '../services/contact.service.js';
import { success } from '../utils/response.util.js';

class ContactController {
  async create(req, res, next) {
    try {
      const contact = await contactService.createContact(req.user.tenantId, req.body);
      return success(res, 'Thêm mới khách hàng thành công.', contact, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await contactService.getContacts(req.user.tenantId, req.query);
      return success(res, 'Lấy danh sách khách hàng thành công.', result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const contact = await contactService.getContactById(req.params.id, req.user.tenantId);
      return success(res, 'Lấy thông tin khách hàng thành công.', contact);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const contact = await contactService.updateContact(req.params.id, req.user.tenantId, req.body);
      return success(res, 'Cập nhật thông tin khách hàng thành công.', contact);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await contactService.deleteContact(req.params.id, req.user.tenantId);
      return success(res, 'Xóa khách hàng thành công.');
    } catch (error) {
      next(error);
    }
  }

  // Import dạng JSON Array sẵn có của bạn
  async import(req, res, next) {
    try {
      const { contacts } = req.body;
      const result = await contactService.importContacts(req.user.tenantId, contacts);
      return success(res, 'Import danh sách khách hàng thành công.', result);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // BỔ SUNG 1: Bấm Tải về danh bạ (EXPORT FILE EXCEL)
  // =========================================================================
  async exportExcel(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      // Lấy tất cả danh bạ của Tenant
      const contacts = await Contact.find({ tenantId }).lean();

      // Định dạng dữ liệu xuất file
      const dataToExport = contacts.map((c, index) => {
        // Ghép firstName và lastName thành Họ và Tên
        const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.fullName || c.name || '';

        return {
          'STT': index + 1,
          'Họ và Tên': fullName, // 👈 Đã sửa ghép firstName + lastName
          'Email': c.email || '',
          'Số điện thoại': c.phone || '',
          'Thẻ nhãn': Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
          'Trạng thái': c.status || 'Active',
          'Ngày tạo': c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Ba_Khach_Hang');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Danh_Ba_VERDIO_${Date.now()}.xlsx`);

      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // BỔ SUNG 2: Upload file `.xlsx` / `.csv` từ máy tính lên (IMPORT FILE EXCEL)
  // (Yêu cầu Route dùng middleware multer: upload.single('file'))
  // =========================================================================
  async importExcel(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn file Excel để tải lên.' });
      }

      // Đọc file từ Buffer
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!rawData || rawData.length === 0) {
        return res.status(400).json({ success: false, message: 'File Excel rỗng.' });
      }

      // Hàm tìm giá trị cột linh hoạt (không phân biệt chữ hoa/thường hoặc ký tự bao quanh)
      const getValue = (row, keywords) => {
        const key = Object.keys(row).find(k => 
          keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase()))
        );
        return key ? row[key] : '';
      };

      const parsedContacts = rawData.map(row => {
        const email = String(getValue(row, ['email'])).trim();
        const fullName = String(getValue(row, ['họ và tên', 'fullName', 'name', 'tên'])).trim();
        const phone = String(getValue(row, ['số điện thoại', 'phone', 'sđt'])).trim();
        const tagsRaw = getValue(row, ['thẻ nhãn', 'tag', 'tags']);

        const tags = typeof tagsRaw === 'string' 
          ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) 
          : [];

        return { email, fullName, phone, tags };
      }).filter(c => c.email && c.email.includes('@'));

      if (parsedContacts.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không tìm thấy cột chứa Email hợp lệ trong file Excel. Vui lòng kiểm tra lại tiêu đề cột!' 
        });
      }

      // Gọi service import
      const result = await contactService.importContacts(req.user.tenantId, parsedContacts);
      return success(res, `Đã import thành công ${parsedContacts.length} khách hàng từ file Excel.`, result);
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const { email, tenantId } = req.query;
      await contactService.unsubscribeContact(email, tenantId);

      // Trả về giao diện HTML phản hồi trực tiếp cho người dùng
      return res.status(200).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; min-height: 100vh;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #10b981; margin-bottom: 10px;">✅ Hủy đăng ký thành công</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Địa chỉ email <strong>${email || ''}</strong> đã được xóa khỏi danh sách nhận tin tự động của Workspace này.
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 20px;">Cảm ơn bạn đã sử dụng dịch vụ của VERDIO.</p>
          </div>
        </div>
      `);
    } catch (error) {
      next(error);
    }
  }
}

export default new ContactController();