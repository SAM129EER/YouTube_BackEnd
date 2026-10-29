import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const errors = issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    }));

    return next(new ApiError(400, "Validation failed", errors));
  }

  req.body = result.data;
  next();
};
