import { registerService } from "../services/user.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerController = async (req, res) => {
  const result = await registerService(req.body);

  return res
    .status(201)
    .json(
      new ApiResponse(201, result, "User registered successfully"),
    );
};


