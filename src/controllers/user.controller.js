import { registerService, loginService, logoutService } from "../services/user.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../utils/tokens.js";

/**
 * Controller to register a new user
 */
export const registerController = async (req, res) => {
  const result = await registerService(req.body);

  return res
    .status(201)
    .cookie("accessToken", result.accessToken, cookieOptions)
    .cookie("refreshToken", result.refreshToken, cookieOptions)
    .json(new ApiResponse(201, result, "User registered successfully"));
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
