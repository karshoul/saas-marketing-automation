import jwt from 'jsonwebtoken';

const protect = async (req, res, next) => {
  let token;

  // Kiểm tra xem chuỗi Token có nằm trong Header (Authorization: Bearer <TOKEN>) không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Cắt bỏ chữ 'Bearer ' để lấy duy nhất chuỗi mã Token bí mật
      token = req.headers.authorization.split(' ')[1];

      // Giải mã Token bằng khóa bí mật JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🔥 ĐIỂM CỐT LÕI: Đính kèm mã tenantId giải mã được vào thẳng đối tượng req
      req.tenantId = decoded.tenantId;

      // Cho phép vượt qua cửa bảo vệ để đi tiếp vào hàm xử lý API kế tiếp
      next();
    } catch (error) {
      return res.status(401).json({ status: 'Fail', message: 'Thẻ bài Token không hợp lệ hoặc đã hết hạn!' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'Fail', message: 'Bạn không có quyền truy cập, thiếu Token bảo mật!' });
  }
};

export default protect;