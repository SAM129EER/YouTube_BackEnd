import express from "express";
import {
  registerController,
  loginController,
  logoutController,
  verifyEmailController,
  resendEmailVerificationController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendEmailVerificationSchema,
} from "../validations/user.validation.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = express.Router();

// ================= Public Authentication Routes =================
router.post("/register", validate(registerSchema), asyncHandler(registerController));
router.post("/signup", validate(registerSchema), asyncHandler(registerController)); // alias
router.post("/login", validate(loginSchema), asyncHandler(loginController));

// ================= Email Verification Routes =================
// Direct link click from verification email
router.get("/verify-email/:token", asyncHandler(verifyEmailController));
// API clients submitting token in path or body
router.post("/verify-email/:token", asyncHandler(verifyEmailController));
router.post("/verify-email", validate(verifyEmailSchema), asyncHandler(verifyEmailController));
// Resend verification email
router.post(
  "/resend-email-verification",
  validate(resendEmailVerificationSchema),
  asyncHandler(resendEmailVerificationController)
);

// ================= Password Reset Routes =================
// Request password reset link
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(forgotPasswordController)
);
// Reset password with token in URL param
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  asyncHandler(resetPasswordController)
);
// Reset password with token in body
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(resetPasswordController)
);

// ================= Protected Routes =================
router.post("/logout", verifyJWT, asyncHandler(logoutController));
router.get(
  "/current-user",
  verifyJWT,
  asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
  })
);

export default router;
