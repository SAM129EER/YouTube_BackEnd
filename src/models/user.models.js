import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },
    channelName: {
      type: String,
      trim: true,
      default: function () {
        return this.fullName || this.username;
      },
    },
    avatar: {
      type: String, // Cloudinary URL or image URL
      default: "https://avatar.iran.liara.run/public",
    },
    coverImage: {
      type: String, // Cloudinary URL for channel banner
      default: "",
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Prevents password from being returned in queries by default
    },
    refreshToken: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "creator", "admin"],
      default: "user",
    },
    subscribersCount: {
      type: Number,
      default: 0,
    },
    subscribedChannels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpiry: {
      type: Date,
      select: false,
    },
    forgotPasswordToken: {
      type: String,
      select: false,
    },
    forgotPasswordExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpiry;
        delete ret.forgotPasswordToken;
        delete ret.forgotPasswordExpiry;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpiry;
        delete ret.forgotPasswordToken;
        delete ret.forgotPasswordExpiry;
        return ret;
      },
    },
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to verify candidate password
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  if (!this.password) {
    throw new Error("Password field must be selected to compare");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "default_access_token_secret",
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    }
  );
};

// Method to generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "default_refresh_token_secret",
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    }
  );
};

// Method to generate Email Verification Token (stores hashed token, returns unhashed)
userSchema.methods.generateEmailVerificationToken = function () {
  const unHashedToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  this.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return unHashedToken;
};

// Method to generate Forgot Password Reset Token (stores hashed token, returns unhashed)
userSchema.methods.generateForgotPasswordToken = function () {
  const unHashedToken = crypto.randomBytes(32).toString("hex");
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
  return unHashedToken;
};

const User = mongoose.model("User", userSchema);

export default User;
