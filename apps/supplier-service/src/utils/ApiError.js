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
  static notFound(message) {
    return new ApiError(404, "NOT_FOUND", message || "Resource not found");
  }
  static conflict(message) {
    return new ApiError(409, "CONFLICT", message);
  }
  static forbidden(message) {
    return new ApiError(403, "FORBIDDEN", message || "Forbidden");
  }
  static badGateway(message) {
    return new ApiError(502, "BAD_GATEWAY", message || "Upstream provider error");
  }
  static serviceUnavailable(message) {
    return new ApiError(503, "SERVICE_UNAVAILABLE", message || "No provider available");
  }
}

module.exports = ApiError;
