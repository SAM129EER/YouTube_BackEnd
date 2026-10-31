import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .toLowerCase(),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must not exceed 50 characters"),
  channelName: z
    .string()
    .trim()
    .min(2, "Channel name must be at least 2 characters")
    .max(50, "Channel name must not exceed 50 characters")
    .optional(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(64, "Password must not exceed 64 characters"),
  avatar: z
    .string()
    .url("Avatar must be a valid URL")
    .optional(),
  coverImage: z
    .string()
    .url("Cover image must be a valid URL")
    .optional(),
});

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .toLowerCase()
      .optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .optional(),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required to login",
    path: ["email"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(64, "Password must not exceed 64 characters"),
    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: "Verification token is required" })
    .trim()
    .min(1, "Verification token cannot be empty"),
});

export const resendEmailVerificationSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
});
