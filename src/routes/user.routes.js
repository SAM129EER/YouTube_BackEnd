import express from "express";
import { registerController } from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema } from "../validations/user.validation.js";

const router = express.Router();

router.post("/signup", validate(registerSchema), asyncHandler(registerController));
// router.post("/login", validate(loginSchema), asyncHandler(loginController));

export default router;
