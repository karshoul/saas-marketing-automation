import express from 'express';
import Campaign from '../models/Campaign.js';
import protect from '../middleware/authMiddleware.js';
import cloudinary, { upload } from '../config/cloudinary.js';

const router = express.Router();

// API TẠO CHIẾN DỊCH MARKETING ĐÍNH KÈM UPLOAD BANNER
// POST: http://localhost:5000/api/campaigns
// Lưu ý: Khác với thông thường, khi upload file ta sẽ dùng định dạng "Form-data" trên Thunder Client thay vì JSON raw
router.post('/', protect, upload.single('banner'), async (req, res) => {
  try {
    const { name, subject, messageContent, targetUrl } = req.body;
    const tenantId = req.tenantId;

    let bannerUrl = '';

    // 1. Nếu chủ shop có tải ảnh banner lên, tiến hành đẩy lên Cloudinary
    if (req.file) {
      // Biển đổi file từ bộ nhớ RAM thành chuỗi base64 để Cloudinary đọc được
      const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
        folder: 'saas_marketing_banners' // Tự động tạo thư mục chứa ảnh trên Cloudinary
      });
      
      bannerUrl = uploadResponse.secure_url; // Đây là link ảnh https online của banner
    }

    // 2. BIÊN DỊCH HTML ĐỘNG: Tạo ra bộ khung Email Marketing chuẩn hiển thị
    const compiledHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        ${bannerUrl ? `<img src="${bannerUrl}" alt="Banner" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px;" />` : ''}
        <h2 style="color: #333; margin-top: 20px;">${subject}</h2>
        <p style="color: #555; line-height: 1.6; font-size: 16px;">${messageContent}</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${targetUrl || '#'}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
            Xem Ngay Cửa Hàng
          </a>
        </div>
      </div>
    `;

    // 3. Lưu toàn bộ chiến dịch kèm khung HTML đã biên dịch vào Database
    const newCampaign = new Campaign({
      tenantId,
      name,
      subject,
      htmlContent: compiledHtml,
      status: 'Draft'
    });

    await newCampaign.save();

    res.status(201).json({
      status: 'Success',
      message: 'Tạo chiến dịch marketing và biên dịch mẫu Email thành công!',
      data: newCampaign
    });

  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});


// 🔥 API KÍCH HOẠT CHIẾN DỊCH - QUÉT DATA VÀ ĐẨY VÀO HÀNG ĐỢI REDIS
// POST: http://localhost:5000/api/campaigns/MÃ_CHIẾN_DỊCH_Ở_ĐÂY/send
import { emailQueue } from '../config/queue.js';
import Contact from '../models/Contact.js';

router.post('/:id/send', protect, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const tenantId = req.tenantId;

    // 1. Tìm đúng chiến dịch cần gửi
    const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
    if (!campaign) {
      return res.status(404).json({ status: 'Fail', message: 'Không tìm thấy chiến dịch này của shop!' });
    }

    // 2. Quét sạch tất cả khách hàng (Contacts) thuộc sở hữu của shop này
    const contacts = await Contact.find({ tenantId });
    if (contacts.length === 0) {
      return res.status(400).json({ status: 'Fail', message: 'Shop của bạn chưa có khách hàng nào để gửi!' });
    }

    // 3. Cập nhật trạng thái chiến dịch sang 'Sending' và lưu tổng số job cần gửi
    campaign.status = 'Sending';
    campaign.metrics.totalSent = contacts.length;
    await campaign.save();

    // 4. Vòng lặp đẩy toàn bộ danh sách gửi vào hàng đợi Redis (BullMQ)
    for (const contact of contacts) {
      await emailQueue.add('send-individual-email', {
        campaignId: campaign._id,
        contactEmail: contact.email,
        contactName: contact.name,
        subject: campaign.subject,
        htmlContent: campaign.htmlContent
      });
    }

    res.status(200).json({
      status: 'Success',
      message: `Đã đẩy thành công ${contacts.length} email vào hàng đợi xử lý ngầm!`
    });

  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

export default router;