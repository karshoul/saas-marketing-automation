import { z } from 'zod';

const strongPasswordSchema = z
  .string({ required_error: 'Mật khẩu không được để trống.' })
  .min(8, { message: 'Mật khẩu phải chứa ít nhất 8 ký tự.' })
  .max(32, { message: 'Mật khẩu không được vượt quá 32 ký tự.' })
  .regex(/[A-Z]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.' })
  .regex(/[a-z]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ cái viết thường.' })
  .regex(/[0-9]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ số.' })
  .regex(/[@$!%*?&]/, { message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&).' });

export const registerValidator = z.object({
  fullName: z.string().trim().min(3).max(50),
  workspaceName: z.string().trim().min(3).max(100),
  email: z.string().email(),
  password: strongPasswordSchema
});
export const loginValidator = z.object({
  email: z.string({ required_error: 'Email không được để trống.' }).trim().toLowerCase().email(),
  password: z.string({ required_error: 'Mật khẩu không được để trống.' })
});

export const forgotPasswordValidator = z.object({
  email: z.string({ required_error: 'Email không được để trống.' }).trim().toLowerCase().email()
});

export const resetPasswordValidator = z.object({
  password: strongPasswordSchema
});