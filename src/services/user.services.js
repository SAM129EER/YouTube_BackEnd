import crypto from "crypto";
import User from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";

/**
 * Register a new user
 * @param {Object} body - User registration details
 * @returns {Promise<{ user: Object, accessToken: String, refreshToken: String }>}
 */
export const registerService = async (body) => {
  const { username, email, fullName, channelName, password, avatar, coverImage } = body;

  // 1. Check if user already exists by email or username
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(409, "User already exists with this email");
    }
    throw new ApiError(409, "User already exists with this username");
  }

  // 2. Create the user in MongoDB (Password is hashed by Mongoose pre-save hook)
  const user = await User.create({
    username,
    email,
    fullName: fullName || channelName,
    channelName: channelName || fullName || username,
    password,
    avatar: avatar || undefined,
    coverImage: coverImage || undefined,
  });

  // 3. Generate verification token & dispatch verification email
  const verificationToken = user.generateEmailVerificationToken();

  // 4. Generate JWT tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // 5. Persist refresh token & verification token to the user document
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 6. Send verification email asynchronously
  await sendVerificationEmail(user.email, verificationToken);

  // 7. Retrieve sanitized user document (omits password & refreshToken)
  const createdUser = await User.findById(user._id);

  return {
    user: createdUser,
    accessToken,
    refreshToken,
    emailVerificationSent: true,
  };
};

/**
 * Login an existing user using email or username
 * @param {Object} credentials - { email, username, password }
 * @returns {Promise<{ user: Object, accessToken: String, refreshToken: String }>}
 */
export const loginService = async ({ email, username, password }) => {
  const identifier = email || username;

  if (!identifier) {
    throw new ApiError(400, "Email or username is required");
  }

  // 1. Find user by email or username (explicitly select +password)
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist with the provided email or username");
  }

  // 2. Check if password matches
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // 3. Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // 4. Save new refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 5. Fetch sanitized user
  const loggedInUser = await User.findById(user._id);

  return {
    user: loggedInUser,
    accessToken,
    refreshToken,
  };
};

/**
 * Logout user by clearing refresh token
 * @param {String} userId - Mongo ID of the user
 */
export const logoutService = async (userId) => {
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );
};

/**
 * Verify user email with token
 * @param {String} token - Raw unhashed verification token
 * @returns {Promise<{ user: Object }>}
 */
export const verifyEmailService = async (token) => {
  if (!token) {
    throw new ApiError(400, "Email verification token is missing");
  }

  // Hash incoming raw token to match stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired email verification token");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  const sanitizedUser = await User.findById(user._id);

  return { user: sanitizedUser };
};

/**
 * Resend email verification link
 * @param {String} email - User's email
 */
export const resendEmailVerificationService = async (email) => {
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user.email, verificationToken);

  return { message: "Email verification link sent successfully" };
};

/**
 * Request password reset token
 * @param {String} email - User's email
 */
export const forgotPasswordService = async (email) => {
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist with this email address");
  }

  // Generate reset token and set expiry
  const resetToken = user.generateForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(user.email, resetToken);

  return { message: "Password reset link has been sent to your email" };
};

/**
 * Reset password using token
 * @param {String} token - Password reset token
 * @param {String} newPassword - New password
 */
export const resetPasswordService = async (token, newPassword) => {
  if (!token) {
    throw new ApiError(400, "Password reset token is missing");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  user.refreshToken = undefined; // Invalidate current session

  await user.save();

  return { message: "Password has been reset successfully. Please log in with your new password." };
};
