import axios from 'axios';
import { success } from '../utils/response.util.js';

class AiController {
  // 1. GỢI Ý TIÊU ĐỀ EMAIL THU HÚT
  async suggestSubjects(req, res, next) {
    try {
      const { topic, tone = 'Hấp dẫn', category = 'MARKETING' } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (!topic) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập chủ đề chiến dịch.' });
      }

      // Khi chưa gắn GEMINI_API_KEY -> Sinh Mock Data ĐỘNG theo Phong Cách (Tone)
      if (!apiKey) {
        let mockSuggestions = [];

        if (tone.includes('Thân thiện')) {
          mockSuggestions = [
            { subject: `👋 {{firstName}} ơi, bạn đã xem qua ${topic} chưa?`, previewText: 'Gửi bạn chút thông tin hay ho hôm nay nè!' },
            { subject: `✨ Cùng {{company}} khám phá bí mật về ${topic}`, previewText: 'Góc chia sẻ trải nghiệm siêu thú vị dành riêng cho bạn.' },
            { subject: `☕ Một chút cảm hứng từ ${topic} gửi tặng {{firstName}}`, previewText: 'Hi vọng thông điệp này mang lại niềm vui cho bạn.' },
            { subject: `💌 Tin nhắn nhỏ: ${topic} đã sẵn sàng cho bạn rồi đấy!`, previewText: 'Xem ngay thông tin chi tiết bên trong nhé.' },
            { subject: `🌟 Chào {{firstName}}, bất ngờ từ ${topic} đang chờ bạn`, previewText: 'Trải nghiệm mượt mà cùng giải pháp mới.' }
          ];
        } else if (tone.includes('Chuyên nghiệp')) {
          mockSuggestions = [
            { subject: `[Thông Báo] Lộ trình triển khai ${topic} cho {{company}}`, previewText: 'Tài liệu hướng dẫn và chiến lược tối ưu hóa quy trình.' },
            { subject: `Báo cáo phân tích hiệu quả giải pháp ${topic}`, previewText: 'Cập nhật chỉ số tăng trưởng mới nhất từ hệ thống.' },
            { subject: `Gửi {{firstName}}: Bản đề xuất hợp tác về ${topic}`, previewText: 'Giải pháp nâng cao năng suất dành cho doanh nghiệp.' },
            { subject: `Chính thức ra mắt hệ thống ${topic} thế hệ mới`, previewText: 'Cam kết chất lượng và chuẩn hóa quy trình dịch vụ.' },
            { subject: `Tối ưu hóa nguồn lực cùng dự án ${topic}`, previewText: 'Trải nghiệm công nghệ tự động hóa chuẩn doanh nghiệp.' }
          ];
        } else if (tone.includes('Thúc đẩy') || tone.includes('Urgency')) {
          mockSuggestions = [
            { subject: `🔥 [Còn 24H] Ưu đãi đặc quyền cho ${topic} sắp kết thúc!`, previewText: 'Nhanh tay kích hoạt trước khi thời hạn ưu đãi khép lại.' },
            { subject: `⚡ Cảnh báo: Chỉ còn 50 suất trải nghiệm ${topic} cuối cùng!`, previewText: 'Cơ hội x3 tăng trưởng dành riêng cho {{firstName}}.' },
            { subject: `🚨 Đừng bỏ lỡ! Kích hoạt ngay ${topic} hôm nay`, previewText: 'Đặc quyền giới hạn không lặp lại lần thứ hai.' },
            { subject: `⏳ Đếm ngược: Nhận chiết khấu lớn nhất từ ${topic}`, previewText: 'Ưu đãi dành riêng cho đại diện {{company}}.' },
            { subject: `💥 Giảm ngay 50% khi đăng ký ${topic} trong hôm nay!`, previewText: 'Xác nhận suất ưu đãi của bạn ngay lập tức.' }
          ];
        } else {
          // Mặc định: Hấp dẫn & Thu hút
          mockSuggestions = [
            { subject: `🚀 [Đặc Quyền] ${topic} - Khám phá cơ hội x3 tăng trưởng!`, previewText: 'Chương trình ưu đãi giới hạn dành riêng cho đối tác.' },
            { subject: `💡 Bí quyết triển khai ${topic} hiệu quả cho {{company}}`, previewText: 'Giải pháp tối ưu hóa quy trình làm việc đột phá.' },
            { subject: `🔥 Đừng bỏ lỡ: Cập nhật mới nhất về ${topic}`, previewText: 'Thông tin quan trọng được gửi trực tiếp đến bạn.' },
            { subject: `✨ {{firstName}} ơi, giải pháp cho ${topic} đây rồi!`, previewText: 'Kích hoạt ngay trải nghiệm công nghệ tự động.' },
            { subject: `📩 Khám phá đột phá công nghệ mới từ ${topic}`, previewText: 'Hướng dẫn chi tiết và lộ trình triển khai kèm theo.' }
          ];
        }

        return success(res, `Gợi ý tiêu đề AI [Demo - ${tone}]`, mockSuggestions);
      }

      // Gọi Gemini API thật khi đã cấu hình GEMINI_API_KEY
      const prompt = `Bạn là chuyên gia Email Marketing hàng đầu. Hãy gợi ý 5 tiêu đề email và 5 đoạn preheader (xem trước) bằng tiếng Việt cho chiến dịch thuộc phân loại ${category}, chủ đề: "${topic}", phong cách giọng văn chuẩn xác: "${tone}".
Yêu cầu trả về duy nhất 1 mảng JSON thuần túy (không chứa ký tự Markdown \`\`\`json):
[
  { "subject": "Tiêu đề 1", "previewText": "Đoạn xem trước 1" },
  { "subject": "Tiêu đề 2", "previewText": "Đoạn xem trước 2" },
  { "subject": "Tiêu đề 3", "previewText": "Đoạn xem trước 3" },
  { "subject": "Tiêu đề 4", "previewText": "Đoạn xem trước 4" },
  { "subject": "Tiêu đề 5", "previewText": "Đoạn xem trước 5" }
]`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleanJsonStr);

      return success(res, 'AI gợi ý tiêu đề thành công.', suggestions);
    } catch (error) {
      console.error('Lỗi Gemini AI suggestSubjects:', error.message);
      const fallback = [
        { subject: `🚀 Cập nhật chiến dịch: ${req.body.topic}`, previewText: 'Xem thông tin chi tiết tại đây.' },
        { subject: `⚡ {{firstName}} ơi! Khám phá ngay về ${req.body.topic}`, previewText: 'Dành riêng cho bạn hôm nay.' }
      ];
      return success(res, 'Gợi ý tiêu đề (Fallback)', fallback);
    }
  }

  // 2. AI TỰ ĐỘNG SINH CẤU TRÚC MẪU EMAIL (BLOCKS)
  async generateEmailTemplate(req, res, next) {
    try {
      const { topic, category = 'MARKETING', tone = 'Chuyên nghiệp' } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (!topic) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mô tả chủ đề.' });
      }

      if (!apiKey) {
        const mockBlocks = [
          { id: `b-badge-${Date.now()}`, type: 'badge', text: tone.toUpperCase(), color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.12)', align: 'center' },
          { id: `b-heading-${Date.now()}`, type: 'heading', text: `Khám Phá ${topic}`, size: 22, color: '#ffffff', align: 'center' },
          { id: `b-text-${Date.now()}`, type: 'text', content: `Xin chào {{firstName}},\n\nChúng tôi rất vui được mang đến thông điệp về ${topic} dành riêng cho bạn tại {{company}}.`, size: 14, color: '#94a3b8', align: 'left' },
          { id: `b-card-${Date.now()}`, type: 'card', content: `⚡ Thông điệp chính: Trải nghiệm giải pháp ${topic} với phong cách ${tone}.`, bgColor: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.25)', textColor: '#c7d2fe' },
          { id: `b-btn-${Date.now()}`, type: 'button', text: 'Khám Phá Ngay →', link: 'https://verdio.io', bgColor: '#38bdf8', textColor: '#020617', align: 'center', radius: 10 },
          { id: `b-div-${Date.now()}`, type: 'divider', color: '#1e293b' },
          { id: `b-footer-${Date.now()}`, type: 'footer', text: 'Thư này được gửi tự động đến {{email}}.', unsubText: 'Hủy đăng ký', color: '#64748b' }
        ];

        return success(res, 'AI thiết kế mẫu thư (Chế độ Demo)', {
          subject: `🚀 Giải pháp ${topic}`,
          previewText: 'Thông điệp tối ưu tự động',
          blocks: mockBlocks
        });
      }

      const prompt = `Bạn là chuyên gia thiết kế giao diện email. Hãy tạo cấu trúc các khối (blocks) cho 1 mẫu email về chủ đề: "${topic}", phân loại: "${category}", phong cách: "${tone}".
Các loại block hợp lệ gồm: "badge", "heading", "text", "card", "button", "divider", "footer".
Trả về duy nhất 1 đối tượng JSON (không kèm Markdown):
{
  "subject": "Tiêu đề gợi ý",
  "previewText": "Đoạn xem trước gợi ý",
  "blocks": [
    { "id": "b-1", "type": "badge", "text": "CHỮ HUY HIỆU", "color": "#38bdf8", "bgColor": "rgba(56, 189, 248, 0.12)", "align": "center" },
    { "id": "b-2", "type": "heading", "text": "Tiêu đề chính", "size": 22, "color": "#ffffff", "align": "center" },
    { "id": "b-3", "type": "text", "content": "Nội dung đoạn văn thuyết phục...", "size": 14, "color": "#94a3b8", "align": "left" },
    { "id": "b-4", "type": "card", "content": "Khung điểm nhấn thông tin...", "bgColor": "rgba(99, 102, 241, 0.08)", "borderColor": "rgba(99, 102, 241, 0.25)", "textColor": "#c7d2fe" },
    { "id": "b-5", "type": "button", "text": "Tên Nút →", "link": "https://example.com", "bgColor": "#38bdf8", "textColor": "#020617", "align": "center", "radius": 10 },
    { "id": "b-6", "type": "divider", "color": "#1e293b" },
    { "id": "b-7", "type": "footer", "text": "Thư tự động gửi tới {{email}}.", "unsubText": "Hủy đăng ký", "color": "#64748b" }
  ]
}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedData = JSON.parse(cleanJsonStr);

      return success(res, 'AI tạo mẫu email thành công.', generatedData);
    } catch (error) {
      console.error('Lỗi Gemini AI generateEmailTemplate:', error.message);
      return res.status(500).json({ success: false, message: 'Không thể sinh mẫu email từ AI.' });
    }
  }
}

export default new AiController();