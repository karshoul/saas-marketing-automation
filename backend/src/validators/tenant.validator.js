import { z } from 'zod';

/**
 * Schema kiểm định dữ liệu Khởi tạo Workspace mới (Create Tenant Payload)
 */
export const createTenantValidator = z.object({
  name: z
    .string({ required_error: 'Tên doanh nghiệp không được để trống.' })
    .trim()
    .min(3, { message: 'Tên doanh nghiệp phải chứa ít nhất 3 ký tự.' })
    .max(100, { message: 'Tên doanh nghiệp không được vượt quá 100 ký tự.' }),
    
  slug: z
    .string({ required_error: 'Đường dẫn định danh (Slug) không được để trống.' })
    .trim()
    .toLowerCase()
    .min(3, { message: 'Slug Workspace phải chứa ít nhất 3 ký tự.' })
    .max(100, { message: 'Slug Workspace không được vượt quá 100 ký tự.' })
    .regex(/^[a-z0-9-]+$/, { 
      message: 'Slug Workspace chỉ được chứa chữ cái viết thường, số và dấu gạch ngang (e.g., can-tho-tech).' 
    })
});