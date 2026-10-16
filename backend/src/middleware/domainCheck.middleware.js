import Tenant from '../models/Tenant.js';
import ApiError from '../utils/apiError.util.js';

/**
 * 🛡️ Middleware xác thực Domain đăng ký mã nhúng
 */
export const verifyAllowedDomain = async (req, res, next) => {
  try {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const originHeader = req.headers.origin || req.headers.referer;

    // Nếu không truyền tenantId, nhường cho Controller validate
    if (!tenantId) return next();

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return next();

    // 1. Nếu Workspace chưa cài đặt allowedDomains (mảng rỗng) -> Mặc định cho phép tất cả
    if (!tenant.allowedDomains || tenant.allowedDomains.length === 0) {
      return next();
    }

    // 2. Nếu request không có Header Origin/Referer (Ví dụ gọi bằng Postman) -> Cho qua
    if (!originHeader) {
      return next();
    }

    // 3. Tách lấy hostname thuần túy (ví dụ: https://myshop.com:8080/page -> myshop.com)
    let requestDomain = '';
    try {
      requestDomain = new URL(originHeader).hostname;
    } catch {
      requestDomain = originHeader;
    }

    // 4. So sánh domain gọi lên với danh sách allowedDomains của Tenant
    const isAllowed = tenant.allowedDomains.some((domain) => {
      const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
      return cleanDomain === requestDomain || cleanDomain === '*' || cleanDomain === 'localhost';
    });

    if (!isAllowed) {
      throw new ApiError(
        403, 
        `Tên miền [${requestDomain}] chưa được cấp phép nhúng Form của Workspace này. Vui lòng thêm tên miền vào Cài Đặt Workspace.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};