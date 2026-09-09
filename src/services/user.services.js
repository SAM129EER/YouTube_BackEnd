import User from "../models/user.models.js";
import { hashPassword } from "../utils/bcrypt.js";
import { generateToken } from "../utils/tokens.js";
import { ApiError } from "../utils/ApiError.js";

export const registerService = async (body) => {
  const { channelName, email, password, avatar } = body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    channelName,
    email,
    password: hashedPassword,
    avatar,
  });

  const accessToken = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return {
    user: userWithoutPassword,
    accessToken,
  };
};
