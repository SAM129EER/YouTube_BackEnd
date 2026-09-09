import { z } from "zod";

export const registerSchema = z.object({
  channelName: z
    .string({ error: "Channel name is required" })
    .trim()
    .min(3, "Channel name must be at least 3 characters")
    .max(50, "Channel name must be at most 50 characters"),
  email: z
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(64, "Password must be at most 64 characters"),
  avatar: z.url("Avatar must be a valid URL").optional(),
});

export const loginSchema = z.object({
  email: z
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});
