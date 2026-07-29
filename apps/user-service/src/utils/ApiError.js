class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message) {
    return new ApiError(401, "UNAUTHORIZED", message || "Unauthorized");
  }
  static forbidden(message) {
    return new ApiError(403, "FORBIDDEN", message || "Forbidden");
  }
  static notFound(message) {
    return new ApiError(404, "NOT_FOUND", message || "Resource not found");
  }
  static conflict(message) {
    return new ApiError(409, "CONFLICT", message);
  }
}

module.exports = ApiError;
