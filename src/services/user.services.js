import User from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";

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

  // 3. Generate JWT tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // 4. Persist refresh token to the user document
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 5. Retrieve sanitized user document (omits password & refreshToken)
  const createdUser = await User.findById(user._id);

  return {
    user: createdUser,
    accessToken,
    refreshToken,
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
