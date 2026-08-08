import { z } from 'zod';
import { BILLING_CYCLES } from '../constants/billing/subscription.js';

/**
 * Schema kiểm định dữ liệu cập nhật hoặc khởi tạo gói cước Subscription
 */
export const updateSubscriptionValidator = z.object({
  planId: z
    .string({ required_error: 'Mã định danh Plan ID bắt buộc phải cấu hình.' })
    .regex(/^[0-9a-fA-F]{24}$/, { message: 'Plan ID không phải là một ObjectId hợp lệ của MongoDB.' }),
    
  billingCycle: z
    .string({ required_error: 'Chu kỳ thanh toán không được để trống.' })
    .uppercase()
    .refine((val) => Object.values(BILLING_CYCLES).includes(val), {
      message: 'Chu kỳ thanh toán bắt buộc phải là MONTHLY hoặc YEARLY.'
    })
});