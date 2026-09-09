import User from "../models/user.models.js";
import { hashPassword } from "../utils/bcrypt.js";
import { generateToken } from "../utils/tokens.js";

export const registerService = async (body) => {
  const { channelName, email, password, avatar } = body;

  if (!channelName || !email || !password) {
    const error = new Error("Channel name, email, and password are required");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("User already exists with this email");
    error.statusCode = 409;
    throw error;
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
