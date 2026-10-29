import express from "express";
import {
  registerController,
  loginController,
  logoutController,
} from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validations/user.validation.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), asyncHandler(registerController));
router.post("/signup", validate(registerSchema), asyncHandler(registerController)); // alias for backward compatibility
router.post("/login", validate(loginSchema), asyncHandler(loginController));

// Protected routes
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
