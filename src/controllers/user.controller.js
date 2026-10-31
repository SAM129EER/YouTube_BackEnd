import {
  registerService,
  loginService,
  logoutService,
  verifyEmailService,
  resendEmailVerificationService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/user.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../utils/tokens.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Controller to register a new user
 */
export const registerController = async (req, res) => {
  const result = await registerService(req.body);

  return res
    .status(201)
    .cookie("accessToken", result.accessToken, cookieOptions)
    .cookie("refreshToken", result.refreshToken, cookieOptions)
    .json(new ApiResponse(201, result, "User registered successfully. Verification email sent."));
};

/**
 * Controller to authenticate and log in a user
 */
export const loginController = async (req, res) => {
  const result = await loginService(req.body);

  return res
    .status(200)
    .cookie("accessToken", result.accessToken, cookieOptions)
    .cookie("refreshToken", result.refreshToken, cookieOptions)
    .json(new ApiResponse(200, result, "User logged in successfully"));
};

/**
 * Controller to log out a user and clear session cookies
 */
export const logoutController = async (req, res) => {
  if (req.user?._id) {
    await logoutService(req.user._id);
  }

  const clearCookieOptions = {
    ...cookieOptions,
    maxAge: 0,
  };

  return res
    .status(200)
    .clearCookie("accessToken", clearCookieOptions)
    .clearCookie("refreshToken", clearCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
};

/**
 * Controller to verify email via token (param, query, or body)
 */
export const verifyEmailController = async (req, res) => {
  const token = req.params.token || req.body.token || req.query.token;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const result = await verifyEmailService(token);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Email verified successfully"));
};

/**
 * Controller to resend verification email
 */
export const resendEmailVerificationController = async (req, res) => {
  const { email } = req.body;
  const result = await resendEmailVerificationService(email);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Verification email resent successfully"));
};

/**
 * Controller to request password reset link
 */
export const forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  const result = await forgotPasswordService(email);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Password reset link has been sent to your email"));
};

/**
 * Controller to reset password using token
 */
export const resetPasswordController = async (req, res) => {
  const token = req.params.token || req.body.token;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(400, "Password reset token is required");
  }

  const result = await resetPasswordService(token, password);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Password has been reset successfully"));
};
